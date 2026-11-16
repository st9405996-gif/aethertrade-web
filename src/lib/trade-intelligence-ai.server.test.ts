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

  it("uses Workers AI for shipment context while keeping numeric comparison and follow-up deterministic", async () => {
    const invoiceText = "COMMERCIAL INVOICE\\nInvoice Number: INV-5002\\nGoods Description: Cotton shirts\\nQuantity: 100 PCS";
    const packingText = "PACKING LIST\\nInvoice Number: INV-5002\\nGoods Description: Cotton shirts\\nQuantity: 98 PCS";
    const ai = { run: vi.fn(async () => ({ response: JSON.stringify({
      summary: "The invoice and packing list refer to the same goods but state different quantities. Confirm the final packed quantity before proceeding.",
      observations: [{ label: "Quantity difference", detail: "The invoice lists 100 pieces while the packing list lists 98 pieces.", document: "both", evidence: "Quantity: 100 PCS" }],
      questions: ["Which quantity is supported by the final packing record?"],
      productAttributes: [{ category: "Material / composition", value: "Cotton shirts", document: "invoice", evidence: "Goods Description: Cotton shirts" }],
      customsObservations: [],
    }) })) };
    const fetchMock = vi.fn<typeof fetch>(async (input) => {
      if (String(input).includes("/rpc/consume_submission_quota")) return new Response("true", { status: 200 });
      throw new Error("Unexpected network request");
    });
    const env = {
      SUPABASE_URL: "https://example-project.supabase.co",
      SUPABASE_SERVICE_ROLE_KEY: "service_role_test_value_0123456789",
      ABUSE_HASH_SECRET: "abuse_hash_test_secret_0123456789abcdef",
      AI: ai,
    };
    const response = await handleShipmentReadinessAnalysis(request("/api/demo/shipment-readiness-analysis", {
      reference: "SHIP-5002", invoiceText, packingText, supportingDocs: [{ name: "Bill of lading", received: false }],
    }), env, fetchMock);
    const payload = await response.json() as { comparison: { key: string; status: string }[]; missing: string[]; subject: string; body: string; aiReview: { status: string; questions: string[]; productAttributes: unknown[] } };
    expect(response.status).toBe(200);
    expect(payload.aiReview.status).toBe("ai");
    expect(payload.aiReview.questions).toHaveLength(1);
    expect(payload.comparison.find((row) => row.key === "quantity")?.status).toBe("mismatch");
    expect(payload.missing).toEqual(["Bill of lading"]);
    expect(payload.subject).toContain("Clarification required");
    expect(payload.body).toContain("Bill of lading");
    expect(payload.aiReview.productAttributes).toHaveLength(1);
    expect(ai.run).toHaveBeenCalledTimes(1);
  });

  it("keeps invoice-only Product Intelligence deterministic even when Workers AI is configured", async () => {
    const invoiceText = "COMMERCIAL INVOICE\\nInvoice Number: INV-5003\\nGoods Description: Cotton shirts, 180 GSM, 30 cm";
    const ai = { run: vi.fn() };
    const fetchMock = vi.fn<typeof fetch>();
    const response = await handleProductIntelligenceAI(request("/api/demo/product-intelligence", { invoiceText }), { AI: ai }, fetchMock);
    const payload = await response.json() as { analysis: { productAttributes: { label: string; found: boolean; evidence: string }[] }; aiReview: { status: string; summary: string } };
    expect(response.status).toBe(200);
    expect(payload.aiReview.status).toBe("deterministic");
    expect(payload.analysis.productAttributes.filter((item) => item.found).map((item) => item.evidence)).toEqual(["Cotton", "30 cm", "180 GSM"]);
    expect(ai.run).not.toHaveBeenCalled();
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
