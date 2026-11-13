/**
 * @vitest-environment node
 */
import { describe, expect, it, vi } from "vitest";
import { handleShipmentReadinessDemo } from "@/lib/shipment-readiness-demo.server";
const env = {
  GROQ_API_KEY: "test-groq-key",
  SUPABASE_URL: "https://example-project.supabase.co",
  SUPABASE_SERVICE_ROLE_KEY: "service_role_test_value_0123456789",
  ABUSE_HASH_SECRET: "abuse_hash_test_secret_0123456789abcdef",
};
function request(body: unknown, origin = "https://aethertrade.cloud") {
  return new Request("https://aethertrade.cloud/api/demo/shipment-readiness", {
    method: "POST",
    headers: { "content-type": "application/json", origin, "cf-connecting-ip": "198.51.100.10" },
    body: JSON.stringify(body),
  });
}
describe("shipment readiness demo endpoint", () => {
  it("returns deterministic findings when the optional Groq key is absent", async () => {
    const fetchMock = vi.fn() as unknown as typeof fetch;
    const response = await handleShipmentReadinessDemo(request({ scenarioId: "quantity-mismatch" }), { ...env, GROQ_API_KEY: undefined }, fetchMock);
    const payload = await response.json();
    expect(response.status).toBe(200);
    expect(payload.aiStatus).toBe("fallback");
    expect(payload.findings[0].evidence[0].value).toBe("100 units");
    expect(fetchMock).not.toHaveBeenCalled();
  });
  it("rejects unknown scenario identifiers", async () => {
    const response = await handleShipmentReadinessDemo(request({ scenarioId: "arbitrary-user-input" }), { ...env, GROQ_API_KEY: undefined });
    expect(response.status).toBe(400);
  });
  it("rejects cross-origin requests", async () => {
    const response = await handleShipmentReadinessDemo(request({ scenarioId: "quantity-mismatch" }, "https://attacker.example"), { ...env, GROQ_API_KEY: undefined });
    expect(response.status).toBe(403);
  });
  it("uses atomic per-IP and global quotas before calling Groq", async () => {
    const generated = {
      explanation: "The sample invoice and packing list show different quantities and need review.",
      questions: ["Which quantity is supported by the final packing record?", "Which document should be corrected after the quantity is confirmed?"],
    };
    const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url.includes("/rpc/consume_submission_quota")) return new Response("true");
      if (url.includes("api.groq.com/openai/v1/chat/completions")) return new Response(JSON.stringify({
        choices: [{ message: { content: JSON.stringify(generated) } }],
      }), { status: 200, headers: { "content-type": "application/json" } });
      throw new Error("Unexpected request: " + url);
    }) as unknown as typeof fetch;
    const response = await handleShipmentReadinessDemo(request({ scenarioId: "quantity-mismatch" }), env, fetchMock);
    const payload = await response.json();
    expect(response.status).toBe(200);
    expect(payload.aiStatus).toBe("ai");
    expect(payload.explanation).toBe(generated.explanation);
    expect(fetchMock).toHaveBeenCalledTimes(3);
  });
  it("falls back to deterministic output when the quota is exhausted", async () => {
    const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
      if (String(input).includes("/rpc/consume_submission_quota")) return new Response("false");
      throw new Error("Groq must not be called after quota exhaustion.");
    }) as unknown as typeof fetch;
    const response = await handleShipmentReadinessDemo(request({ scenarioId: "missing-document" }), env, fetchMock);
    const payload = await response.json();
    expect(response.status).toBe(200);
    expect(payload.aiStatus).toBe("fallback");
    expect(payload.findings[0].status).toBe("missing");
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
  it("falls back if Groq returns malformed JSON", async () => {
    const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url.includes("/rpc/consume_submission_quota")) return new Response("true");
      if (url.includes("api.groq.com/openai/v1/chat/completions")) return new Response(JSON.stringify({
        choices: [{ message: { content: "not json" } }],
      }), { status: 200 });
      throw new Error("Unexpected request: " + url);
    }) as unknown as typeof fetch;
    const response = await handleShipmentReadinessDemo(request({ scenarioId: "conflicting-details" }), env, fetchMock);
    const payload = await response.json();
    expect(payload.aiStatus).toBe("fallback");
    expect(payload.findings[0].evidence[0].value).toBe("120 cartons");
  });
});
