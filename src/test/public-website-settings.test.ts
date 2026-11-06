import { describe, expect, it, vi } from "vitest";
import { readPublicWebsiteSettings } from "@/lib/public-website-settings.functions";

const baseUrl = "https://supabase.example.test";
const publishableKey = "public-test-key";

function jsonResponse(payload: unknown, status = 200): Response {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { "content-type": "application/json" },
  });
}

describe("readPublicWebsiteSettings", () => {
  it("reports an explicitly enabled Careers setting", async () => {
    const fetchImpl = vi
      .fn<typeof fetch>()
      .mockResolvedValue(jsonResponse([{ careers_enabled: true }]));

    await expect(readPublicWebsiteSettings(baseUrl, publishableKey, fetchImpl)).resolves.toEqual({
      status: "available",
      careersEnabled: true,
    });

    expect(fetchImpl).toHaveBeenCalledOnce();
    expect(String(fetchImpl.mock.calls[0]?.[0])).toContain("/public_website_settings");
  });

  it("reports an explicitly disabled Careers setting", async () => {
    const fetchImpl = vi
      .fn<typeof fetch>()
      .mockResolvedValue(jsonResponse([{ careers_enabled: false }]));

    await expect(readPublicWebsiteSettings(baseUrl, publishableKey, fetchImpl)).resolves.toEqual({
      status: "available",
      careersEnabled: false,
    });
  });

  it("distinguishes a missing settings row from an unavailable request", async () => {
    const fetchImpl = vi.fn<typeof fetch>().mockResolvedValue(jsonResponse([]));

    await expect(readPublicWebsiteSettings(baseUrl, publishableKey, fetchImpl)).resolves.toEqual({
      status: "missing",
      careersEnabled: false,
    });
  });

  it("fails closed when settings connection configuration is missing", async () => {
    const fetchImpl = vi.fn<typeof fetch>();

    await expect(readPublicWebsiteSettings(undefined, publishableKey, fetchImpl)).resolves.toEqual({
      status: "unavailable",
      careersEnabled: false,
    });
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it("fails closed when the settings service is unavailable", async () => {
    const fetchImpl = vi
      .fn<typeof fetch>()
      .mockResolvedValue(jsonResponse({ error: "unavailable" }, 503));

    await expect(readPublicWebsiteSettings(baseUrl, publishableKey, fetchImpl)).resolves.toEqual({
      status: "unavailable",
      careersEnabled: false,
    });
  });

  it("fails closed on network and malformed response errors", async () => {
    const networkFailure = vi
      .fn<typeof fetch>()
      .mockRejectedValue(new Error("network unavailable"));
    const malformedResponse = vi
      .fn<typeof fetch>()
      .mockResolvedValue(new Response("{", { status: 200 }));

    await expect(
      readPublicWebsiteSettings(baseUrl, publishableKey, networkFailure),
    ).resolves.toEqual({ status: "unavailable", careersEnabled: false });
    await expect(
      readPublicWebsiteSettings(baseUrl, publishableKey, malformedResponse),
    ).resolves.toEqual({ status: "unavailable", careersEnabled: false });
  });
});
