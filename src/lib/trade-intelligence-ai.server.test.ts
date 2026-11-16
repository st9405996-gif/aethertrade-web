import { describe, expect, it, vi } from "vitest";
import { handleProductIntelligenceAI, handleShipmentReadinessAnalysis } from "./trade-intelligence-ai.server";

const env = {
  SUPABASE_URL: "https://example.supabase.co",
  SUPABASE_SERVICE_ROLE_KEY: "test-service-role",
  ABUSE_HASH_SECRET: "test-abuse-secret-that-is-at-least-thirty-two-characters",
};
function request(path: string, body: unknown) {
  return new Request("https://aethertrade.test" + path, {
    method: "POST",
    headers: { "content-type": "application/json", origin: "https://aethertrade.test", "cf-connecting-ip": "203.0.113.10" },
    body: JSON.stringify(body),
  });
}
function quotaFetch() {
  return vi.fn<typeof fetch>(async (input) => {
    if (String(input).includes("/rpc/consume_submission_quota")) return new Response("true", { status: 200 });
    throw new Error("No external AI provider is configured.");
  });
}
describe("trade document contextual review", () => {
  it("uses Cloudflare Workers AI for Product Intelligence", async () => {
    const invoiceText = "COMMERCIAL INVOICE\nInvoice Number: INV-CF-1\nExporter: Example Export Ltd.\nGoods Description: Cotton shirts\nQuantity: 20 PCS";
    const ai = { run: vi.fn(async (model: string, input: Record<string, unknown>) => {
      expect(model).toBe("@cf/openai/gpt-oss-20b");
      expect(input).toHaveProperty("messages");
      return { response: JSON.stringify({
        summary: "The invoice contains a reference, exporter, product description and quantity. Confirm details not shown in the supplied text.",
        suggestions: [{ label: "Invoice number", value: "INV-CF-1", evidence: "Invoice Number: INV-CF-1" }],
        observations: [], questions: ["Who is the importer or consignee for this transaction?"],
      }) };
    }) };
    const fetchMock = quotaFetch();
    const response = await handleProductIntelligenceAI(request("/api/demo/product-intelligence", { invoiceText }), { ...env, AI: ai }, fetchMock);
    const payload = await response.json() as { aiReview: { status: string; suggestions: { label: string }[] } };
    expect(response.status).toBe(200);
    expect(payload.aiReview.status).toBe("ai");
    expect(payload.aiReview.suggestions.map(x => x.label)).toEqual(["Invoice number"]);
    expect(ai.run).toHaveBeenCalledTimes(1);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });
  it("uses Cloudflare Workers AI for cross-document review while retaining deterministic comparisons", async () => {
    const invoiceText = "COMMERCIAL INVOICE\nInvoice Number: INV-5002\nGoods Description: Cotton shirts\nQuantity: 100 PCS";
    const packingText = "PACKING LIST\nReference Invoice Number: INV-5002\nGoods Description: Cotton shirts\nQuantity: 98 PCS";
    const ai = { run: vi.fn(async () => ({ response: JSON.stringify({
      summary: "The documents refer to the same invoice but state different quantities. Confirm the final packed quantity.",
      observations: [{ label: "Quantity difference", detail: "The invoice quantity is higher than the packing-list quantity.", document: "both", evidence: "Quantity: 100 PCS" }],
      questions: ["Which quantity is supported by the final packing record?"],
      productAttributes: [{ category: "Material / composition", value: "Cotton", document: "invoice", evidence: "Goods Description: Cotton shirts" }],
      customsObservations: [{ category: "Country of origin missing", severity: "medium", detail: "No country-of-origin declaration was found in the supplied documents.", document: "both", evidence: "No country-of-origin declaration was found in the supplied documents.", evidenceType: "absence" }],
    }) })) };
    const fetchMock = quotaFetch();
    const response = await handleShipmentReadinessAnalysis(request("/api/demo/shipment-readiness-analysis", {
      reference: "SHIP-5002", invoiceText, packingText, supportingDocs: [{ name: "Bill of lading", received: false }],
    }), { ...env, AI: ai }, fetchMock);
    const payload = await response.json() as { comparison: { key: string; status: string }[]; missing: string[]; aiReview: { status: string; observations: { label: string }[]; productAttributes: { category: string }[]; customsObservations: { category: string }[] } };
    expect(response.status).toBe(200);
    expect(payload.aiReview.status).toBe("ai");
    expect(payload.comparison.find(x => x.key === "quantity")?.status).toBe("mismatch");
    expect(payload.missing).toEqual(["Bill of lading"]);
    expect(payload.aiReview.observations).toHaveLength(1);
    expect(payload.aiReview.productAttributes[0]?.category).toBe("Material / composition");
    expect(payload.aiReview.customsObservations[0]?.category).toBe("Country of origin missing");
    expect(ai.run).toHaveBeenCalledTimes(1);
  });
  it("uses extracted booking, invoice and purchase-order references in the follow-up draft", async () => {
    const invoiceText = "COMMERCIAL INVOICE\nBooking Reference: REF-2081\nInvoice Number: INV-2026-11-0457\nGoods Description: Cotton shirts\nQuantity: 100 PCS";
    const packingText = "PACKING LIST\nInvoice Reference: INV-2026-11-0457\nPurchase Order No.: PO-7781\nGoods Description: Cotton shirts\nQuantity: 98 PCS";
    const response = await handleShipmentReadinessAnalysis(request("/api/demo/shipment-readiness-analysis", {
      reference: "SHIPMENT-2048", invoiceText, packingText, supportingDocs: [],
    }), env, quotaFetch());
    const payload = await response.json() as { subject: string; body: string; comparison: { key: string; status: string }[] };
    expect(response.status).toBe(200);
    expect(payload.subject).toBe("Clarification required for Shipment REF-2081 / Invoice INV-2026-11-0457 / PO PO-7781");
    expect(payload.body).toContain("Shipment REF-2081 / Invoice INV-2026-11-0457 / PO PO-7781");
    expect(payload.subject).not.toContain("SHIPMENT-2048");
    expect(payload.comparison.find((row) => row.key === "invoiceNumber")?.status).toBe("consistent");
  });

  it("returns deterministic output when Cloudflare Workers AI is not bound", async () => {
    const fetchMock = vi.fn<typeof fetch>();
    const response = await handleProductIntelligenceAI(request("/api/demo/product-intelligence", {
      invoiceText: "COMMERCIAL INVOICE\nInvoice Number: INV-5003\nGoods Description: Steel bolts",
    }), env, fetchMock);
    const payload = await response.json() as { aiReview: { status: string; summary: string; model?: string } };
    expect(response.status).toBe(200);
    expect(payload.aiReview.status).toBe("fallback");
    expect(payload.aiReview.summary).toContain("Missing AI binding");
    expect(payload.aiReview).not.toHaveProperty("model");
    expect(fetchMock).not.toHaveBeenCalled();
  });
  it("returns deterministic output when Cloudflare AI errors or returns invalid JSON", async () => {
    const invoiceText = "COMMERCIAL INVOICE\nInvoice Number: INV-5004\nGoods Description: Steel bolts";
    const ai = { run: vi.fn(async () => { throw new Error("Cloudflare AI quota exhausted"); }) };
    const response = await handleProductIntelligenceAI(request("/api/demo/product-intelligence", { invoiceText }), { ...env, AI: ai }, quotaFetch());
    const payload = await response.json() as { aiReview: { status: string } };
    expect(response.status).toBe(200);
    expect(payload.aiReview.status).toBe("fallback");
  });

  it("parses fenced JSON with leading prose from the Cloudflare AI binding", async () => {
    const invoiceText = "COMMERCIAL INVOICE\nInvoice Number: INV-FENCE-1\nGoods Description: stainless steel fasteners";
    const ai = { run: vi.fn(async () => ({ response: "Here is the requested result:\n\x60\x60\x60json\n" + JSON.stringify({
      summary: "The invoice identifies stainless steel fasteners and an invoice reference. Confirm any details absent from the supplied text.",
      suggestions: [{ label: "Invoice number", value: "INV-FENCE-1", evidence: "Invoice Number: INV-FENCE-1" }],
      observations: [], questions: ["Can you confirm the declared country of origin for these goods?"],
    }) + "\n\x60\x60\x60" })) };
    const response = await handleProductIntelligenceAI(request("/api/demo/product-intelligence", { invoiceText }), { ...env, AI: ai }, quotaFetch());
    const payload = await response.json() as { aiReview: { status: string; suggestions: { value: string }[] } };
    expect(payload.aiReview.status).toBe("ai");
    expect(payload.aiReview.suggestions[0]?.value).toBe("INV-FENCE-1");
  });

  it("uses Cloudflare AI REST credentials when the Workers AI binding is unavailable", async () => {
    const invoiceText = "COMMERCIAL INVOICE\nInvoice Number: INV-REST-1\nGoods Description: electronic control modules";
    const fetchMock = vi.fn<typeof fetch>(async (input, init) => {
      const url = String(input);
      if (url.includes("/rpc/consume_submission_quota")) return new Response("true", { status: 200 });
      expect(url).toContain("/accounts/test-account/ai/run/%40cf/openai/gpt-oss-20b");
      expect(new Headers(init?.headers).get("authorization")).toBe("Bearer test-api-token");
      return new Response(JSON.stringify({ success: true, result: { response: "Model response follows\n" + JSON.stringify({
        summary: "The invoice describes electronic control modules and contains an invoice number. Confirm missing shipment details.",
        suggestions: [{ label: "Invoice number", value: "INV-REST-1", evidence: "Invoice Number: INV-REST-1" }],
        observations: [], questions: ["Can you confirm the origin country stated on the commercial invoice?"],
      }) } }), { status: 200, headers: { "content-type": "application/json" } });
    });
    const response = await handleProductIntelligenceAI(request("/api/demo/product-intelligence", { invoiceText }), {
      ...env, CLOUDFLARE_ACCOUNT_ID: "test-account", CLOUDFLARE_API_TOKEN: "test-api-token",
    }, fetchMock);
    const payload = await response.json() as { aiReview: { status: string; suggestions: { value: string }[] } };
    expect(payload.aiReview.status).toBe("ai");
    expect(payload.aiReview.suggestions[0]?.value).toBe("INV-REST-1");
  });

  it("exposes JSON parse diagnostics in the deterministic fallback notice", async () => {
    const ai = { run: vi.fn(async () => ({ response: "This is not JSON." })) };
    const response = await handleProductIntelligenceAI(request("/api/demo/product-intelligence", {
      invoiceText: "COMMERCIAL INVOICE\nInvoice Number: INV-JSON-1\nGoods Description: Steel bolts",
    }), { ...env, AI: ai }, quotaFetch());
    const payload = await response.json() as { aiReview: { status: string; summary: string } };
    expect(payload.aiReview.status).toBe("fallback");
    expect(payload.aiReview.summary).toContain("JSON parse error");
  });

  it("rejects oversized and invalid document payloads before calling AI", async () => {
    const ai = { run: vi.fn() };
    const fetchMock = quotaFetch();
    const tooShort = await handleProductIntelligenceAI(request("/api/demo/product-intelligence", { invoiceText: "too short" }), { ...env, AI: ai }, fetchMock);
    expect(tooShort.status).toBe(400);
    const oversized = await handleShipmentReadinessAnalysis(request("/api/demo/shipment-readiness-analysis", {
      invoiceText: "x".repeat(60_000), packingText: "y".repeat(60_000),
    }), { ...env, AI: ai }, fetchMock);
    expect(oversized.status).toBe(413);
    expect(ai.run).not.toHaveBeenCalled();
  });
});
