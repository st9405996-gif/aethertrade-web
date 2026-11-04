/**
 * @vitest-environment node
 */
import { describe, expect, it, vi } from "vitest";
import {
  HEALTH_NOTE,
  handleInquiryHealthRequest,
  isAuthorizedHealthRequest,
  runInquiryHealthCheck,
} from "@/lib/inquiry-health.server";

const OPS_TOKEN = "ops_health_token_0123456789abcdefghij";
const env = {
  INQUIRY_DELIVERY_ENABLED: "true",
  SUPABASE_URL: "https://example-project.supabase.co",
  SUPABASE_SERVICE_ROLE_KEY: "service_role_test_value_0123456789",
  RESEND_API_KEY: "re_test_value_0123456789",
  INQUIRY_NOTIFY_TO: "operations@aethertrade.cloud",
  INQUIRY_SALES_NOTIFY_TO: "sales@aethertrade.cloud",
  INQUIRY_FROM_EMAIL: "AETHER-TRADE <hello@aethertrade.cloud>",
  CONFIRMATION_SECRET: "confirmation_test_secret_0123456789abcdef",
  TURNSTILE_SECRET_KEY: "turnstile_test_secret_0123456789",
  PUBLIC_SITE_HOSTNAME: "aethertrade.cloud",
  ABUSE_HASH_SECRET: "abuse_hash_test_secret_0123456789abcdef",
  OPS_HEALTH_TOKEN: OPS_TOKEN,
};
const SECRET_VALUES = [
  env.SUPABASE_SERVICE_ROLE_KEY,
  env.RESEND_API_KEY,
  env.CONFIRMATION_SECRET,
  env.TURNSTILE_SECRET_KEY,
  env.ABUSE_HASH_SECRET,
  OPS_TOKEN,
];

/** Simulates all four providers. Each option sets that provider's response. */
function providers(
  o: {
    supabase?: number;
    quotas?: number;
    resend?: number;
    domains?: unknown;
    turnstile?: unknown;
    throwOn?: string;
  } = {},
) {
  return vi.fn(async (url: string) => {
    if (o.throwOn && url.includes(o.throwOn))
      throw new Error("connect ECONNREFUSED internal.example");
    if (url.includes("/rest/v1/inquiries"))
      return new Response("[]", { status: o.supabase ?? 200 });
    if (url.includes("/rest/v1/submission_quotas"))
      return new Response("[]", { status: o.quotas ?? 200 });
    if (url.includes("api.resend.com/domains")) {
      return new Response(
        JSON.stringify(
          o.domains ?? { data: [{ name: "aethertrade.cloud", status: "verified" }] },
        ),
        { status: o.resend ?? 200 },
      );
    }
    if (url.includes("challenges.cloudflare.com")) {
      return new Response(
        JSON.stringify(
          o.turnstile ?? { success: false, "error-codes": ["invalid-input-response"] },
        ),
        { status: 200 },
      );
    }
    throw new Error("unexpected " + url);
  });
}

describe("health endpoint authorization", () => {
  it("accepts only the exact bearer token", async () => {
    expect(await isAuthorizedHealthRequest(`Bearer ${OPS_TOKEN}`, OPS_TOKEN)).toBe(true);
    expect(await isAuthorizedHealthRequest(`Bearer ${OPS_TOKEN}x`, OPS_TOKEN)).toBe(false);
    expect(await isAuthorizedHealthRequest("Basic abc", OPS_TOKEN)).toBe(false);
    expect(await isAuthorizedHealthRequest(null, OPS_TOKEN)).toBe(false);
  });

  it("stays hidden when no token is configured or the token is too short", async () => {
    expect(await isAuthorizedHealthRequest("Bearer anything", undefined)).toBe(false);
    expect(await isAuthorizedHealthRequest("Bearer short", "short")).toBe(false);
  });

  it("returns 404 without revealing the endpoint to unauthorized callers", async () => {
    const response = await handleInquiryHealthRequest(
      new Request("https://example.test/api/inquiry-health"),
    );
    // Without a runtime environment token the handler must answer 404, not 401.
    expect(response.status).toBe(404);
  });
});

