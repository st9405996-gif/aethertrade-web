import { describe, expect, it } from "vitest";
import { parseWorkflowDemoRecord } from "@/lib/workflow-demo-config";
import type { PublicContentRecord } from "@/lib/public-content-records.functions";

const base: PublicContentRecord = {
  id: "workflow-1",
  module: "workflow",
  slug: "shipment-follow-up",
  title: "Shipment Follow-Up",
  body: "Illustrative demonstration.",
  category: "Illustrative workflow",
  availability: "Available",
  position: 1,
  fields: {
    workflowConfig: JSON.stringify({
      steps: [{ id: 1, label: "Request sent", icon: "Send" }],
      exceptionSteps: [1],
      exceptionEntryLabel: "Conflict?",
      exceptionEntryHint: "See exception flow",
      standardPanels: [{ step: 1, type: "message", title: "Request", heading: "Request sent" }],
      exceptionPanels: [{ step: 1, type: "alert", title: "Conflict", heading: "Review required" }],
    }),
  },
};

describe("workflow demo CMS configuration", () => {
  it("parses a valid JSON-string configuration from content_records", () => {
    expect(parseWorkflowDemoRecord(base)).toMatchObject({
      id: "shipment-follow-up",
      title: "Shipment Follow-Up",
      steps: [{ id: 1, label: "Request sent", icon: "Send" }],
      exceptionSteps: [1],
      standardPanels: [{ step: 1, type: "message" }],
    });
  });

  it("parses an object configuration returned by a CMS editor", () => {
    const config = JSON.parse(base.fields.workflowConfig ?? "{}") as Record<string, unknown>;
    expect(
      parseWorkflowDemoRecord({ ...base, fields: { workflowConfig: config as unknown as string } }),
    ).not.toBeNull();
  });

  it("rejects malformed or incomplete workflow configuration", () => {
    expect(parseWorkflowDemoRecord({ ...base, fields: { workflowConfig: "{" } })).toBeNull();
    expect(
      parseWorkflowDemoRecord({
        ...base,
        fields: { workflowConfig: JSON.stringify({ steps: [], standardPanels: [] }) },
      }),
    ).toBeNull();
  });
});
