import { describe, expect, it } from "vitest";
import { buildShipmentReadinessScenario } from "./shipment-readiness-demo";
describe("shipment readiness sample scenarios", () => {
  it("detects the 100 vs 98 unit quantity mismatch", () => {
    const result = buildShipmentReadinessScenario("quantity-mismatch");
    expect(result.findings).toHaveLength(1);
    expect(result.findings[0]).toMatchObject({ label: "Quantity", status: "mismatch", evidence: [
      { document: "Commercial Invoice", value: "100 units" },
      { document: "Packing List", value: "98 units" },
    ] });
  });
  it("marks only the sample Certificate of Origin as missing", () => {
    const result = buildShipmentReadinessScenario("missing-document");
    expect(result.findings[0]).toMatchObject({ label: "Certificate of Origin", status: "missing" });
    expect(result.documents.filter((document) => !document.received).map((document) => document.name)).toEqual(["Certificate of Origin"]);
    expect(result.riskNote).toContain("may");
  });
  it("detects the 120 vs 118 carton package-count mismatch", () => {
    const result = buildShipmentReadinessScenario("conflicting-details");
    expect(result.findings[0]).toMatchObject({ label: "Packages", status: "mismatch", evidence: [
      { document: "Commercial Invoice", value: "120 cartons" },
      { document: "Packing List", value: "118 cartons" },
    ] });
  });
  it("provides deterministic explanations and questions without an AI key", () => {
    const result = buildShipmentReadinessScenario("quantity-mismatch");
    expect(result.aiStatus).toBe("fallback");
    expect(result.explanation).toContain("100 units");
    expect(result.questions).toHaveLength(2);
  });
});
