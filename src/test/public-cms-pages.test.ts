import { describe, expect, it, vi } from "vitest";
import {
  fetchPublishedCmsPage,
  mergeCmsHead,
  type PublishedCmsPage,
} from "@/lib/public-cms.functions";
import { writeAdminRecord } from "@/lib/admin-mutations";

const now = Date.parse("2026-11-06T12:00:00.000Z");
const baseUrl = "https://supabase.example.test";
const publishableKey = "public-test-key";
const recordId = "6a86e6f4-4bdc-4c79-b8ac-3b94d6b7e531";

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
    expect(requestInit?.cache).toBe("no-store");
    const requestHeaders = new Headers(requestInit?.headers);
    expect(requestHeaders.get("apikey")).toBe(publishableKey);
    expect(requestHeaders.get("authorization")).toBe("Bearer " + publishableKey);
    expect(requestHeaders.get("accept")).toBe("application/json");
  });

  it("uses the same-origin media proxy and rejects arbitrary external image origins", async () => {
    const fetchImpl = vi.fn<typeof fetch>().mockResolvedValue(
      jsonResponse([
        pageRecord({
          fields: {
            sections: [
              {
                id: "legacy-storage",
                title: "Legacy Storage URL",
                imageUrl:
                  "https://supabase.example.test/storage/v1/object/public/website-media/user-1/photo.png",
              },
              {
                id: "proxy-path",
                title: "Proxy Path",
                imageUrl:
                  "/api/admin-supabase/storage/v1/object/public/website-media/user-1/photo.png",
              },
              {
                id: "external-origin",
                title: "External Origin",
                imageUrl: "https://images.example.test/photo.png",
              },
              {
                id: "unsafe-path",
                title: "Unsafe Path",
                imageUrl: "/api/admin-supabase/storage/v1/object/public/website-media/../secret",
              },
            ],
          },
        }),
      ]),
    );

    await expect(
      fetchPublishedCmsPage(baseUrl, publishableKey, "custom-page", fetchImpl, now),
    ).resolves.toMatchObject({
      sections: [
        {
          id: "legacy-storage",
          imageUrl: "/api/admin-supabase/storage/v1/object/public/website-media/user-1/photo.png",
        },
        {
          id: "proxy-path",
          imageUrl: "/api/admin-supabase/storage/v1/object/public/website-media/user-1/photo.png",
        },
        { id: "external-origin", imageUrl: "" },
        { id: "unsafe-path", imageUrl: "" },
      ],
    });
  });

  it("preserves selected media URL and alt text through save and public reload", async () => {
    const section = {
      id: "shipment-documents",
      title: "Shipment documents",
      body: "Review the uploaded document.",
      imageUrl: "/api/admin-supabase/storage/v1/object/public/website-media/user-1/photo.png",
      imageAlt: "Bill of lading",
    };
    const savedRecord = pageRecord({
      id: recordId,
      fields: { sections: JSON.stringify([section]) },
    });
    const saveFetch = vi.fn<typeof fetch>().mockResolvedValue(jsonResponse([savedRecord]));

    await writeAdminRecord(
      {
        accessToken: "test-access-token",
        path: "/rest/v1/content_records?id=eq." + recordId,
        method: "PATCH",
        body: { fields: savedRecord["fields"] },
        expectedId: recordId,
        operation: "Content save",
      },
      saveFetch,
    );

    const sentBody = JSON.parse(String(saveFetch.mock.calls[0]?.[1]?.body)) as {
      fields: { sections: string };
    };
    expect(JSON.parse(sentBody.fields.sections)).toEqual([section]);

    const reloadFetch = vi.fn<typeof fetch>().mockResolvedValue(jsonResponse([savedRecord]));
    await expect(
      fetchPublishedCmsPage(baseUrl, publishableKey, "custom-page", reloadFetch, now),
    ).resolves.toMatchObject({ sections: [section] });
  });

  it("preserves hidden state for CMS sections so placeholders stay unpublished", async () => {
    const fetchImpl = vi.fn<typeof fetch>().mockResolvedValue(
      jsonResponse([
        pageRecord({
          fields: {
            sections: [
              { id: "founder-note", title: "Founder note", body: "", hidden: true },
              { id: "case-studies", title: "Future case studies", body: "Approved cases only.", hidden: false },
            ],
          },
        }),
      ]),
    );

    await expect(
      fetchPublishedCmsPage(baseUrl, publishableKey, "custom-page", fetchImpl, now),
    ).resolves.toMatchObject({
      sections: [
        { id: "founder-note", hidden: true },
        { id: "case-studies", hidden: false },
      ],
    });
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

  it("keeps a published noindex page publicly accessible", async () => {
    const fetchImpl = vi
      .fn<typeof fetch>()
      .mockResolvedValue(jsonResponse([pageRecord({ noindex: true })]));

    await expect(
      fetchPublishedCmsPage(baseUrl, publishableKey, "custom-page", fetchImpl, now),
    ).resolves.toMatchObject({ slug: "custom-page", noindex: true });
  });

  it("emits a self-referencing canonical when CMS data is absent", () => {
    const base = {
      meta: [] as { title?: string; name?: string; property?: string; content?: string }[],
      links: [] as { rel?: string; href?: string }[],
    };

    const result = mergeCmsHead(base, null, { fallbackPath: "/platform" });
    expect(result.links).toEqual([
      { rel: "canonical", href: "https://aethertrade.cloud/platform" },
    ]);
    expect(result.meta).toContainEqual({
      property: "og:url",
      content: "https://aethertrade.cloud/platform",
    });
  });

  it("normalizes approved CMS canonical hosts and rejects cross-route overrides", () => {
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
      canonical: "https://www.aethertrade.cloud/custom-page",
      noindex: false,
      sections: [],
      heroEyebrow: "",
      heroTitle: "",
      heroDescription: "",
      ctaTitle: "",
      ctaDescription: "",
    };

    expect(mergeCmsHead(base, page).links).toEqual([
      { rel: "canonical", href: "https://aethertrade.cloud/custom-page" },
    ]);

    const invalid = mergeCmsHead(base, { ...page, canonical: "https://aethertrade.cloud/" });
    expect(invalid.links).toEqual([
      { rel: "canonical", href: "https://aethertrade.cloud/custom-page" },
    ]);
  });

  it("uses the supplied route path for nested CMS pages", () => {
    const base = {
      meta: [] as { title?: string; name?: string; property?: string; content?: string }[],
      links: [] as { rel?: string; href?: string }[],
    };
    const page = { ...pageRecord(), slug: "custom-page" } as PublishedCmsPage;
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
