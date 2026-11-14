export type ExtractedField = {
  key: string;
  label: string;
  value: string;
  evidence: string;
  status: "found" | "review" | "missing";
};

export type TradeLineItem = {
  lineNumber: string;
  hsCode: string;
  description: string;
  quantity: string;
  unit: string;
  unitPrice: string;
  amount: string;
  evidence: string;
};

export type InternalValidation = {
  key: string;
  label: string;
  status: "consistent" | "mismatch" | "unable";
  expected: string;
  actual: string;
  evidence: string;
};

export type DocumentAnalysis = {
  fields: ExtractedField[];
  productDescription: string;
  lineItems: TradeLineItem[];
  validations: InternalValidation[];
  productAttributes: { label: string; found: boolean; evidence: string }[];
};

const FIELD_DEFINITIONS = [
  { key: "invoiceNumber", label: "Invoice number", aliases: ["invoice no", "invoice number", "commercial invoice no", "commercial invoice number", "invoice #"] },
  { key: "invoiceDate", label: "Invoice date", aliases: ["invoice date", "date of issue", "issue date"] },
  { key: "exporter", label: "Exporter / seller", aliases: ["exporter", "seller", "shipper", "supplier"] },
  { key: "importer", label: "Importer / buyer", aliases: ["importer", "buyer", "consignee", "customer"] },
  { key: "description", label: "Goods description", aliases: ["goods description", "description of goods", "product description", "description", "item", "product"] },
  { key: "quantity", label: "Quantity", aliases: ["total quantity", "quantity", "qty"] },
  { key: "currency", label: "Currency", aliases: ["currency"] },
  { key: "subtotal", label: "Subtotal", aliases: ["subtotal", "sub total", "goods subtotal"] },
  { key: "total", label: "Invoice total", aliases: ["total invoice value", "invoice total", "grand total", "total amount", "amount due", "total"] },
  { key: "hsCode", label: "HS code (as stated)", aliases: ["hs code", "hs codes", "harmonized code", "commodity code"] },
  { key: "packages", label: "Packages", aliases: ["total packages", "total cartons", "total boxes", "number of packages", "no of packages", "packages", "cartons"] },
  { key: "grossWeight", label: "Gross weight", aliases: ["total gross weight", "gross weight", "gross wt"] },
  { key: "netWeight", label: "Net weight", aliases: ["total net weight", "net weight", "net wt"] },
] as const;

function clean(value: string) {
  return value.trim().replace(/\s+/g, " ").replace(/[;,]+$/, "");
}

function normalizeLabel(value: string) {
  return value.toLowerCase().replace(/^\s*(?:\d+[.)]|[-*])\s*/, "").replace(/[^a-z0-9]+/g, " ").trim();
}

function normalizedLines(text: string) {
  return text.replace(/\r/g, "").replace(/\u00a0/g, " ").split("\n").map((line) => line.trim()).filter(Boolean);
}

function labelMatches(label: string, aliases: readonly string[]) {
  const normalized = normalizeLabel(label);
  const segments = label.split("/");
  return aliases.some((alias) => normalized === normalizeLabel(alias) ||
    segments.some((segment) => normalizeLabel(segment) === normalizeLabel(alias)));
}

function findLabelValue(lines: string[], aliases: readonly string[]) {
  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index].replace(/^\s*(?:\d+[.)]|[-*])\s*/, "").trim();
    const colonIndex = line.indexOf(":");
    if (colonIndex >= 0) {
      const label = line.slice(0, colonIndex);
      if (labelMatches(label, aliases)) {
        const inline = clean(line.slice(colonIndex + 1));
        if (inline) return { value: inline, evidence: line };
        const next = lines[index + 1];
        if (next) return { value: clean(next), evidence: line + " → " + clean(next) };
      }
      continue;
    }
    if (labelMatches(line, aliases) || line.split("/").some((part) => labelMatches(part, aliases))) {
      const next = lines[index + 1];
      if (next) return { value: clean(next), evidence: line + " → " + clean(next) };
    }
  }
  return { value: "", evidence: "" };
}

function findPartyValue(lines: string[], aliases: readonly string[]) {
  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index].replace(/^\s*(?:\d+[.)]|[-*•])\s*/, "").trim();
    const colonIndex = line.indexOf(":");
    const label = colonIndex >= 0 ? line.slice(0, colonIndex) : line;
    if (!labelMatches(label, aliases)) continue;
    const inline = colonIndex >= 0 ? clean(line.slice(colonIndex + 1)) : "";
    if (inline && !/^company name$/i.test(inline)) return { value: inline, evidence: line };
    for (let nextIndex = index + 1; nextIndex < Math.min(index + 6, lines.length); nextIndex += 1) {
      const candidate = lines[nextIndex].replace(/^\s*(?:\d+[.)]|[-*•])\s*/, "").trim();
      if (/^(?:buyer|seller|shipper|exporter|importer|consignee|notify party|shipment|line items|packing|bank details)\b/i.test(candidate)) break;
      const company = candidate.match(/^(?:company\s+name|legal\s+name)\s*:\s*(.+)$/i);
      if (company?.[1]) return { value: clean(company[1]), evidence: line + " → " + candidate };
      if (candidate && !candidate.includes(":")) return { value: clean(candidate), evidence: line + " → " + candidate };
    }
  }
  return { value: "", evidence: "" };
}

