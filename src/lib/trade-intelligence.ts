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
  { key: "invoiceNumber", label: "Invoice number", aliases: ["invoice no", "invoice number", "invoice reference", "commercial invoice no", "commercial invoice number", "reference commercial invoice no", "reference invoice no", "reference invoice number", "invoice #"] },
  { key: "bookingReference", label: "Booking reference", aliases: ["booking reference", "booking ref", "booking number", "booking no", "booking #"] },
  { key: "purchaseOrderNumber", label: "Purchase order number", aliases: ["purchase order number", "purchase order no", "purchase order #", "po number", "po no", "po #"] },
  { key: "invoiceDate", label: "Invoice date", aliases: ["invoice date", "date of issue", "issue date"] },
  { key: "exporter", label: "Exporter / seller", aliases: ["exporter", "seller", "shipper", "supplier"] },
  { key: "importer", label: "Importer / buyer", aliases: ["importer", "buyer", "consignee", "customer"] },
  { key: "description", label: "Goods description", aliases: ["goods description", "description of goods", "product description", "description", "item", "product"] },
  { key: "quantity", label: "Quantity", aliases: ["total quantity", "quantity", "qty"] },
  { key: "currency", label: "Currency", aliases: ["currency"] },
  { key: "subtotal", label: "Subtotal", aliases: ["subtotal", "sub total", "goods subtotal"] },
  { key: "total", label: "Invoice total", aliases: ["total invoice value", "invoice total", "grand total", "total amount", "amount due", "total"] },
  { key: "hsCode", label: "HS code (as stated)", aliases: ["hs code", "hs codes", "harmonized code", "commodity code"] },
  { key: "packages", label: "Packages", aliases: ["total packages", "total cartons", "total boxes", "number of packages", "no of packages", "packages", "cartons", "ctns", "pkgs", "boxes"] },
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
      // Ignore visual dividers between party headers and the actual company details.
      if (/^[-_=*\s]+$/.test(candidate)) continue;
      if (/^(?:buyer|seller|shipper|exporter|importer|consignee|notify party|shipment|line items|packing|bank details)\b/i.test(candidate)) break;
      const namedValue = candidate.match(/^(?:name|company\s+name|legal\s+name)\s*:\s*(.+)$/i);
      if (namedValue?.[1]) return { value: clean(namedValue[1]), evidence: line + " → " + candidate };
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
  if (line.includes("|")) return line.split("|").map((cell) => clean(cell).replace(/^\*+|\*+$/g, ""));
  if (line.includes("\t")) return line.split("\t").map((cell) => clean(cell));
  return [];
}

function parseQuantity(value: string) {
  const match = value.match(/^([\d,]+(?:\.\d+)?)\s*([a-z]+)?/i);
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
      if (!cells.length || cells.length <= Math.max(descriptionIndex, quantityIndex) || /^total$/i.test((cells[0] ?? "").replace(/\*/g, "").trim())) break;
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

function parseCsvRecord(line: string): string[] {
  const cells: string[] = [];
  let cell = "";
  let quoted = false;
  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];
    if (char === '"') {
      if (quoted && line[index + 1] === '"') {
        cell += '"';
        index += 1;
      } else quoted = !quoted;
    } else if (char === "," && !quoted) {
      cells.push(cell.trim());
      cell = "";
    } else cell += char;
  }
  cells.push(cell.trim());
  return cells;
}

