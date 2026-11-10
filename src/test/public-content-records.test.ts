import { describe, expect, it, vi } from "vitest";
import { fetchPublishedContentRecords } from "@/lib/public-content-records.functions";

const now = Date.parse("2026-11-06T12:00:00.000Z");
const baseUrl = "https://supabase.example.test";
const publishableKey = "public-test-key";

function row(overrides: Record<string, unknown> = {}) {
  return {
    id: "record-1",
    module: "services",
    slug: "service-one",
    title: "Service One",
    body: "Service description",
    category: "",
    availability: "Available",
    position: 1,
    publication: "Published",
    scheduled_at: null,
    noindex: false,
    fields: {},
    ...overrides,
  };
}

describe("published public content reader", () => {
  it("keeps published noindex records publicly visible while excluding non-public states", async () => {
    const fetchImpl = vi.fn<typeof fetch>().mockResolvedValue(
      new Response(
        JSON.stringify([
          row({ noindex: true }),
          row({ id: "draft", publication: "Draft" }),
          row({
            id: "scheduled-now",
            publication: "Scheduled",
            scheduled_at: "2026-11-06T11:59:00.000Z",
          }),
          row({
            id: "scheduled-later",
            publication: "Scheduled",
            scheduled_at: "2026-11-06T12:01:00.000Z",
          }),
          row({ id: "archived", publication: "Archived" }),
        ]),
        { status: 200 },
      ),
    );

    await expect(
      fetchPublishedContentRecords(baseUrl, publishableKey, "services", fetchImpl, now),
    ).resolves.toMatchObject([{ id: "record-1" }, { id: "scheduled-now" }]);

    const [requestUrl, requestInit] = fetchImpl.mock.calls[0] ?? [];
    const url = new URL(String(requestUrl));
    expect(url.searchParams.get("module")).toBe("eq.services");
    expect(url.searchParams.get("noindex")).toBeNull();
    expect(url.searchParams.get("or")).toContain("2026-11-06T12:00:00.000Z");
    expect(requestInit?.cache).toBe("no-store");
    const headers = new Headers(requestInit?.headers);
    expect(headers.get("apikey")).toBe(publishableKey);
    expect(headers.get("authorization")).toBe("Bearer " + publishableKey);
  });

  it("reports configuration, HTTP, and malformed-response errors", async () => {
    const fetchImpl = vi
      .fn<typeof fetch>()
      .mockResolvedValue(new Response("denied", { status: 403 }));

    await expect(
      fetchPublishedContentRecords(undefined, publishableKey, "services", fetchImpl),
    ).rejects.toThrow("not configured");
    await expect(
      fetchPublishedContentRecords(baseUrl, publishableKey, "services", fetchImpl),
    ).rejects.toThrow("status 403");

    const malformedFetch = vi
      .fn<typeof fetch>()
      .mockResolvedValue(new Response(JSON.stringify({ records: [] }), { status: 200 }));
    await expect(
      fetchPublishedContentRecords(baseUrl, publishableKey, "services", malformedFetch),
    ).rejects.toThrow("was not a list");
  });

  it("allows the public reader to request workflow demo records", async () => {
    const fetchImpl = vi.fn<typeof fetch>().mockResolvedValue(
      new Response(JSON.stringify([row({ module: "workflow", slug: "shipment-follow-up" })]), { status: 200 }),
    );
    await expect(
      fetchPublishedContentRecords(baseUrl, publishableKey, "workflow", fetchImpl, now),
    ).resolves.toMatchObject([{ module: "workflow", slug: "shipment-follow-up" }]);
    const [requestUrl] = fetchImpl.mock.calls[0] ?? [];
    expect(new URL(String(requestUrl)).searchParams.get("module")).toBe("eq.workflow");
  });
});
