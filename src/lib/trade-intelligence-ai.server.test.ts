import { describe, expect, it, vi } from "vitest";
import {
  handleProductIntelligenceAI,
  handleShipmentReadinessAnalysis,
} from "./trade-intelligence-ai.server";

const env = {
  GROK_API_KEY: "test-grok-key",
  GROK_MODEL: "grok-3-mini",
  SUPABASE_URL: "https://example.supabase.co",
  SUPABASE_SERVICE_ROLE_KEY: "test-service-role",
  ABUSE_HASH_SECRET: "test-abuse-secret-that-is-at-least-thirty-two-characters",
};

function mockGrokFetch(aiPayload: unknown) {
  const fetchMock = vi.fn<typeof fetch>(async (input) => {
    const url = String(input);
    if (url.includes("/rpc/consume_submission_quota")) {
      return new Response("true", { status: 200, headers: { "content-type": "application/json" } });
    }
    if (url === "https://api.x.ai/v1/responses") {
      return new Response(JSON.stringify(aiPayload), {
        status: 200,
        headers: { "content-type": "application/json" },
      });
    }
    throw new Error("Unexpected network request: " + url);
  });
  return fetchMock;
}

function request(path: string, body: unknown) {
  return new Request("https://aethertrade.test" + path, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      origin: "https://aethertrade.test",
      "cf-connecting-ip": "203.0.113.10",
    },
    body: JSON.stringify(body),
  });
}

describe("Grok trade document review", () => {
  it("uses Grok for Product Intelligence and only keeps suggestions with source evidence", async () => {
    const invoiceText = "COMMERCIAL INVOICE\nInvoice Number: INV-5001\nExporter: Example Export Ltd.\nGoods Description: Cotton shirts\nQuantity: 20 PCS";
    const fetchMock = mockGrokFetch({
      output: [{
        type: "message",
        content: [{
          type: "output_text",
          text: JSON.stringify({
            summary: "The invoice identifies its reference, exporter, goods and quantity. The buyer and invoice value are not stated in the supplied excerpt.",
            suggestions: [
              { label: "Invoice number", value: "INV-5001", evidence: "Invoice Number: INV-5001" },
              { label: "Invented field", value: "ABC", evidence: "This line does not exist" },
            ],
            observations: [],
            questions: ["Who is the importer or consignee for this transaction?"],
          }),
        }],
      }],
    });
    const response = await handleProductIntelligenceAI(
      request("/api/demo/product-intelligence", { invoiceText }),
      env,
      fetchMock,
    );
    const payload = await response.json() as {
      analysis: { fields: { key: string; value: string }[] };
      aiReview: { status: string; suggestions: { label: string }[] };
    };
    expect(response.status).toBe(200);
    expect(payload.aiReview.status).toBe("ai");
    expect(payload.aiReview.suggestions.map((item) => item.label)).toEqual(["Invoice number"]);
    expect(payload.analysis.fields.find((field) => field.key === "invoiceNumber")?.value).toBe("INV-5001");
    expect(fetchMock).toHaveBeenCalledTimes(3);
    expect(fetchMock.mock.calls[2]?.[0]).toBe("https://api.x.ai/v1/chat/completions");
  });

  it("uses Grok to review invoice and packing-list context while retaining deterministic comparisons", async () => {
    const invoiceText = "COMMERCIAL INVOICE\nInvoice Number: INV-5002\nGoods Description: Cotton shirts\nQuantity: 100 PCS";
    const packingText = "PACKING LIST\nReference Invoice Number: INV-5002\nGoods Description: Cotton shirts\nQuantity: 98 PCS";
    const fetchMock = mockGrokFetch({
      choices: [{
        message: {
          content: JSON.stringify({
            summary: "The documents refer to the same invoice but state different quantities. Confirm the final packed quantity before revising either record.",
            observations: [{
              label: "Quantity difference",
              detail: "The invoice quantity is higher than the packing-list quantity.",
              document: "both",
              evidence: "Quantity: 100 PCS",
            }],
            questions: ["Which quantity is supported by the final packing record?"],
          }),
        },
      }],
    });
    const response = await handleShipmentReadinessAnalysis(
      request("/api/demo/shipment-readiness-analysis", {
        reference: "SHIP-5002",
        invoiceText,
        packingText,
        supportingDocs: [{ name: "Bill of lading", received: false }],
      }),
      env,
      fetchMock,
    );
    const payload = await response.json() as {
      comparison: { key: string; status: string }[];
      missing: string[];
      aiReview: { status: string; observations: { label: string }[] };
    };
    expect(response.status).toBe(200);
    expect(payload.aiReview.status).toBe("ai");
    expect(payload.comparison.find((row) => row.key === "quantity")?.status).toBe("mismatch");
    expect(payload.missing).toEqual(["Bill of lading"]);
    expect(payload.aiReview.observations).toHaveLength(1);
    expect(fetchMock).toHaveBeenCalledTimes(3);
  });

  it("returns deterministic Product Intelligence results when Grok is not configured", async () => {
    const fetchMock = vi.fn<typeof fetch>();
    const response = await handleProductIntelligenceAI(
      request("/api/demo/product-intelligence", {
        invoiceText: "COMMERCIAL INVOICE\nInvoice Number: INV-5003\nGoods Description: Steel bolts",
      }),
      { ...env, GROK_API_KEY: "" },
      fetchMock,
    );
    const payload = await response.json() as { aiReview: { status: string; model: string } };
    expect(response.status).toBe(200);
    expect(payload.aiReview.status).toBe("fallback");
    expect(payload.aiReview.model).toBe("Deterministic rules only");
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("rejects oversized and invalid document payloads before calling Grok", async () => {
    const fetchMock = vi.fn<typeof fetch>();
    const tooShort = await handleProductIntelligenceAI(
      request("/api/demo/product-intelligence", { invoiceText: "too short" }),
      env,
      fetchMock,
    );
    expect(tooShort.status).toBe(400);
    const oversized = await handleShipmentReadinessAnalysis(
      request("/api/demo/shipment-readiness-analysis", {
        invoiceText: "x".repeat(60_000),
        packingText: "y".repeat(60_000),
      }),
      env,
      fetchMock,
    );
    expect(oversized.status).toBe(413);
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