function findFirstMatch(lines: string[], patterns: RegExp[]) {
  for (const pattern of patterns) {
    for (const line of lines) {
      const match = line.match(pattern);
      if (match?.[1]) return { value: clean(match[1]), evidence: line };
    }
  }
  return { value: "", evidence: "" };
}

function splitTableCells(line: string) {
  if (line.includes("|")) return line.split("|").map((cell) => clean(cell).replace(/^\\*+|\\*+$/g, ""));
  if (line.includes("\t")) return line.split("\t").map((cell) => clean(cell));
  return [];
}

function parseQuantity(value: string) {
  const match = value.replace(/,/g, "").match(/^([\d.]+)\s*([a-z]+)?/i);
  return { quantity: match?.[1] ?? "", unit: (match?.[2] ?? "").toUpperCase() };
}

function parseLineItems(lines: string[]): TradeLineItem[] {
  const items: TradeLineItem[] = [];
  const rowPattern = /^\s*(\d{1,4})\s+(?:(\d{4}(?:\.\d{2}){1,3}|\d{6,10})\s+)?(.+?)\s+(\d[\d,]*(?:\.\d+)?)\s+(PCS?|PIECES?|SETS?|UNITS?|PAIRS?|KG|KGS|BOXES?|CARTONS?)\s+[$€£]?([\d,]+(?:\.\d{1,2})?)\s+[$€£]?([\d,]+(?:\.\d{1,2})?)\s*$/i;
  for (const line of lines) {
    const match = line.match(rowPattern);
    if (match) {
      items.push({ lineNumber: match[1], hsCode: match[2] ?? "", description: clean(match[3]), quantity: clean(match[4]), unit: match[5].toUpperCase(), unitPrice: clean(match[6]), amount: clean(match[7]), evidence: line });
    }
  }

  for (let index = 0; index < lines.length; index += 1) {
    const header = splitTableCells(lines[index]).map((cell) => cell.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim());
    if (!header.length || !header.some((cell) => /description of goods|goods description|description/.test(cell)) ||
        !header.some((cell) => /qty|quantity/.test(cell))) continue;
    const column = (pattern: RegExp) => header.findIndex((cell) => pattern.test(cell));
    const descriptionIndex = column(/description of goods|goods description|description/);
    const hsIndex = column(/^hs code$|^hs code stated$/);
    const quantityIndex = column(/qty|quantity/);
    const unitIndex = column(/^unit$|unit of measure/);
    const unitPriceIndex = column(/unit price/);
    const amountIndex = column(/total amount|amount/);
    for (let row = index + 1; row < lines.length; row += 1) {
      const cells = splitTableCells(lines[row]);
      if (!cells.length || cells.length <= Math.max(descriptionIndex, quantityIndex) || /^total$/i.test((cells[0] ?? "").replace(/\\*/g, "").trim())) break;
      const description = cells[descriptionIndex] ?? "";
      if (!description || /^total$/i.test(description)) break;
      const qty = parseQuantity(cells[quantityIndex] ?? "");
      if (!qty.quantity) continue;
      const unit = (unitIndex >= 0 ? cells[unitIndex] : qty.unit) || qty.unit;
      items.push({
        lineNumber: String(items.length + 1),
        hsCode: hsIndex >= 0 ? cells[hsIndex] ?? "" : "",
        description,
        quantity: qty.quantity,
        unit: unit.toUpperCase(),
        unitPrice: unitPriceIndex >= 0 ? (cells[unitPriceIndex] ?? "").replace(/[$€£]/g, "") : "",
        amount: amountIndex >= 0 ? (cells[amountIndex] ?? "").replace(/[$€£]/g, "") : "",
        evidence: lines[row],
      });
    }
    break;
  }
  return items;
}
function amountToNumber(value: string) {
  const match = value.replace(/,/g, "").match(/\d+(?:\.\d{1,2})?/);
  return match ? Number(match[0]) : Number.NaN;
}

function extractCurrency(text: string) {
  return text.match(/\b(USD|EUR|GBP|AED|SAR|PKR|CNY|JPY)\b/i)?.[1]?.toUpperCase() ?? "";
}