function normalizeCsvInvoiceText(text: string): string {
  const rows = text.replace(/^\uFEFF/, "").replace(/\r/g, "").split("\n").filter((line) => line.trim());
  if (rows.length < 2 || !rows[0].includes(",")) return text;
  const headers = parseCsvRecord(rows[0]).map(normalizeLabel);
  const records = rows.slice(1).map(parseCsvRecord).filter((row) => row.some((cell) => cell.trim()));
  const hasInvoiceHeader = headers.some((header) =>
    /^(?:invoice number|invoice no|supplier|seller|exporter|buyer|importer|goods description|description|quantity|unit price|total amount)$/.test(header),
  );
  if (!hasInvoiceHeader || !records.length) return text;

  const column = (...names: string[]) => headers.findIndex((header) => names.includes(header));
  const value = (row: string[], ...names: string[]) => {
    const index = column(...names);
    return index >= 0 ? (row[index] ?? "").trim() : "";
  };
  const output: string[] = ["COMMERCIAL INVOICE"];
  const first = records[0];
  const add = (label: string, content: string) => { if (content) output.push(label + ": " + content); };
  add("Invoice Number", value(first, "invoice number", "invoice no"));
  add("Booking Reference", value(first, "booking reference", "booking ref"));
  add("Purchase Order Number", value(first, "purchase order number", "purchase order no", "po number", "po no"));
  add("Invoice Date", value(first, "invoice date", "date"));
  add("Exporter / Seller", value(first, "supplier", "seller", "exporter", "shipper"));
  add("Importer / Buyer", value(first, "buyer", "importer", "consignee", "customer"));
  add("Currency", value(first, "currency"));
  add("Subtotal", value(first, "subtotal", "sub total"));
  add("Invoice Total", value(first, "invoice total", "grand total", "total amount", "total"));
  add("HS Code", value(first, "hs code", "commodity code"));
  add("Packages", value(first, "packages", "cartons", "number of packages"));
  add("Gross Weight", value(first, "gross weight", "gross weight kg"));
  add("Net Weight", value(first, "net weight", "net weight kg"));
  add("Country of Origin", value(first, "country of origin", "origin"));
  add("Material", value(first, "material", "composition"));
  add("Weight", value(first, "weight kg", "weight"));
  const descriptionIndex = column("description", "goods description", "product description", "item description");
  const quantityIndex = column("quantity", "qty");
  const unitIndex = column("unit", "unit of measure", "uom");
  const priceIndex = column("unit price", "price per unit");
  const amountIndex = column("line item total", "total amount", "amount");
  const hsIndex = column("hs code", "commodity code");
  if (descriptionIndex >= 0 && quantityIndex >= 0 && priceIndex >= 0 && amountIndex >= 0) {
    output.push("ITEM DETAILS");
    records.forEach((row, index) => {
      const description = row[descriptionIndex] ?? "";
      const quantity = row[quantityIndex] ?? "";
      const unit = unitIndex >= 0 ? row[unitIndex] ?? "" : "";
      const price = row[priceIndex] ?? "";
      const amount = row[amountIndex] ?? "";
      const hs = hsIndex >= 0 ? (row[hsIndex] ?? "") + " " : "";
      if (description && quantity && price && amount) {
        output.push([String(index + 1), hs + description, quantity, unit, price.replace(/\b(?:USD|EUR|GBP|AED|SAR|PKR|CNY|JPY)\b\s*/i, ""), amount.replace(/\b(?:USD|EUR|GBP|AED|SAR|PKR|CNY|JPY)\b\s*/i, "")].filter(Boolean).join(" "));
      } else {
        add("Goods Description", description);
        add("Quantity", [quantity, unit].filter(Boolean).join(" "));
      }
    });
    if (records.length === 1 && amountIndex >= 0 && !value(first, "invoice total", "grand total", "total amount", "total")) {
      add("Invoice Total", first[amountIndex] ?? "");
    }
  } else {
    add("Goods Description", value(first, "description", "goods description", "product description"));
    add("Quantity", [value(first, "quantity", "qty"), value(first, "unit", "unit of measure", "uom")].filter(Boolean).join(" "));
  }
  return output.join("\n");
}

function isUnstatedValue(value: string): boolean {
  return /^(?:not\s+(?:provided|specified|available|stated|applicable|found)|not\s+known|unknown|n\/?a|none|null|[-–—])$/i.test(value.trim());
}

