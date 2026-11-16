import { z } from "zod";
import { buildShipmentReadinessScenario, type ShipmentReadinessScenarioId } from "./shipment-readiness-demo";

const requestSchema = z.object({
  scenarioId: z.enum(["quantity-mismatch", "missing-document", "conflicting-details"]),
}).strict();

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store", "x-content-type-options": "nosniff" },
  });
}

export async function handleShipmentReadinessDemo(request: Request): Promise<Response> {
  const url = new URL(request.url);
  if (request.method !== "POST") return new Response("Method not allowed", { status: 405, headers: { allow: "POST", "cache-control": "no-store" } });
  const origin = request.headers.get("origin");
  if (origin && origin !== url.origin) return json({ message: "Origin not allowed." }, 403);
  if (!(request.headers.get("content-type") ?? "").toLowerCase().includes("application/json")) return json({ message: "Expected a JSON request." }, 415);
  if (Number(request.headers.get("content-length") ?? "0") > 256) return json({ message: "Request is too large." }, 413);
  let body: unknown;
  try {
    const raw = await request.text();
    if (raw.length > 256) return json({ message: "Request is too large." }, 413);
    body = JSON.parse(raw) as unknown;
  } catch {
    return json({ message: "Invalid JSON request." }, 400);
  }
  const parsed = requestSchema.safeParse(body);
  if (!parsed.success) return json({ message: "Choose one of the available demo scenarios." }, 400);
  return json(buildShipmentReadinessScenario(parsed.data.scenarioId as ShipmentReadinessScenarioId));
}
