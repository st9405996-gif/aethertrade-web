/**
 * @vitest-environment node
 */
import { describe, expect, it, vi } from "vitest";
import {
  guardLiveSubmission,
  RATE_LIMITED_MESSAGE,
  REJECTED_MESSAGE,
  UNAVAILABLE_MESSAGE,
} from "@/lib/submission-guard.server";
import { consumeSubmissionQuota } from "@/lib/submission-quota.server";
import { TURNSTILE_ACTION } from "@/lib/turnstile.server";
import type { DeliveryConfig } from "@/lib/inquiry-delivery.server";

const config: DeliveryConfig = {
  supabaseUrl: "https://example-project.supabase.co",
  serviceRoleKey: "service_role_test_value_0123456789",
  resendApiKey: "re_test_value_0123456789",
  notifyTo: "hello@aethertrade.cloud",
  fromEmail: "notifications@example-verified-domain.test",
  confirmationSecret: "confirmation_test_secret_0123456789abcdef",
  turnstileSecret: "turnstile_test_secret_0123456789",
  publicSiteHostname: "aethertrade.cloud",
  abuseHashSecret: "abuse_hash_test_secret_0123456789abcdef",
  quotaLimit: 5,
  quotaWindowSeconds: 600,
};

type Call = [string, RequestInit | undefined];
const callsOf = (f: { mock: { calls: unknown[][] } }) => f.mock.calls as unknown as Call[];

/** Routes by URL: Turnstile and Supabase RPC responses are controlled independently. */
function router(opts: {
  turnstile: unknown;
  turnstileStatus?: number;
  quota: unknown;
  quotaStatus?: number;
  turnstileThrows?: boolean;
  quotaThrows?: boolean;
}) {
  return vi.fn(async (url: string) => {
    if (url.includes("challenges.cloudflare.com")) {
      if (opts.turnstileThrows) throw new Error("network");
      return new Response(JSON.stringify(opts.turnstile), { status: opts.turnstileStatus ?? 200 });
    }
    if (url.includes("/rpc/consume_submission_quota")) {
      if (opts.quotaThrows) throw new Error("network");
      return new Response(JSON.stringify(opts.quota), {
        status: opts.quotaStatus ?? 200,
        headers: { "content-type": "application/json" },
      });
    }
    throw new Error("unexpected URL " + url);
  });
}
const passChallenge = { success: true, action: TURNSTILE_ACTION, hostname: "aethertrade.cloud" };

