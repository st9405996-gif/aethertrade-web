import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it, vi } from "vitest";
import { analyticsEventSchema, validateAnalyticsOrigin } from "@/lib/analytics-event";
import { consumeAnalyticsRateLimit } from "@/lib/analytics-rate-limit.server";
import {
  requireServerVerifiedAnalyticsConsent,
  writeAnalyticsEvent,
} from "@/lib/analytics-write.server";

const foundationSql = readFileSync(
  join(process.cwd(), "docs", "database", "001-foundation.sql"),
  "utf8",
)
  .replace(/\s+/g, " ")
  .toLowerCase();
const grantsSql = readFileSync(
  join(process.cwd(), "docs", "database", "005-harden-table-grants.sql"),
  "utf8",
)
  .replace(/\s+/g, " ")
  .toLowerCase();

const event = {
  eventType: "page_view" as const,
  pagePath: "/",
  consent: true as const,
};

describe("analytics write security contract", () => {
  it("requires explicit consent and a constrained relative path", () => {
    expect(analyticsEventSchema.safeParse(event).success).toBe(true);
    expect(analyticsEventSchema.safeParse({ ...event, consent: false }).success).toBe(false);
    expect(
      analyticsEventSchema.safeParse({ ...event, pagePath: "https://example.com" }).success,
    ).toBe(false);
  });

  it("requires a matching origin and host", () => {
    expect(() =>
      validateAnalyticsOrigin("https://aethertrade.com", "aethertrade.com"),
    ).not.toThrow();
    expect(() => validateAnalyticsOrigin("https://attacker.example", "aethertrade.com")).toThrow();
    expect(() => validateAnalyticsOrigin(null, "aethertrade.com")).toThrow();
    expect(() => validateAnalyticsOrigin("invalid-origin", "aethertrade.com")).toThrow();
  });

  it("bounds tracked rate-limit keys and evicts expired windows", () => {
    const now = 1_000_000;
    for (let index = 0; index < 10_000; index += 1) {
      expect(consumeAnalyticsRateLimit(`client-${index}`, now)).toBe(true);
    }
    expect(consumeAnalyticsRateLimit("client-over-cap", now)).toBe(false);
    expect(consumeAnalyticsRateLimit("client-after-expiry", now + 60_001)).toBe(true);
  });

  it("fails closed when no server-verified analytics consent is available", () => {
    expect(() => requireServerVerifiedAnalyticsConsent(undefined)).toThrow(
      "Analytics event was not recorded because server-verifiable consent is unavailable.",
    );
    expect(() => requireServerVerifiedAnalyticsConsent(false)).toThrow();
    expect(() => requireServerVerifiedAnalyticsConsent(true)).not.toThrow();
  });

  it("uses the server-only role for the table that has no anonymous write grant", async () => {
    const fetchImpl = vi.fn<typeof fetch>().mockResolvedValue(new Response(null, { status: 204 }));

    await writeAnalyticsEvent(
      { supabaseUrl: "https://database.example/", serviceRoleKey: "server-only-test-key" },
      event,
      true,
      fetchImpl,
    );

    const [url, init] = fetchImpl.mock.calls[0]!;
    const headers = new Headers(init?.headers);
    expect(url).toBe("https://database.example/rest/v1/analytics_events");
    expect(headers.get("apikey")).toBe("server-only-test-key");
    expect(headers.get("authorization")).toBe("Bearer server-only-test-key");
    expect(init?.body).toBe(
      JSON.stringify({
        event_type: "page_view",
        page_path: "/",
        automation_slug: null,
        consent: true,
      }),
    );
    expect(foundationSql).toContain("grant all on public.analytics_events to service_role");
    expect(foundationSql).not.toMatch(
      /grant [^;]*on public\.analytics_events to (anon|authenticated)/,
    );
    expect(grantsSql).toContain(
      "analytics_events, job_applications, submission_quotas: service_role only",
    );
  });

  it("does not make a database request without server-verified consent", async () => {
    const fetchImpl = vi.fn<typeof fetch>();

    await expect(
      writeAnalyticsEvent(
        { supabaseUrl: "https://database.example", serviceRoleKey: "server-only-test-key" },
        event,
        undefined,
        fetchImpl,
      ),
    ).rejects.toThrow(
      "Analytics event was not recorded because server-verifiable consent is unavailable.",
    );
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it("surfaces database rejection instead of returning success", async () => {
    const fetchImpl = vi.fn<typeof fetch>().mockResolvedValue(new Response(null, { status: 403 }));
    await expect(
      writeAnalyticsEvent(
        { supabaseUrl: "https://database.example", serviceRoleKey: "server-only-test-key" },
        event,
        true,
        fetchImpl,
      ),
    ).rejects.toThrow("Analytics event was not accepted by the database.");
  });
});
