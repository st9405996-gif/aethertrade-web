/**
 * @vitest-environment node
 */
import { describe, expect, it, vi } from "vitest";
import { handleShipmentReadinessDemo } from "@/lib/shipment-readiness-demo.server";

function request(body: unknown, origin = "https://aethertrade.cloud") {
  return new Request("https://aethertrade.cloud/api/demo/shipment-readiness", {
    method: "POST",
    headers: { "content-type": "application/json", origin },
    body: JSON.stringify(body),
  });
}

describe("deterministic shipment readiness demo endpoint", () => {
  it("returns sample findings without calling Workers AI or external APIs", async () => {
    const ai = { run: vi.fn() };
    const fetchMock = vi.fn<typeof fetch>();
    const response = await handleShipmentReadinessDemo(request({ scenarioId: "quantity-mismatch" }), { AI: ai }, fetchMock);
    const payload = await response.json();
    expect(response.status).toBe(200);
    expect(payload.aiStatus).toBe("deterministic");
    expect(payload.findings[0].evidence[0].value).toBe("100 units");
    expect(ai.run).not.toHaveBeenCalled();
    expect(fetchMock).not.toHaveBeenCalled();
  });
  it("rejects unknown scenarios and cross-origin requests", async () => {
    expect((await handleShipmentReadinessDemo(request({ scenarioId: "unknown" }))).status).toBe(400);
    expect((await handleShipmentReadinessDemo(request({ scenarioId: "quantity-mismatch" }, "https://attacker.example"))).status).toBe(403);
  });
});
