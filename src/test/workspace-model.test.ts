import { describe, expect, it } from "vitest";
import {
  createDemoWorkspace,
  inquirySchema,
  contentSchema,
  demoCan,
  makeRecord,
  isPublic,
  safeCsvCell,
  serializeCsv,
  canExportRows,
  filterContentRecords,
  filterInquiries,
  availabilityValues,
  inquiryValues,
  type Inquiry,
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
const makeInquiry = (overrides: Partial<Inquiry>): Inquiry => ({
  id: "inquiry-1",
  reference: "AT-001",
  kind: "contact",
  name: "Test Reviewer",
  email: "reviewer@example.com",
  company: "Example Company",
  country: "Pakistan",
  category: "General inquiry",
  automation: "",
  message: "An illustrative inquiry message",
  requirements: "",
  consent: true,
  status: "New",
  createdAt: "2026-11-06T00:00:00Z",
  notes: [],
  assignedTo: "",
  followUp: "",
  ...overrides,
});
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
  it("CSV export quotes delimiters, quotes, line breaks and Unicode", () => {
    expect(
      serializeCsv([
        ["Company", "Notes"],
        ["Café, 東京", 'She said "hello"\nnext'],
      ]),
    ).toBe('"Company","Notes"\n"Café, 東京","She said ""hello""\nnext"');
  });
  it("CSV export neutralizes spreadsheet formulas after leading whitespace", () => {
    expect(safeCsvCell("=1+1")).toBe('"\'=1+1"');
    expect(safeCsvCell(" \t@SUM(A1:A2)")).toBe('"\' \t@SUM(A1:A2)"');
    expect(safeCsvCell("-1")).toBe('"\'-1"');
    expect(safeCsvCell("Regular company")).toBe('"Regular company"');
  });
  it("exports only inquiry rows matching the active combined filters", () => {
    const inquiries = [
      makeInquiry({ company: "Acme", kind: "demo", status: "New" }),
      makeInquiry({ id: "inquiry-2", company: "Acme", kind: "contact", status: "New" }),
      makeInquiry({ id: "inquiry-3", company: "Other", kind: "demo", status: "Closed" }),
    ];
    const filtered = filterInquiries(inquiries, { search: "acme", status: "New", kind: "demo" });

    expect(filtered).toHaveLength(1);
    expect(
      serializeCsv([
        ["Reference", "Company", "Type", "Status"],
        ...filtered.map((row) => [row.reference, row.company, row.kind, row.status]),
      ]),
    ).toBe('"Reference","Company","Type","Status"\n"AT-001","Acme","demo","New"');
  });
  it("applies content search, publication, and category filters together", () => {
    const records = [
      {
        ...makeRecord("pages", "Trade Operations", "Coordinate trade workflows"),
        category: "Operations",
        publication: "Published" as const,
      },
      {
        ...makeRecord("pages", "Trade Operations", "Coordinate trade workflows"),
        category: "Operations",
        publication: "Draft" as const,
      },
      {
        ...makeRecord("pages", "Trade Operations", "Coordinate trade workflows"),
        category: "Other",
        publication: "Published" as const,
      },
      {
        ...makeRecord("pages", "Unrelated", "Different content"),
        category: "Operations",
        publication: "Published" as const,
      },
    ];

    expect(
      filterContentRecords(records, {
        search: "  TRADE ",
        status: "Published",
        category: "Operations",
      }),
    ).toEqual([records[0]]);
  });
  it("returns no content rows for unmatched filters and all rows when filters reset", () => {
    const records = [makeRecord("pages", "About", "About the company")];

    expect(
      filterContentRecords(records, {
        search: "missing",
        status: "Published",
        category: "All",
      }),
    ).toEqual([]);
    expect(filterContentRecords(records, { search: "", status: "All", category: "All" })).toEqual(
      records,
    );
  });
  it("disables CSV export when there are no rows or the role lacks export permission", () => {
    expect(canExportRows("Sales Manager", 1)).toBe(true);
    expect(canExportRows("Content Editor", 1)).toBe(false);
    expect(canExportRows("Super Admin", 0)).toBe(false);
  });
});
