export type ExtractedField = {
  key: string;
  label: string;
  value: string;
  evidence: string;
  status: "found" | "review" | "missing";
};

export type DocumentAnalysis = {
  fields: ExtractedField[];
  productDescription: string;
  productAttributes: { label: string; found: boolean; evidence: string }[];
};

const FIELD_PATTERNS: Array<{ key: string; label: string; pattern: RegExp }> = [
  { key: "invoiceNumber", label: "Invoice number", pattern: /(?:commercial\s+)?invoice\s*(?:no\.?|number|#)\s*[:#-]?\s*([A-Z0-9][A-Z0-9/_-]{2,})/i },
  { key: "invoiceDate", label: "Invoice date", pattern: /(?:invoice\s+date|date\s+of\s+issue|date)\s*[:#-]?\s*([^\n\r]+)/i },
  { key: "exporter", label: "Exporter / seller", pattern: /(?:exporter|shipper|seller|supplier)\s*[:#-]?\s*([^\n\r]+)/i },
  { key: "importer", label: "Importer / buyer", pattern: /(?:importer|consignee|buyer)\s*[:#-]?\s*([^\n\r]+)/i },
  { key: "description", label: "Goods description", pattern: /(?:goods\s+description|description\s+of\s+goods|product\s+description|description)\s*[:#-]?\s*([^\n\r]+)/i },
  { key: "quantity", label: "Quantity", pattern: /(?:total\s+)?quantity\s*[:#-]?\s*([\d,.]+\s*(?:pcs?|pieces?|units?|sets?|kg|kgs|tons?|pairs?)?)/i },
  { key: "currency", label: "Currency", pattern: /\b(USD|EUR|GBP|AED|SAR|PKR|CNY|JPY)\b/i },
  { key: "total", label: "Invoice total", pattern: /(?:invoice\s+total|grand\s+total|total\s+amount|amount\s+due)\s*[:#-]?\s*((?:USD|EUR|GBP|AED|SAR|PKR|CNY|JPY)?\s*[\d,]+(?:\.\d{1,2})?)/i },
  { key: "hsCode", label: "HS code (as stated)", pattern: /(?:hs\s*(?:code)?|harmonized\s+code)\s*[:#-]?\s*([0-9. -]{6,})/i },
  { key: "packages", label: "Packages", pattern: /(?:total\s+)?(?:number\s+of\s+)?packages?\s*[:#-]?\s*([\d,.]+\s*(?:cartons?|boxes?|pallets?|packages?)?)/i },
  { key: "grossWeight", label: "Gross weight", pattern: /gross\s+weight\s*[:#-]?\s*([\d,.]+\s*(?:kg|kgs|lb|lbs|tons?)?)/i },
  { key: "netWeight", label: "Net weight", pattern: /net\s+weight\s*[:#-]?\s*([\d,.]+\s*(?:kg|kgs|lb|lbs|tons?)?)/i },
];

function clean(value: string) {
  return value.trim().replace(/\s+/g, " ").replace(/[;,]+$/, "");
}

function findField(text: string, pattern: RegExp) {
  const match = text.match(pattern);
  if (!match?.[1]) return { value: "", evidence: "" };
  const value = clean(match[1]);
  const line = text.split(/\r?\n/).find((item) => item.toLowerCase().includes(match[0].slice(0, Math.min(12, match[0].length)).toLowerCase()));
  return { value, evidence: line ? clean(line) : clean(match[0]) };
}

export function analyzeTradeDocument(text: string): DocumentAnalysis {
  const fields = FIELD_PATTERNS.map(({ key, label, pattern }) => {
    const found = findField(text, pattern);
    return {
      key,
      label,
      value: found.value,
      evidence: found.evidence,
      status: found.value ? "found" as const : "missing" as const,
    };
  });
  const productDescription = fields.find((field) => field.key === "description")?.value ?? "";
  const attributeRules = [
    { label: "Material / composition", pattern: /\b(stainless steel|steel|aluminium|aluminum|plastic|rubber|cotton|polyester|wood|ceramic|copper|brass|alloy)\b/i },
    { label: "Intended use / function", pattern: /\b(for|used for|designed to|application|用途)\b/i },
    { label: "Model / part number", pattern: /\b(model|part\s*(?:no|number)|p\/n|sku)\s*[:#-]?\s*[A-Z0-9-]+/i },
    { label: "Dimensions / size", pattern: /\b\d+(?:\.\d+)?\s*(?:mm|cm|m|inch|inches|")\b/i },
    { label: "Power / capacity", pattern: /\b\d+(?:\.\d+)?\s*(?:w|kw|v|volt|amps?|mah|litres?|liters?|ml)\b/i },
  ];
  return {
    fields,
    productDescription,
    productAttributes: attributeRules.map((rule) => {
      const match = text.match(rule.pattern);
      return { label: rule.label, found: Boolean(match), evidence: match?.[0] ?? "" };
    }),
  };
}

export type ComparisonRow = {
  key: string;
  label: string;
  invoiceValue: string;
  packingValue: string;
  status: "consistent" | "mismatch" | "unable";
};

export function compareTradeDocuments(invoiceText: string, packingText: string): ComparisonRow[] {
  const invoice = analyzeTradeDocument(invoiceText);
  const packing = analyzeTradeDocument(packingText);
  const keys = ["invoiceNumber", "exporter", "importer", "description", "quantity", "hsCode", "packages", "grossWeight", "netWeight"] as const;
  return keys.map((key) => {
    const left = invoice.fields.find((field) => field.key === key)?.value ?? "";
    const right = packing.fields.find((field) => field.key === key)?.value ?? "";
    const normalize = (value: string) => value.toLowerCase().replace(/[^a-z0-9]/g, "");
    const status = !left || !right ? "unable" : normalize(left) === normalize(right) ? "consistent" : "mismatch";
    return {
      key,
      label: invoice.fields.find((field) => field.key === key)?.label ?? key,
      invoiceValue: left,
      packingValue: right,
      status,
    };
  });
}

export function buildMissingDocumentDraft(shipmentReference: string, missingDocuments: string[]) {
  const list = missingDocuments.map((item) => `- ${item}`).join("\n");
  return {
    subject: `Documents pending for shipment ${shipmentReference}`,
    body: `Hello,\n\nWe are preparing the document set for shipment ${shipmentReference}. Could you please share the following items, if applicable to this shipment?\n\n${list}\n\nPlease let us know if any item is not applicable or if an alternative document is available.\n\nThank you,\nLogistics coordination team`,
  };
}