describe("guardLiveSubmission (abuse controls, fail closed)", () => {
  it("allows a submission that passes the challenge and is under quota", async () => {
    const f = router({ turnstile: passChallenge, quota: true });
    expect(
      await guardLiveSubmission(
        { config, turnstileToken: "t", remoteIp: "198.51.100.9" },
        f as unknown as typeof fetch,
      ),
    ).toEqual({ ok: true });
  });

  it("rejects a failed challenge and never consumes quota", async () => {
    const f = router({
      turnstile: { success: false, "error-codes": ["invalid-input-response"] },
      quota: true,
    });
    const result = await guardLiveSubmission(
      { config, turnstileToken: "bad", remoteIp: "198.51.100.9" },
      f as unknown as typeof fetch,
    );
    expect(result).toMatchObject({
      ok: false,
      reason: "challenge_rejected",
      userMessage: REJECTED_MESSAGE,
    });
    expect(callsOf(f).some(([u]) => u.includes("/rpc/"))).toBe(false);
  });

  it("rejects a missing challenge token without contacting providers", async () => {
    const f = router({ turnstile: passChallenge, quota: true });
    const result = await guardLiveSubmission(
      { config, turnstileToken: undefined, remoteIp: "198.51.100.9" },
      f as unknown as typeof fetch,
    );
    expect(result).toMatchObject({ ok: false, reason: "challenge_rejected" });
    expect(f).not.toHaveBeenCalled();
  });

  it("reports rate limiting when the quota is exhausted", async () => {
    const f = router({ turnstile: passChallenge, quota: false });
    expect(
      await guardLiveSubmission(
        { config, turnstileToken: "t", remoteIp: "198.51.100.9" },
        f as unknown as typeof fetch,
      ),
    ).toMatchObject({
      ok: false,
      reason: "rate_limited",
      userMessage: RATE_LIMITED_MESSAGE,
    });
  });

  it("fails closed when Turnstile is unreachable", async () => {
    const f = router({ turnstile: passChallenge, quota: true, turnstileThrows: true });
    expect(
      await guardLiveSubmission(
        { config, turnstileToken: "t", remoteIp: "198.51.100.9" },
        f as unknown as typeof fetch,
      ),
    ).toMatchObject({
      ok: false,
      reason: "unavailable",
      userMessage: UNAVAILABLE_MESSAGE,
    });
    expect(callsOf(f).some(([u]) => u.includes("/rpc/"))).toBe(false);
  });

  it("fails closed when the quota store is unreachable", async () => {
    const f = router({ turnstile: passChallenge, quota: true, quotaThrows: true });
    expect(
      await guardLiveSubmission(
        { config, turnstileToken: "t", remoteIp: "198.51.100.9" },
        f as unknown as typeof fetch,
      ),
    ).toMatchObject({
      ok: false,
      reason: "unavailable",
    });
  });

  it("fails closed when the quota store returns an unexpected body", async () => {
    const f = router({ turnstile: passChallenge, quota: { unexpected: true } });
    expect(
      await guardLiveSubmission(
        { config, turnstileToken: "t", remoteIp: "198.51.100.9" },
        f as unknown as typeof fetch,
      ),
    ).toMatchObject({
      ok: false,
      reason: "unavailable",
    });
  });

  it("never sends the raw client address to the quota store", async () => {
    const f = router({ turnstile: passChallenge, quota: true });
    await guardLiveSubmission(
      { config, turnstileToken: "t", remoteIp: "198.51.100.9" },
      f as unknown as typeof fetch,
    );
    const quotaCall = callsOf(f).find(([u]) => u.includes("/rpc/"))!;
    const body = String(quotaCall[1]?.body);
    expect(body).not.toContain("198.51.100.9");
    expect(body).toMatch(/"p_key":"inquiry:[0-9a-f]{64}"/);
  });

  it("uses one shared bucket when the client address is unknown", async () => {
    const f = router({ turnstile: passChallenge, quota: true });
    await guardLiveSubmission(
      { config, turnstileToken: "t", remoteIp: undefined },
      f as unknown as typeof fetch,
    );
    const body = String(callsOf(f).find(([u]) => u.includes("/rpc/"))?.[1]?.body);
    expect(body).toMatch(/"p_key":"inquiry:[0-9a-f]{64}"/);
  });
});

describe("consumeSubmissionQuota (direct)", () => {
  const settings = {
    supabaseUrl: config.supabaseUrl,
    serviceRoleKey: config.serviceRoleKey,
    limit: 5,
    windowSeconds: 600,
  };
  it("maps boolean responses to allowed/limited", async () => {
    expect(
      await consumeSubmissionQuota(
        settings,
        "k",
        (async () => new Response("true")) as unknown as typeof fetch,
      ),
    ).toBe("allowed");
    expect(
      await consumeSubmissionQuota(
        settings,
        "k",
        (async () => new Response("false")) as unknown as typeof fetch,
      ),
    ).toBe("limited");
  });
  it("treats server errors as unavailable and never leaks the service key in logs", async () => {
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    expect(
      await consumeSubmissionQuota(
        settings,
        "k",
        (async () => new Response("boom", { status: 500 })) as unknown as typeof fetch,
      ),
    ).toBe("unavailable");
    expect(JSON.stringify(errorSpy.mock.calls)).not.toContain(config.serviceRoleKey);
    errorSpy.mockRestore();
  });
});
