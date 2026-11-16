import { describe, expect, it } from "vitest";
import {
  analyzeTradeDocument,
  buildMissingDocumentDraft,
  buildShipmentReferenceLabel,
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

  it("parses unnumbered invoice rows and pipe-delimited package breakdowns", () => {
    const invoiceText = `COMMERCIAL INVOICE
Invoice Number: INV-2026-089
Invoice Date: November 15, 2026
Seller / Exporter
• Company Name: Alpha Exports Pakistan
Buyer / Importer (Consignee)
• Company Name: Global Retail Imports Inc.
Currency: USD
Line Items (Goods Description)
| Description of Goods | HS Code | Qty | Unit | Unit Price ($) | Total Amount ($) | Country of Origin |
| --- | --- | --- | --- | --- | --- | --- |
| 100% Cotton Men's Polo Shirts | 6105.10 | 1,000 | Pcs | $5.50 | $5,500.00 | Pakistan |
| Leather Casual Belts | 4203.30 | 500 | Pcs | $3.20 | $1,600.00 | Pakistan |
| **Total** | | **1,500** | | | **$7,100.00** | |
• Total Invoice Amount: $7,100.00 USD`;
    const packingText = `PACKING LIST
Reference Commercial Invoice No.: INV-2026-089
Date: November 15, 2026
| Marks & Numbers | Package Type | No. of Packages | Description of Goods | Qty / Pcs | Net Weight (kg) | Gross Weight (kg) | Dimensions (cm) |
| --- | --- | --- | --- | --- | --- | --- | --- |
| CARTON 01 - 25 | Export Cartons | 25 | Cotton Men's Polo Shirts | 1,000 Pcs | 220.00 kg | 245.00 kg | 60 x 40 x 50 cm |
| CARTON 26 - 30 | Export Cartons | 5 | Leather Casual Belts | 500 Pcs | 85.00 kg | 95.00 kg | 50 x 30 x 40 cm |
| **Total** | | **30 Cartons** | | **1,500 Pcs** | **305.00 kg** | **340.00 kg** | |
Total Number of Packages: 30 Cartons
Total Net Weight: 305.00 kg
Total Gross Weight: 340.00 kg`;
    const invoice = analyzeTradeDocument(invoiceText);
    const packing = analyzeTradeDocument(packingText);
    const field = (result: ReturnType<typeof analyzeTradeDocument>, key: string) => result.fields.find((item) => item.key === key)?.value;
    expect(field(invoice, "exporter")).toBe("Alpha Exports Pakistan");
    expect(field(invoice, "importer")).toBe("Global Retail Imports Inc.");
    expect(field(invoice, "description")).toContain("Leather Casual Belts");
    expect(field(invoice, "quantity")).toContain("1,000 PCS");
    expect(field(invoice, "hsCode")).toBe("6105.10, 4203.30");
    expect(field(invoice, "total")).toBe("7,100.00");
    expect(invoice.validations.find((item) => item.key === "line-item-subtotal")?.status).toBe("consistent");
    expect(packing.lineItems).toHaveLength(2);
    expect(field(packing, "packages")).toBe("30 Cartons");
    expect(field(packing, "grossWeight")).toBe("340.00 kg");
    expect(field(packing, "netWeight")).toBe("305.00 kg");
    expect(packing.validations.find((item) => item.key === "carton-count")).toMatchObject({ status: "consistent", expected: "30" });
    const comparison = compareTradeDocuments(invoiceText, packingText);
    expect(comparison.find((item) => item.key === "quantity")?.status).toBe("consistent");
    expect(comparison.find((item) => item.key === "packages")?.status).toBe("packing-only");
  });

  it("treats Invoice Number, Invoice No. and Invoice Reference as the same field", () => {
    for (const packingLabel of ["Invoice No.", "Invoice Reference"]) {
      const result = compareTradeDocuments(
        "COMMERCIAL INVOICE\nInvoice Number: INV-ALIAS-1\nGoods Description: Sample goods",
        "PACKING LIST\n" + packingLabel + ": INV-ALIAS-1\nGoods Description: Sample goods",
      );
      expect(result.find((row) => row.key === "invoiceNumber")?.status).toBe("consistent");
    }
  });

  it("normalizes package-count unit suffixes without changing displayed raw values", () => {
    for (const unit of ["Cartons", "Ctns", "Packages", "Pkgs", "Boxes"]) {
      const result = compareTradeDocuments(
        "COMMERCIAL INVOICE\nPackages: 612",
        "PACKING LIST\nTotal Cartons: 612 " + unit,
      );
      expect(result.find((row) => row.key === "packages")).toMatchObject({
        invoiceValue: "612",
        packingValue: "612 " + unit,
        status: "consistent",
      });
    }
  });

  it("builds a follow-up reference from document identifiers before using a fallback", () => {
    const label = buildShipmentReferenceLabel(
      "COMMERCIAL INVOICE\nBooking Reference: REF-2081\nInvoice Reference: INV-2026-11-0457",
      "PACKING LIST\nPurchase Order No.: PO-7781",
      "MANUAL-1",
    );
    expect(label).toBe("Shipment REF-2081 / Invoice INV-2026-11-0457 / PO PO-7781");
    expect(buildShipmentReferenceLabel("COMMERCIAL INVOICE\nGoods: sample", "PACKING LIST\nGoods: sample", "MANUAL-1"))
      .toBe("Shipment MANUAL-1");
  });

  it("creates a draft only from the missing-document list supplied by the operator", () => {
    const result = buildMissingDocumentDraft("SHIP-1", ["Bill of lading"]);
    expect(result.subject).toContain("SHIP-1");
    expect(result.body).toContain("Bill of lading");
    expect(result.body).not.toContain("Certificate of origin");
  });
});
