import { describe, expect, it, vi } from "vitest";
import {
  fetchPublishedCmsPage,
  mergeCmsHead,
  type PublishedCmsPage,
} from "@/lib/public-cms.functions";

const now = Date.parse("2026-11-06T12:00:00.000Z");
const baseUrl = "https://supabase.example.test";
const publishableKey = "public-test-key";

function pageRecord(overrides: Record<string, unknown> = {}) {
  return {
    slug: "custom-page",
    title: "Custom Page",
    body: "Public page content",
    publication: "Published",
    scheduled_at: null,
    seo_title: "",
    seo_description: "",
    canonical: "",
    noindex: false,
    fields: { sections: [] },
    ...overrides,
  };
}

function jsonResponse(payload: unknown, status = 200): Response {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { "content-type": "application/json" },
  });
}

describe("public CMS page reader", () => {
  it("queries the exact slug through the public pages module and parses a published record", async () => {
    const fetchImpl = vi.fn<typeof fetch>().mockResolvedValue(jsonResponse([pageRecord()]));

    await expect(
      fetchPublishedCmsPage(baseUrl, publishableKey, "custom-page", fetchImpl, now),
    ).resolves.toMatchObject({
      slug: "custom-page",
      title: "Custom Page",
      body: "Public page content",
      noindex: false,
    });

    const [requestUrl, requestInit] = fetchImpl.mock.calls[0] ?? [];
    const url = new URL(String(requestUrl));
    expect(url.pathname).toBe("/rest/v1/content_records");
    expect(url.searchParams.get("module")).toBe("eq.pages");
    expect(url.searchParams.get("slug")).toBe("eq.custom-page");
    expect(url.searchParams.get("limit")).toBe("1");
    expect(url.searchParams.get("or")).toContain("publication.eq.Published");
    const requestHeaders = new Headers(requestInit?.headers);
    expect(requestHeaders.get("apikey")).toBe(publishableKey);
    expect(requestHeaders.get("authorization")).toBe("Bearer " + publishableKey);
    expect(requestHeaders.get("accept")).toBe("application/json");
  });

  it("rejects malformed slugs before making a request", async () => {
    const fetchImpl = vi.fn<typeof fetch>();

    await expect(
      fetchPublishedCmsPage(baseUrl, publishableKey, "../admin", fetchImpl, now),
    ).rejects.toThrow("Invalid CMS page slug.");
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it.each([
    ["draft", pageRecord({ publication: "Draft" })],
    ["archived", pageRecord({ publication: "Archived" })],
    [
      "scheduled in the future",
      pageRecord({ publication: "Scheduled", scheduled_at: "2026-11-06T12:01:00.000Z" }),
    ],
  ])("does not resolve %s pages", async (_label, record) => {
    const fetchImpl = vi.fn<typeof fetch>().mockResolvedValue(jsonResponse([record]));

    await expect(
      fetchPublishedCmsPage(baseUrl, publishableKey, "custom-page", fetchImpl, now),
    ).resolves.toBeNull();
  });

  it("allows a scheduled page only after its schedule time", async () => {
    const fetchImpl = vi.fn<typeof fetch>().mockResolvedValue(
      jsonResponse([
        pageRecord({
          publication: "Scheduled",
          scheduled_at: "2026-11-06T11:59:00.000Z",
        }),
      ]),
    );

    await expect(
      fetchPublishedCmsPage(baseUrl, publishableKey, "custom-page", fetchImpl, now),
    ).resolves.toMatchObject({ slug: "custom-page" });
  });

  it("uses the /pages/:slug canonical for dynamic pages without changing fixed-route defaults", () => {
    const base = {
      meta: [] as { title?: string; name?: string; property?: string; content?: string }[],
      links: [] as { rel?: string; href?: string }[],
    };
    const page: PublishedCmsPage = {
      slug: "custom-page",
      title: "Custom Page",
      body: "Public page content",
      seoTitle: "",
      seoDescription: "",
      canonical: "",
      noindex: false,
      sections: [],
    };

    expect(mergeCmsHead(base, page).links).toEqual([
      { rel: "canonical", href: "https://aethertrade.cloud/custom-page" },
    ]);
    expect(mergeCmsHead(base, page, { fallbackPath: "/pages/custom-page" }).links).toEqual([
      { rel: "canonical", href: "https://aethertrade.cloud/pages/custom-page" },
    ]);
  });

  it("returns not-found data for records hidden by public RLS and rejects service errors", async () => {
    const hiddenRecord = vi.fn<typeof fetch>().mockResolvedValue(jsonResponse([]));
    const deniedRequest = vi
      .fn<typeof fetch>()
      .mockResolvedValue(jsonResponse({ message: "denied" }, 403));

    await expect(
      fetchPublishedCmsPage(baseUrl, publishableKey, "custom-page", hiddenRecord, now),
    ).resolves.toBeNull();
    await expect(
      fetchPublishedCmsPage(baseUrl, publishableKey, "custom-page", deniedRequest, now),
    ).rejects.toThrow("Published CMS page request failed with status 403.");
  });
});