export function analyzeTradeDocument(text: string): DocumentAnalysis {
  const lines = normalizedLines(text);
  const lineItems = parseLineItems(lines);
  const values = new Map<string, { value: string; evidence: string }>();

  for (const definition of FIELD_DEFINITIONS) {
    values.set(definition.key, findLabelValue(lines, definition.aliases));
  }

  const exporter = findPartyValue(lines, ["shipper / exporter", "exporter / shipper", "seller / exporter", "exporter", "seller", "shipper", "supplier"]);
  const importer = findPartyValue(lines, ["consignee / buyer", "buyer / consignee", "importer / buyer", "importer", "buyer", "consignee", "customer"]);
  values.set("exporter", exporter.value ? exporter : findLabelValue(lines, ["exporter", "seller", "shipper", "supplier"]));
  values.set("importer", importer.value ? importer : findLabelValue(lines, ["importer", "buyer", "consignee", "customer"]));

  const total = findFirstMatch(lines, [
    /^(?:total\s+invoice\s+value|total\s+invoice\s+amount|invoice\s+total|grand\s+total|total\s+amount|amount\s+due)\s*[:-]?\s*(?:(?:USD|EUR|GBP|AED|SAR|PKR|CNY|JPY)\s*)?[$€£]?([\d,]+(?:\.\d{1,2})?)\b/i,
  ]);
  if (total.value) values.set("total", total);
  const subtotal = findFirstMatch(lines, [/^sub\s*total\s*[:-]?\s*(?:(?:USD|EUR|GBP|AED|SAR|PKR|CNY|JPY)\s*)?[$€£]?([\d,]+(?:\.\d{1,2})?)\b/i]);
  if (subtotal.value) values.set("subtotal", subtotal);

  const gross = findFirstMatch(lines, [
    /^total\s+gross\s+(?:weight|wt)\s*[:-]?\s*([\d,]+(?:\.\d+)?\s*(?:kg|kgs|lb|lbs|tons?)?)/i,
    /^gross\s+(?:weight|wt)\s*[:-]?\s*([\d,]+(?:\.\d+)?\s*(?:kg|kgs|lb|lbs|tons?)?)/i,
  ]);
  const net = findFirstMatch(lines, [
    /^total\s+net\s+(?:weight|wt)\s*[:-]?\s*([\d,]+(?:\.\d+)?\s*(?:kg|kgs|lb|lbs|tons?)?)/i,
    /^net\s+(?:weight|wt)\s*[:-]?\s*([\d,]+(?:\.\d+)?\s*(?:kg|kgs|lb|lbs|tons?)?)/i,
  ]);
  if (gross.value) values.set("grossWeight", gross);
  if (net.value) values.set("netWeight", net);

  const packages = findFirstMatch(lines, [
    /^total\s+(?:number\s+of\s+)?(?:packages|cartons|boxes)\s*[:-]?\s*([\d,]+\s*(?:cartons?|boxes?|pallets?|packages?)?)/i,
    /^(?:number\s+of\s+)?(?:packages|cartons|boxes)\s*[:-]?\s*([\d,]+\s*(?:cartons?|boxes?|pallets?|packages?)?)/i,
  ]);
  if (packages.value) values.set("packages", packages);

  const hsCodes = [...new Set(lineItems.map((item) => item.hsCode).filter(Boolean))];
  if (hsCodes.length) values.set("hsCode", { value: hsCodes.join(", "), evidence: lineItems.map((item) => item.evidence).join(" | ") });

  const currency = extractCurrency(text);
  if (currency) values.set("currency", { value: currency, evidence: lines.find((line) => new RegExp("\\b" + currency + "\\b", "i").test(line)) ?? currency });

  if (lineItems.length) {
    values.set("description", { value: lineItems.map((item) => item.description).join("; "), evidence: lineItems.map((item) => item.evidence).join(" | ") });
    values.set("quantity", { value: lineItems.map((item) => item.quantity + " " + item.unit).join("; "), evidence: lineItems.map((item) => item.evidence).join(" | ") });
  }

  const fields: ExtractedField[] = FIELD_DEFINITIONS.map(({ key, label }) => {
    const found = values.get(key) ?? { value: "", evidence: "" };
    return { key, label, value: found.value, evidence: found.evidence, status: found.value ? "found" : "missing" };
  });

  const productDescription = lineItems.length
    ? lineItems.map((item) => item.description).join("; ")
    : values.get("description")?.value ?? "";

  const attributeRules = [
    { label: "Material / composition", pattern: /\b(stainless steel|steel|aluminium|aluminum|plastic|rubber|cotton|polyester|wood|ceramic|copper|brass|alloy)\b/i },
    { label: "Intended use / function", pattern: /\b(used for|designed for|intended for|application\s*:\s*|for use in)\b[^,;.]*/i },
    { label: "Model / part number", pattern: /\b(model|part\s*(?:no|number)|p\/n|sku)\s*[:#-]?\s*[A-Z0-9-]+/i },
    { label: "Dimensions / size", pattern: /\b\d+(?:\.\d+)?\s*[x×]\s*\d+(?:\.\d+)?\s*(?:mm|cm|m)?\b|\b\d+(?:\.\d+)?\s*(?:mm|cm|m|inch|inches|")\b/i },
    { label: "Power / capacity", pattern: /\b\d+(?:\.\d+)?\s*(?:w|kw|v|volt|amps?|mah|litres?|liters?|ml)\b/i },
  ];
  const productAttributes = attributeRules.map((rule) => {
    const match = productDescription.match(rule.pattern);
    return { label: rule.label, found: Boolean(match), evidence: match?.[0] ?? "" };
  });

  const validations: InternalValidation[] = [];
  const subtotalValue = values.get("subtotal")?.value || values.get("total")?.value || "";
  if (lineItems.length && subtotalValue) {
    const calculated = lineItems.reduce((sum, item) => sum + amountToNumber(item.amount), 0);
    const stated = amountToNumber(subtotalValue);
    const matches = Number.isFinite(calculated) && Number.isFinite(stated) && Math.abs(calculated - stated) < 0.011;
    validations.push({
      key: "line-item-subtotal",
      label: values.get("subtotal")?.value ? "Line items vs subtotal" : "Line items vs invoice total",
      status: matches ? "consistent" : "mismatch",
      expected: calculated.toFixed(2),
      actual: stated.toFixed(2),
      evidence: lineItems.map((item) => item.amount).join(" + ") + " = " + calculated.toFixed(2) + "; stated subtotal " + subtotalValue,
    });
  } else {
    validations.push({ key: "line-item-subtotal", label: "Line items vs subtotal", status: "unable", expected: "", actual: subtotalValue, evidence: "A complete set of line-item amounts and a stated subtotal were not both available." });
  }

  const cartonRows = lines.flatMap((line) => {
    const match = line.match(/^\s*(?:(?:item|line|product)\s*)?#?\d+\b.*?\b([\d,]+)\s*(?:cartons?|boxes?|packages?)\b/i);
    return match ? [Number(match[1].replace(/,/g, ""))] : [];
  });
  for (let index = 0; index < lines.length; index += 1) {
    const header = splitTableCells(lines[index]).map((cell) => cell.toLowerCase());
    const packageIndex = header.findIndex((cell) => /no\.? of packages|number of packages|packages/.test(cell));
    if (packageIndex < 0 || !header.some((cell) => /description of goods|goods description/.test(cell))) continue;
    for (let row = index + 1; row < lines.length; row += 1) {
      const cells = splitTableCells(lines[row]);
      if (!cells.length || cells.length <= packageIndex || /^total$/i.test((cells[0] ?? "").replace(/\\*/g, "").trim())) break;
      const count = amountToNumber(cells[packageIndex]);
      if (Number.isFinite(count)) cartonRows.push(count);
    }
    break;
  }
  const statedPackages = values.get("packages")?.value ?? "";
  if (cartonRows.length && statedPackages) {
    const calculated = cartonRows.reduce((sum, count) => sum + count, 0);
    const stated = amountToNumber(statedPackages);
    const matches = Number.isFinite(stated) && calculated === stated;
    validations.push({
      key: "carton-count",
      label: "Line carton counts vs total packages",
      status: matches ? "consistent" : "mismatch",
      expected: String(calculated),
      actual: statedPackages,
      evidence: cartonRows.join(" + ") + " = " + calculated + "; stated total " + statedPackages,
    });
  }

  return { fields, productDescription, lineItems, validations, productAttributes };
}

export type ComparisonRow = {
  key: string;
  label: string;
  invoiceValue: string;
  packingValue: string;
  status: "consistent" | "mismatch" | "unable" | "invoice-only" | "packing-only";
};

export function compareTradeDocuments(invoiceText: string, packingText: string): ComparisonRow[] {
  const invoice = analyzeTradeDocument(invoiceText);
  const packing = analyzeTradeDocument(packingText);
  const keys = ["invoiceNumber", "exporter", "importer", "description", "quantity", "hsCode", "packages", "grossWeight", "netWeight"] as const;
  return keys.map((key) => {
    const left = invoice.fields.find((field) => field.key === key)?.value ?? "";
    const right = packing.fields.find((field) => field.key === key)?.value ?? "";
    const normalize = (value: string) => value.toLowerCase().replace(/[^a-z0-9]/g, "");
    const status = !left && !right ? "unable"
      : left && !right ? "invoice-only"
      : !left && right ? "packing-only"
      : normalize(left) === normalize(right) ? "consistent" : "mismatch";
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
