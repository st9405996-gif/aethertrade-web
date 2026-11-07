import { describe, expect, it, vi } from "vitest";
import {
  DEFAULT_GLOBAL_SEO,
  parseGlobalSeoSettings,
  readPublishedGlobalSeoSettings,
} from "@/lib/global-seo.functions";

describe("public global SEO settings", () => {
  it("requests only the published site-wide settings row", async () => {
    const fetchImpl = vi.fn<typeof fetch>().mockResolvedValue(
      new Response(
        JSON.stringify([
          {
            settings: {
              ...DEFAULT_GLOBAL_SEO,
              siteName: "AETHER-TRADE updated",
              defaultTitle: "Trade operations",
            },
            is_published: true,
          },
        ]),
        { status: 200 },
      ),
    );

    await expect(
      readPublishedGlobalSeoSettings(
        "https://supabase.example.test/",
        "public-test-key",
        fetchImpl,
      ),
    ).resolves.toMatchObject({
      siteName: "AETHER-TRADE updated",
      defaultTitle: "Trade operations",
    });

    const [requestUrl, requestInit] = fetchImpl.mock.calls[0] ?? [];
    const url = new URL(String(requestUrl));
    expect(url.searchParams.get("id")).toBe("eq.1");
    expect(url.searchParams.get("is_published")).toBe("eq.true");
    expect(requestInit?.cache).toBe("no-store");
    const headers = new Headers(requestInit?.headers);
    expect(headers.get("apikey")).toBe("public-test-key");
    expect(headers.get("authorization")).toBe("Bearer public-test-key");
    expect(headers.get("accept")).toBe("application/json");
  });

  it("uses safe defaults for missing or invalid settings and URLs", () => {
    expect(parseGlobalSeoSettings(null)).toEqual(DEFAULT_GLOBAL_SEO);
    expect(
      parseGlobalSeoSettings({
        siteName: "  Updated name  ",
        siteUrl: "http://insecure.example.test",
        defaultOgImage: "javascript:alert(1)",
        sameAs: ["https://social.example.test/profile", "http://insecure.example.test/profile"],
      }),
    ).toMatchObject({
      siteName: "Updated name",
      siteUrl: DEFAULT_GLOBAL_SEO.siteUrl,
      defaultOgImage: "",
      sameAs: ["https://social.example.test/profile"],
    });
  });

  it("fails explicitly when the connection is unavailable", async () => {
    const fetchImpl = vi
      .fn<typeof fetch>()
      .mockResolvedValue(new Response("unavailable", { status: 503 }));

    await expect(readPublishedGlobalSeoSettings(undefined, "key", fetchImpl)).rejects.toThrow(
      "not configured",
    );
    await expect(
      readPublishedGlobalSeoSettings("https://supabase.example.test", "key", fetchImpl),
    ).rejects.toThrow("status 503");
    expect(fetchImpl).toHaveBeenCalledTimes(1);
  });

  it("uses explicit defaults only when the published settings row is absent", async () => {
    const fetchImpl = vi.fn<typeof fetch>().mockResolvedValue(new Response("[]", { status: 200 }));
    await expect(
      readPublishedGlobalSeoSettings("https://supabase.example.test", "key", fetchImpl),
    ).resolves.toEqual(DEFAULT_GLOBAL_SEO);
  });

  it("fails explicitly for malformed public responses", async () => {
    const fetchImpl = vi
      .fn<typeof fetch>()
      .mockResolvedValue(
        new Response(JSON.stringify({ settings: { siteName: "Draft" } }), { status: 200 }),
      );

    await expect(
      readPublishedGlobalSeoSettings("https://supabase.example.test", "key", fetchImpl),
    ).rejects.toThrow("was not a list");
  });
});