describe("runInquiryHealthCheck", () => {
  it("reports missing configuration by name, makes no provider calls, and never 200s", async () => {
    const f = providers();
    const { httpStatus, report } = await runInquiryHealthCheck(
      { ...env, RESEND_API_KEY: undefined, TURNSTILE_SECRET_KEY: undefined },
      f as unknown as typeof fetch,
    );
    expect(httpStatus).toBe(503);
    expect(report.checks.configuration).toBe("missing_variables");
    expect(report.missing_variables).toEqual(
      expect.arrayContaining(["RESEND_API_KEY", "TURNSTILE_SECRET_KEY"]),
    );
    expect(f).not.toHaveBeenCalled();
  });

  it("is healthy only when every provider check passes and the sender domain is verified", async () => {
    const { httpStatus, report } = await runInquiryHealthCheck(
      env,
      providers({
        turnstile: { success: false, "error-codes": ["invalid-input-response"] },
      }) as unknown as typeof fetch,
    );
    expect(httpStatus).toBe(200);
    expect(report.status).toBe("healthy");
    expect(report.checks).toEqual({
      configuration: "valid",
      supabase_inquiries: "ok",
      supabase_quotas: "ok",
      resend_api: "ok",
      sender_domain: "verified",
      turnstile_secret: "ok",
    });
  });

  it("never reports delivery as verified, even when every check passes", async () => {
    const { report } = await runInquiryHealthCheck(
      env,
      providers({
        turnstile: { success: false, "error-codes": ["invalid-input-response"] },
      }) as unknown as typeof fetch,
    );
    expect(report.delivery_verified).toBe(false);
    expect(report.note).toBe(HEALTH_NOTE);
    expect(report.note).toMatch(/do not create inquiries or send messages/);
  });

  it("flags an unverified sender domain as unhealthy", async () => {
    const { httpStatus, report } = await runInquiryHealthCheck(
      env,
      providers({
        domains: { data: [{ name: "aethertrade.cloud", status: "pending" }] },
        turnstile: { success: false, "error-codes": ["invalid-input-response"] },
      }) as unknown as typeof fetch,
    );
    expect(httpStatus).toBe(503);
    expect(report.checks.sender_domain).toBe("not_verified");
  });

  it("reports a rejected Resend key as failed, without the provider's message", async () => {
    const { report } = await runInquiryHealthCheck(
      env,
      providers({ resend: 401 }) as unknown as typeof fetch,
    );
    expect(report.checks.resend_api).toBe("failed");
    expect(report.checks.sender_domain).toBe("unknown");
  });

  it("reports a rejected Supabase key and unreachable services by category", async () => {
    const { report } = await runInquiryHealthCheck(
      env,
      providers({ supabase: 401, throwOn: "api.resend.com" }) as unknown as typeof fetch,
    );
    expect(report.checks.supabase_inquiries).toBe("failed");
    expect(report.checks.resend_api).toBe("unreachable");
  });

  it("detects an invalid Turnstile secret", async () => {
    const { report } = await runInquiryHealthCheck(
      env,
      providers({
        turnstile: { success: false, "error-codes": ["invalid-input-secret"] },
      }) as unknown as typeof fetch,
    );
    expect(report.checks.turnstile_secret).toBe("failed");
  });

  it("never returns secret values, provider error text, domain lists or hostnames", async () => {
    const scenarios = [
      providers(),
      providers({
        supabase: 500,
        resend: 403,
        turnstile: { success: false, "error-codes": ["invalid-input-secret"] },
      }),
      providers({ throwOn: "challenges.cloudflare.com" }),
    ];
    for (const f of scenarios) {
      const { report } = await runInquiryHealthCheck(env, f as unknown as typeof fetch);
      const text = JSON.stringify(report);
      for (const secret of SECRET_VALUES) expect(text).not.toContain(secret);
      expect(text).not.toContain("ECONNREFUSED");
      expect(text).not.toContain("aethertrade.cloud");
      expect(text).not.toContain("hello@aethertrade.cloud");
      expect(text).not.toContain("internal.example");
    }
  });

  it("bounds every provider call with a timeout", async () => {
    const f = providers({
      turnstile: { success: false, "error-codes": ["invalid-input-response"] },
    });
    await runInquiryHealthCheck(env, f as unknown as typeof fetch);
    for (const call of f.mock.calls as unknown as [string, RequestInit | undefined][]) {
      const init = call[1];
      expect(init?.signal).toBeInstanceOf(AbortSignal);
    }
  });

  it("reports the delivery flag separately from configuration validity", async () => {
    const { report } = await runInquiryHealthCheck(
      { ...env, INQUIRY_DELIVERY_ENABLED: undefined },
      providers({
        turnstile: { success: false, "error-codes": ["invalid-input-response"] },
      }) as unknown as typeof fetch,
    );
    expect(report.delivery_flag).toBe("disabled");
    expect(report.checks.configuration).toBe("valid");
  });
});
