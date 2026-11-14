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

const multiLineInvoice = `COMMERCIAL INVOICE
Invoice Number: INV-2026-11-0457
Invoice Date: 12 November 2026
SHIPPER / EXPORTER
Al-Noor Textiles (Pvt) Ltd
CONSIGNEE / BUYER
Van Dijk Home Goods B.V.
Incoterm / Currency: FOB Karachi / USD
ITEM DETAILS
No. HS Code Description Qty Unit Unit Price (USD) Amount (USD)
1 6302.31.00 Cotton bed sheet set, Queen, 300 TC, white 1,200 SET 14.25 17,100.00
2 6302.31.00 Cotton bed sheet set, King, 300 TC, grey 800 SET 16.80 13,440.00
3 6304.92.00 Cushion cover, 45x45 cm, cotton, navy 2,500 PCS 2.15 5,375.00
4 6302.60.00 Bath towel, 70x140 cm, 500 GSM, white 1,500 PCS 5.60 8,400.00
5 6302.60.00 Hand towel, 50x90 cm, 500 GSM, white 1,750 PCS 2.25 3,937.50
Subtotal: USD 48,252.50
Packing & Inland Freight: USD 510.00
TOTAL INVOICE VALUE: USD 48,762.50
Total Cartons 612
Gross Weight 9,842.00 kg
Net Weight 9,105.50 kg
Vessel / Voyage MSC AURORA / 645W`;

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

  it("extracts slash headings, next-line party names, all table rows, totals and package weights", () => {
    const result = analyzeTradeDocument(multiLineInvoice);
    const value = (key: string) => result.fields.find((field) => field.key === key)?.value;
    expect(value("exporter")).toBe("Al-Noor Textiles (Pvt) Ltd");
    expect(value("importer")).toBe("Van Dijk Home Goods B.V.");
    expect(value("description")).toContain("Cotton bed sheet set, Queen");
    expect(value("quantity")).toContain("1,200 SET");
    expect(value("quantity")).toContain("1,750 PCS");
    expect(value("total")).toBe("48,762.50");
    expect(value("hsCode")).toBe("6302.31.00, 6304.92.00, 6302.60.00");
    expect(value("packages")).toBe("612");
    expect(value("grossWeight")).toBe("9,842.00 kg");
    expect(value("netWeight")).toBe("9,105.50 kg");
    expect(result.lineItems).toHaveLength(5);
    expect(result.productAttributes.find((item) => item.label === "Dimensions / size")?.found).toBe(true);
    expect(result.productAttributes.find((item) => item.label === "Intended use / function")?.found).toBe(false);
    expect(result.productAttributes.find((item) => item.label === "Power / capacity")?.found).toBe(false);
    expect(result.validations[0].status).toBe("consistent");
  });

  it("compares fields and distinguishes mismatch from document-specific absence", () => {
    const result = compareTradeDocuments(invoice, packingList);
    expect(result.find((row) => row.key === "invoiceNumber")?.status).toBe("consistent");
    expect(result.find((row) => row.key === "grossWeight")?.status).toBe("packing-only");
    const mismatch = compareTradeDocuments(invoice, packingList.replace("240 units", "250 units"));
    expect(mismatch.find((row) => row.key === "quantity")?.status).toBe("mismatch");
    const invoiceOnly = compareTradeDocuments(invoice, packingList.replace("Invoice No: INV-2048\n", ""));
    expect(invoiceOnly.find((row) => row.key === "invoiceNumber")?.status).toBe("invoice-only");
  });

  it("supports slash labels with an empty value and validates summed carton rows", () => {
    const text = `COMMERCIAL INVOICE
Exporter / Seller:
Example Export Ltd.
1. Item: Cotton towels — 3 cartons
2. Item: Bed linen — 5 cartons
Total Packages: 8 cartons`;
    const result = analyzeTradeDocument(text);
    expect(result.fields.find((field) => field.key === "exporter")?.value).toBe("Example Export Ltd.");
    expect(result.validations.find((check) => check.key === "carton-count")).toMatchObject({
      status: "consistent",
      expected: "8",
      actual: "8 cartons",
    });
  });

  it("prefers explicit total labels and flags an incorrect subtotal", () => {
    const text = `COMMERCIAL INVOICE
Gross Weight: 900 kg
Total Gross Weight: 1,050 kg
Packages: 10 cartons
Total Cartons: 12 cartons
1 123456 Cotton fabric 10 PCS 2.00 20.00
Subtotal: 25.00`;
    const result = analyzeTradeDocument(text);
    expect(result.fields.find((field) => field.key === "grossWeight")?.value).toBe("1,050 kg");
    expect(result.fields.find((field) => field.key === "packages")?.value).toBe("12 cartons");
    expect(result.validations.find((check) => check.key === "line-item-subtotal")?.status).toBe("mismatch");
  });

  it("creates a draft only from the missing-document list supplied by the operator", () => {
    const result = buildMissingDocumentDraft("SHIP-1", ["Bill of lading"]);
    expect(result.subject).toContain("SHIP-1");
    expect(result.body).toContain("Bill of lading");
    expect(result.body).not.toContain("Certificate of origin");
  });
});
