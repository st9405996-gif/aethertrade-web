import { describe, expect, it } from "vitest";
import {
  analyzeTradeDocument,
  buildMissingDocumentDraft,
  compareTradeDocuments,
} from "./trade-intelligence";

const invoice = `COMMERCIAL INVOICE
Invoice No: INV-2048
Exporter: Northstar Components Ltd.
Importer: Harborline Trading FZE
Goods Description: Industrial stainless steel valve assemblies
Quantity: 240 units
HS Code: 8481.80`;

const packingList = `PACKING LIST
Invoice No: INV-2048
Exporter: Northstar Components Ltd.
Importer: Harborline Trading FZE
Goods Description: Industrial stainless steel valve assemblies
Quantity: 240 units
Packages: 12 cartons
Gross Weight: 1,080 kg`;

describe("trade intelligence", () => {
  it("extracts labelled invoice fields and product attributes from supplied text", () => {
    const result = analyzeTradeDocument(invoice);
    expect(result.fields.find((field) => field.key === "invoiceNumber")?.value).toBe("INV-2048");
    expect(result.fields.find((field) => field.key === "quantity")?.value).toBe("240 units");
    expect(result.productDescription).toContain("stainless steel");
    expect(result.productAttributes.find((item) => item.label === "Material / composition")?.found).toBe(true);
  });

  it("marks absent fields as missing instead of inventing values", () => {
    const result = analyzeTradeDocument("Goods Description: General parts");
    expect(result.fields.find((field) => field.key === "hsCode")?.status).toBe("missing");
    expect(result.fields.find((field) => field.key === "hsCode")?.value).toBe("");
  });

  it("compares fields and distinguishes mismatch from unavailable evidence", () => {
    const result = compareTradeDocuments(invoice, packingList);
    expect(result.find((row) => row.key === "invoiceNumber")?.status).toBe("consistent");
    expect(result.find((row) => row.key === "grossWeight")?.status).toBe("unable");
    const mismatch = compareTradeDocuments(invoice, packingList.replace("240 units", "250 units"));
    expect(mismatch.find((row) => row.key === "quantity")?.status).toBe("mismatch");
  });

  it("creates a draft only from the missing-document list supplied by the operator", () => {
    const result = buildMissingDocumentDraft("SHIP-1", ["Bill of lading"]);
    expect(result.subject).toContain("SHIP-1");
    expect(result.body).toContain("Bill of lading");
    expect(result.body).not.toContain("Certificate of origin");
  });
});