function parseLabelledSingleLineItem(
  lines: string[],
  values: Map<string, { value: string; evidence: string }>,
): TradeLineItem[] {
  const description = values.get("description")?.value ?? "";
  const quantityText = values.get("quantity")?.value ?? "";
  const unitPrice = findLabelValue(lines, ["unit price", "price per unit"]);
  const lineTotal = findLabelValue(lines, ["line item total", "line total", "extended amount"]);
  const quantity = parseQuantity(quantityText);
  if (!description || !quantity.quantity || !unitPrice.value || !lineTotal.value ||
      [description, quantityText, unitPrice.value, lineTotal.value].some(isUnstatedValue)) return [];
  const currency = extractCurrency(lines.join("\n"));
  const cleanAmount = (value: string) => value.replace(/\b(?:USD|EUR|GBP|AED|SAR|PKR|CNY|JPY)\b\s*/i, "").replace(/[$€£]/g, "").trim();
  const evidence = [values.get("description")?.evidence, values.get("quantity")?.evidence, unitPrice.evidence, lineTotal.evidence].filter(Boolean).join(" | ");
  return [{
    lineNumber: "1",
    hsCode: values.get("hsCode")?.value ?? "",
    description,
    quantity: quantity.quantity,
    unit: quantity.unit,
    unitPrice: (currency ? currency + " " : "") + cleanAmount(unitPrice.value),
    amount: cleanAmount(lineTotal.value),
    evidence,
  }];
}

function extractCurrency(text: string) {
  return text.match(/\b(USD|EUR|GBP|AED|SAR|PKR|CNY|JPY)\b/i)?.[1]?.toUpperCase() ?? "";
}

