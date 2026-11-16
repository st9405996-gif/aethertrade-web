/**
 * @vitest-environment node
 */
import { describe, expect, it, vi } from "vitest";
import { handleShipmentReadinessDemo } from "@/lib/shipment-readiness-demo.server";
const env = {
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
  it("uses Cloudflare Workers AI for the guided shipment review", async () => {
    const generated = {
      explanation: "The sample invoice and packing list show different quantities and need review.",
      questions: ["Which quantity is supported by the final packing record?"],
    };
    const ai = { run: vi.fn(async (model: string, input: Record<string, unknown>) => {
      expect(model).toBe("@cf/openai/gpt-oss-20b");
      expect(input).toHaveProperty("messages");
      return { response: JSON.stringify(generated) };
    }) };
    const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
      if (String(input).includes("/rpc/consume_submission_quota")) return new Response("true");
      throw new Error("Cloudflare Workers AI is the only AI provider.");
    }) as unknown as typeof fetch;
    const response = await handleShipmentReadinessDemo(request({ scenarioId: "quantity-mismatch" }), { ...env, AI: ai }, fetchMock);
    const payload = await response.json();
    expect(response.status).toBe(200);
    expect(payload.aiStatus).toBe("ai");
    expect(payload.explanation).toBe(generated.explanation);
    expect(ai.run).toHaveBeenCalledTimes(1);
  });
  it("returns deterministic findings when the Cloudflare AI binding is absent", async () => {
    const fetchMock = vi.fn() as unknown as typeof fetch;
    const response = await handleShipmentReadinessDemo(request({ scenarioId: "quantity-mismatch" }), env, fetchMock);
    const payload = await response.json();
    expect(response.status).toBe(200);
    expect(payload.aiStatus).toBe("fallback");
    expect(payload.findings[0].evidence[0].value).toBe("100 units");
    expect(fetchMock).not.toHaveBeenCalled();
  });
  it("falls back when Cloudflare AI quota is exhausted or the model errors", async () => {
    const ai = { run: vi.fn(async () => { throw new Error("Workers AI quota exhausted"); }) };
    const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
      if (String(input).includes("/rpc/consume_submission_quota")) return new Response("true");
      throw new Error("Unexpected request");
    }) as unknown as typeof fetch;
    const response = await handleShipmentReadinessDemo(request({ scenarioId: "missing-document" }), { ...env, AI: ai }, fetchMock);
    const payload = await response.json();
    expect(response.status).toBe(200);
    expect(payload.aiStatus).toBe("fallback");
    expect(payload.findings[0].status).toBe("missing");
    expect(ai.run).toHaveBeenCalledTimes(1);
  });
  it("rejects unknown scenario identifiers", async () => {
    const response = await handleShipmentReadinessDemo(request({ scenarioId: "arbitrary-user-input" }), env);
    expect(response.status).toBe(400);
  });
  it("rejects cross-origin requests", async () => {
    const response = await handleShipmentReadinessDemo(request({ scenarioId: "quantity-mismatch" }, "https://attacker.example"), env);
    expect(response.status).toBe(403);
  });
});
