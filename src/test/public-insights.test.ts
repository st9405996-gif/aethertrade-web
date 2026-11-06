import { describe, expect, it, vi } from "vitest";
import { fetchPublishedInsights, parsePublishedInsight } from "@/lib/public-insights.functions";

const now = Date.parse("2026-11-06T12:00:00.000Z");
const insightRow = {
  slug: "trade-operations",
  title: "Trade operations",
  body: "A focused overview.",
  category: "Operations",
  publication: "Published",
  scheduled_at: null,
  noindex: false,
  seo_title: "Trade operations SEO",
  seo_description: "Article description.",
  fields: {
    author: "AETHER-TRADE",
    geoSummary: "Key takeaways.",
    aeoQuestions: [{ question: "What is this?", answer: "A test article." }],
  },
};

describe("published insights public reader", () => {
  it("maps only valid public content and bounds structured question data", () => {
    const result = parsePublishedInsight(
      {
        ...insightRow,
        fields: {
          ...insightRow.fields,
          geoSummary: "g".repeat(1500),
          aeoQuestions: Array.from({ length: 14 }, (_, index) => ({
            question: `Question ${index}`,
            answer: "Answer",
          })),
        },
      },
      now,
    );

    expect(result).not.toBeNull();
    expect(result?.slug).toBe("trade-operations");
    expect(result?.geoSummary).toHaveLength(1200);
    expect(result?.aeoQuestions).toHaveLength(12);
  });

  it.each([
    ["draft", { publication: "Draft" }],
    ["future scheduled", { publication: "Scheduled", scheduled_at: "2026-11-07T00:00:00Z" }],
    ["noindex", { noindex: true }],
    ["missing noindex evidence", { noindex: undefined }],
    ["invalid slug", { slug: "Trade Operations" }],
    ["missing body", { body: "   " }],
  ])("excludes %s records", (_label, overrides) => {
    expect(parsePublishedInsight({ ...insightRow, ...overrides }, now)).toBeNull();
  });

  it("queries only insights eligible by publication time and uses the publishable key", async () => {
    const fetchImpl = vi.fn<typeof fetch>().mockResolvedValue(
      new Response(
        JSON.stringify([
          insightRow,
          {
            ...insightRow,
            slug: "scheduled-now",
            publication: "Scheduled",
            scheduled_at: "2026-11-06T11:00:00.000Z",
          },
          {
            ...insightRow,
            slug: "scheduled-later",
            publication: "Scheduled",
            scheduled_at: "2026-11-06T13:00:00.000Z",
          },
          { ...insightRow, slug: "unknown-noindex", noindex: null },
          { ...insightRow, slug: "draft", publication: "Draft" },
        ]),
        { status: 200 },
      ),
    );

    await expect(
      fetchPublishedInsights(
        "https://supabase.example.test/",
        "public-test-key",
        "trade-operations",
        fetchImpl,
        now,
      ),
    ).resolves.toMatchObject([{ slug: "trade-operations" }, { slug: "scheduled-now" }]);

    const [requestUrl, requestInit] = fetchImpl.mock.calls[0] ?? [];
    const url = new URL(String(requestUrl));
    expect(url.searchParams.get("module")).toBe("eq.insights");
    expect(url.searchParams.get("slug")).toBe("eq.trade-operations");
    expect(url.searchParams.get("noindex")).toBe("eq.false");
    expect(url.searchParams.get("or")).toContain("2026-11-06T12:00:00.000Z");
    const headers = new Headers(requestInit?.headers);
    expect(headers.get("apikey")).toBe("public-test-key");
    expect(headers.get("authorization")).toBe("Bearer public-test-key");
  });

  it("fails explicitly for missing configuration, HTTP errors, and malformed payloads", async () => {
    const failingFetch = vi
      .fn<typeof fetch>()
      .mockResolvedValue(new Response("denied", { status: 403 }));
    await expect(fetchPublishedInsights(undefined, "key", undefined, failingFetch)).rejects.toThrow(
      "not configured",
    );
    await expect(
      fetchPublishedInsights("https://supabase.example.test", "key", undefined, failingFetch),
    ).rejects.toThrow("status 403");

    const malformedFetch = vi
      .fn<typeof fetch>()
      .mockResolvedValue(new Response(JSON.stringify({ records: [] }), { status: 200 }));
    await expect(
      fetchPublishedInsights("https://supabase.example.test", "key", undefined, malformedFetch),
    ).rejects.toThrow("was not a list");
  });
});
