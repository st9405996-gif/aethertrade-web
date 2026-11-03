import { describe, expect, it } from "vitest";
import {
  createDemoWorkspace,
  inquirySchema,
  contentSchema,
  demoCan,
  makeRecord,
  isPublic,
  safeCsvCell,
  availabilityValues,
  inquiryValues,
} from "@/lib/workspace-model";

const valid = {
  kind: "contact",
  name: "Test Reviewer",
  email: "reviewer@example.com",
  company: "Illustrative company",
  country: "Pakistan",
  category: "General inquiry",
  automation: "",
  message: "Illustrative operational question",
  requirements: "",
  consent: true,
  website: "",
};
describe("Disconnected workspace business rules", () => {
  it("preserves the four requested availability states", () =>
    expect([...availabilityValues]).toEqual([
      "Available",
      "In Development",
      "Custom Build",
      "Planned",
    ]));
  it("preserves the six requested inquiry states", () =>
    expect([...inquiryValues]).toEqual([
      "New",
      "Contacted",
      "Qualified",
      "In Progress",
      "Closed",
      "Rejected",
    ]));
  it("keeps Careers unpublished by default", () =>
    expect(
      createDemoWorkspace().records.find((r) => r.module === "pages" && r.title === "Careers")
        ?.publication,
    ).toBe("Draft"));
  it("does not seed invented leads", () => expect(createDemoWorkspace().inquiries).toHaveLength(0));
  it("keeps Cookie Policy approval disabled", () =>
    expect(
      createDemoWorkspace().records.find((r) => r.module === "settings")?.fields[
        "cookiePolicyApproved"
      ],
    ).toBe("false"));
  it("requires privacy consent", () => {
    expect(inquirySchema.safeParse(valid).success).toBe(true);
    expect(inquirySchema.safeParse({ ...valid, consent: false }).success).toBe(false);
  });
  it("rejects malformed emails", () =>
    expect(inquirySchema.safeParse({ ...valid, email: "bad" }).success).toBe(false));
  it("rejects honeypot submissions", () =>
    expect(inquirySchema.safeParse({ ...valid, website: "spam" }).success).toBe(false));
  it("requires demo business requirements", () =>
    expect(inquirySchema.safeParse({ ...valid, kind: "demo" }).success).toBe(false));
  it("does not show unpublished drafts", () => expect(isPublic(makeRecord("pages"))).toBe(false));
  it("scheduled visibility waits until its due date", () => {
    const r = {
      ...makeRecord("pages"),
      publication: "Scheduled" as const,
      scheduledAt: "2030-01-01T00:00:00Z",
    };
    expect(isPublic(r, Date.parse("2029-12-31"))).toBe(false);
    expect(isPublic(r, Date.parse("2030-01-01"))).toBe(true);
  });
  it("requires a date for scheduled content", () =>
    expect(
      contentSchema.safeParse({ ...makeRecord("pages"), publication: "Scheduled" }).success,
    ).toBe(false));
  it("content editors cannot publish", () =>
    expect(demoCan("Content Editor", "publish")).toBe(false));
  it("sales managers cannot provision users", () =>
    expect(demoCan("Sales Manager", "users")).toBe(false));
  it("viewers cannot access lead PII", () => expect(demoCan("Viewer", "inquiries")).toBe(false));
  it("CSV export neutralizes spreadsheet formulas", () => {
    expect(safeCsvCell("=1+1")).toBe('"\'=1+1"');
    expect(safeCsvCell("Regular company")).toBe('"Regular company"');
  });
});