export function analyzeTradeDocument(text: string): DocumentAnalysis {
  const normalizedText = normalizeCsvInvoiceText(text);
  const lines = normalizedLines(normalizedText);
  const parsedLineItems = parseLineItems(lines);
  const values = new Map<string, { value: string; evidence: string }>();

  for (const definition of FIELD_DEFINITIONS) {
    values.set(definition.key, findLabelValue(lines, definition.aliases));
  }

  const exporter = findPartyValue(lines, ["shipper / exporter", "exporter / shipper", "seller / exporter", "exporter", "seller", "shipper", "supplier"]);
  const importer = findPartyValue(lines, ["consignee / buyer", "buyer / consignee", "importer / buyer", "importer", "buyer", "consignee", "customer"]);
  values.set("exporter", exporter.value ? exporter : findLabelValue(lines, ["exporter", "seller", "shipper", "supplier"]));
  values.set("importer", importer.value ? importer : findLabelValue(lines, ["importer", "buyer", "consignee", "customer"]));

  const total = findFirstMatch(lines, [
    /^\s*[-*•]?\s*(?:total\s+invoice\s+value|total\s+invoice\s+amount|invoice\s+total|grand\s+total|total\s+amount|amount\s+due)\s*[:-]?\s*(?:(?:USD|EUR|GBP|AED|SAR|PKR|CNY|JPY)\s*)?[$€£]?([\d,]+(?:\.\d{1,2})?)\b/i,
  ]);
  if (total.value) values.set("total", total);
  const subtotal = findFirstMatch(lines, [/^\s*[-*•]?\s*sub\s*total\s*[:-]?\s*(?:(?:USD|EUR|GBP|AED|SAR|PKR|CNY|JPY)\s*)?[$€£]?([\d,]+(?:\.\d{1,2})?)\b/i]);
  if (subtotal.value) values.set("subtotal", subtotal);

  const gross = findFirstMatch(lines, [
    /^\s*[-*•]?\s*total\s+gross\s+(?:weight|wt)\s*[:-]?\s*([\d,]+(?:\.\d+)?\s*(?:kg|kgs|lb|lbs|tons?)?)/i,
    /^\s*[-*•]?\s*gross\s+(?:weight|wt)\s*[:-]?\s*([\d,]+(?:\.\d+)?\s*(?:kg|kgs|lb|lbs|tons?)?)/i,
  ]);
  const net = findFirstMatch(lines, [
    /^\s*[-*•]?\s*total\s+net\s+(?:weight|wt)\s*[:-]?\s*([\d,]+(?:\.\d+)?\s*(?:kg|kgs|lb|lbs|tons?)?)/i,
    /^\s*[-*•]?\s*net\s+(?:weight|wt)\s*[:-]?\s*([\d,]+(?:\.\d+)?\s*(?:kg|kgs|lb|lbs|tons?)?)/i,
  ]);
  if (gross.value) values.set("grossWeight", gross);
  if (net.value) values.set("netWeight", net);

  const packages = findFirstMatch(lines, [
    /^\s*[-*•]?\s*total\s+(?:number\s+of\s+)?(?:packages|cartons|boxes|ctns|pkgs)\s*[:-]?\s*([\d,]+\s*(?:cartons?|ctns?|boxes?|pallets?|packages?|pkgs?)?)/i,
    /^\s*[-*•]?\s*(?:number\s+of\s+)?(?:packages|cartons|boxes|ctns|pkgs)\s*[:-]?\s*([\d,]+\s*(?:cartons?|ctns?|boxes?|pallets?|packages?|pkgs?)?)/i,
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

  const lineItems = parsedLineItems.length ? parsedLineItems : parseLabelledSingleLineItem(lines, values);

  const fields: ExtractedField[] = FIELD_DEFINITIONS.map(({ key, label }) => {
    const found = values.get(key) ?? { value: "", evidence: "" };
    return {
      key,
      label,
      value: found.value,
      evidence: found.evidence,
      status: found.value && !isUnstatedValue(found.value) ? "found" : "missing",
    };
  });

  const productDescription = lineItems.length
    ? lineItems.map((item) => item.description).join("; ")
    : values.get("description")?.value ?? "";

  // Lightweight, evidence-preserving attribute detection. Matches are copied verbatim from source text.
  const attributePatterns: { label: string; pattern: RegExp }[] = [
    { label: "Material: Cotton", pattern: /\bcotton\b/i },
    { label: "Material: Leather", pattern: /\bleather\b/i },
    { label: "Material: Stainless steel", pattern: /\bstainless\s+steel\b/i },
    { label: "Material: Aluminum", pattern: /\balumini?um\b/i },
    { label: "Material: Plastic", pattern: /\bplastic\b/i },
    { label: "Material: Lithium-ion", pattern: /\blithium[\s-]?ion\b/i },
    { label: "Dimensions", pattern: /\b\d+(?:\.\d+)?\s*(?:mm|millimeters?|cm|centimeters?|inches|inch|in)\b/i },
    { label: "Fabric density: GSM", pattern: /\b\d+(?:\.\d+)?\s*gsm\b/i },
    { label: "Weight / density", pattern: /\b\d+(?:\.\d+)?\s*(?:kg|kgs|g|grams?|mg|lb|lbs)\b/i },
    { label: "Power: Watts", pattern: /\b\d+(?:\.\d+)?\s*w(?:att)?s?\b/i },
    { label: "Energy: Watt-hours", pattern: /\b\d+(?:\.\d+)?\s*wh\b/i },
    { label: "Voltage", pattern: /\b\d+(?:\.\d+)?\s*v(?:olts?)?\b/i },
    { label: "Frequency", pattern: /\b\d+(?:\.\d+)?\s*hz\b/i },
  ];
  const productAttributes: DocumentAnalysis["productAttributes"] = attributePatterns.map(({ label, pattern }) => {
    const match = text.match(pattern);
    return { label, found: Boolean(match), evidence: match?.[0] ?? "" };
  });

  const validations: InternalValidation[] = [];
  const grossText = values.get("grossWeight")?.value ?? "";
  const netText = values.get("netWeight")?.value ?? "";
  const parseWeightKg = (value: string): number | null => {
    const match = value.match(/^\s*([\d,]+(?:\.\d+)?)\s*(kg|kgs|kilograms?|lb|lbs|pounds?|t|ton|tons|tonnes?)?\s*$/i);
    if (!match) return null;
    const amount = Number(match[1].replace(/,/g, ""));
    if (!Number.isFinite(amount)) return null;
    const unit = (match[2] ?? "").toLowerCase();
    if (["lb", "lbs", "pound", "pounds"].includes(unit)) return amount * 0.45359237;
    if (["t", "ton", "tons", "tonne", "tonnes"].includes(unit)) return amount * 1000;
    return amount;
  };
  if (grossText && netText) {
    const grossKg = parseWeightKg(grossText), netKg = parseWeightKg(netText);
    if (grossKg !== null && netKg !== null && (/[a-z]/i.test(grossText) === /[a-z]/i.test(netText))) validations.push({ key: "net-vs-gross-weight", label: "Net weight must not exceed gross weight", status: netKg > grossKg ? "mismatch" : "consistent", expected: "Net weight <= gross weight", actual: "Net " + netText + "; gross " + grossText, evidence: "Net weight: " + netText + "; Gross weight: " + grossText });
  }
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
    const descriptionIndex = header.findIndex((cell) => /description of goods|goods description/.test(cell));
    if (packageIndex < 0 || descriptionIndex < 0) continue;
    for (let row = index + 1; row < lines.length; row += 1) {
      const cells = splitTableCells(lines[row]);
      const firstValue = cells.find((cell) => cell.trim())?.replace(/\*/g, "").trim() ?? "";
      if (!cells.length || cells.length <= packageIndex || /^total$/i.test(firstValue) ||
          /^total$/i.test((cells[descriptionIndex] ?? "").replace(/\*/g, "").trim())) break;
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

export function buildShipmentReferenceLabel(invoiceText: string, packingText: string, fallbackReference = ""): string {
  const invoice = analyzeTradeDocument(invoiceText);
  const packing = analyzeTradeDocument(packingText);
  const value = (key: string) =>
    invoice.fields.find((field) => field.key === key)?.value ||
    packing.fields.find((field) => field.key === key)?.value || "";
  const booking = value("bookingReference");
  const invoiceNumber = value("invoiceNumber");
  const purchaseOrder = value("purchaseOrderNumber");
  const parts: string[] = [];
  if (booking) parts.push("Shipment " + booking);
  if (invoiceNumber) parts.push("Invoice " + invoiceNumber);
  if (purchaseOrder) parts.push("PO " + purchaseOrder);
  if (parts.length) return parts.join(" / ");
  return "Shipment " + (fallbackReference.trim() || "shipment");
}

function normalizeComparisonValue(value: string, key: string): string {
  const withoutPackageUnit = key === "packages"
    ? value.trim().replace(/\s+(?:cartons?|ctns?|packages?|pkgs?|boxes)\s*$/i, "")
    : value;
  return withoutPackageUnit.toLowerCase().replace(/[^a-z0-9]/g, "");
}

export function compareTradeDocuments(invoiceText: string, packingText: string): ComparisonRow[] {
  const invoice = analyzeTradeDocument(invoiceText);
  const packing = analyzeTradeDocument(packingText);
  const keys = ["bookingReference", "invoiceNumber", "purchaseOrderNumber", "exporter", "importer", "description", "quantity", "hsCode", "packages", "grossWeight", "netWeight"] as const;
  return keys.map((key) => {
    const left = invoice.fields.find((field) => field.key === key)?.value ?? "";
    const right = packing.fields.find((field) => field.key === key)?.value ?? "";
    const status = !left && !right ? "unable"
      : left && !right ? "invoice-only"
      : !left && right ? "packing-only"
      : normalizeComparisonValue(left, key) === normalizeComparisonValue(right, key) ? "consistent" : "mismatch";
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
