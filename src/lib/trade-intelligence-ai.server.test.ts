import { describe, expect, it, vi } from "vitest";
import { handleProductIntelligenceAI, handleShipmentReadinessAnalysis } from "./trade-intelligence-ai.server";

function request(path: string, body: unknown) {
  return new Request("https://aethertrade.test" + path, {
    method: "POST",
    headers: { "content-type": "application/json", origin: "https://aethertrade.test" },
    body: JSON.stringify(body),
  });
}

describe("deterministic document validation endpoints", () => {
  it("reviews invoice text and detects product attributes without external calls", async () => {
    const invoiceText = "COMMERCIAL INVOICE\nInvoice Number: INV-5003\nGoods Description: Cotton shirts, 180 GSM, 30 cm";
    const ai = { run: vi.fn() };
    const fetchMock = vi.fn<typeof fetch>();
    const response = await handleProductIntelligenceAI(request("/api/demo/product-intelligence", { invoiceText }), { AI: ai }, fetchMock);
    const payload = await response.json() as { analysis: { productAttributes: { label: string; found: boolean; evidence: string }[] }; aiReview: { status: string; summary: string } };
    expect(response.status).toBe(200);
    expect(payload.aiReview.status).toBe("deterministic");
    expect(payload.aiReview.summary).toContain("zero estimation");
    expect(payload.analysis.productAttributes.filter((item) => item.found).map((item) => item.evidence)).toEqual(["Cotton", "30 cm", "180 GSM"]);
    expect(ai.run).not.toHaveBeenCalled();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("keeps shipment comparison, math checks and follow-up email deterministic", async () => {
    const invoiceText = "COMMERCIAL INVOICE\nInvoice Number: INV-5002\nGoods Description: Stainless steel valve 220 V\nQuantity: 100 PCS\nSubtotal: 100.00";
    const packingText = "PACKING LIST\nInvoice Number: INV-5002\nGoods Description: Stainless steel valve 220 V\nQuantity: 98 PCS";
    const ai = { run: vi.fn() };
    const fetchMock = vi.fn<typeof fetch>();
    const response = await handleShipmentReadinessAnalysis(request("/api/demo/shipment-readiness-analysis", {
      reference: "SHIP-5002", invoiceText, packingText, supportingDocs: [{ name: "Bill of lading", received: false }],
    }), { AI: ai }, fetchMock);
    const payload = await response.json() as { comparison: { key: string; status: string }[]; missing: string[]; subject: string; body: string; aiReview: { status: string; productAttributes: unknown[] } };
    expect(response.status).toBe(200);
    expect(payload.aiReview.status).toBe("deterministic");
    expect(payload.comparison.find((row) => row.key === "quantity")?.status).toBe("mismatch");
    expect(payload.missing).toEqual(["Bill of lading"]);
    expect(payload.subject).toContain("Clarification required");
    expect(payload.body).toContain("Bill of lading");
    expect(payload.aiReview.productAttributes.length).toBeGreaterThan(0);
    expect(ai.run).not.toHaveBeenCalled();
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
