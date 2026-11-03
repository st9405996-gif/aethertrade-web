// SERVER-ONLY. Abuse controls for live submissions: Turnstile first (cheap filter that
// stops scripted traffic), then the atomic per-client quota. Any unavailable dependency
// fails closed and nothing is stored.
import { hmacSha256Hex } from "@/lib/crypto-utils";
import { consumeSubmissionQuota } from "@/lib/submission-quota.server";
import { verifyTurnstile } from "@/lib/turnstile.server";
import type { DeliveryConfig } from "@/lib/inquiry-delivery.server";

export const REJECTED_MESSAGE =
  "Your submission could not be accepted. Please check the form and try again.";
export const RATE_LIMITED_MESSAGE =
  "Too many submission attempts from this connection. Please wait a few minutes and try again.";
export const UNAVAILABLE_MESSAGE =
  "Submissions are temporarily unavailable. Please try again later.";

export type GuardResult =
  | { ok: true }
  | {
      ok: false;
      reason: "challenge_rejected" | "rate_limited" | "unavailable";
      userMessage: string;
    };

export interface GuardInput {
  config: DeliveryConfig;
  turnstileToken: string | undefined;
  remoteIp: string | undefined;
}

export async function guardLiveSubmission(
  input: GuardInput,
  fetchImpl: typeof fetch = fetch,
): Promise<GuardResult> {
  const challenge = await verifyTurnstile(
    {
      token: input.turnstileToken,
      secret: input.config.turnstileSecret,
      expectedHostname: input.config.publicSiteHostname,
      remoteIp: input.remoteIp,
    },
    fetchImpl,
  );
  if (challenge === "unavailable") {
    return { ok: false, reason: "unavailable", userMessage: UNAVAILABLE_MESSAGE };
  }
  if (challenge === "rejected") {
    return { ok: false, reason: "challenge_rejected", userMessage: REJECTED_MESSAGE };
  }

  // Missing IP still counts, in a shared bucket, so header stripping cannot bypass the quota.
  const clientKey = await hmacSha256Hex(
    input.config.abuseHashSecret,
    input.remoteIp ?? "unknown-client",
  );
  const quota = await consumeSubmissionQuota(
    {
      supabaseUrl: input.config.supabaseUrl,
      serviceRoleKey: input.config.serviceRoleKey,
      limit: input.config.quotaLimit,
      windowSeconds: input.config.quotaWindowSeconds,
    },
    `inquiry:${clientKey}`,
    fetchImpl,
  );
  if (quota === "unavailable") {
    return { ok: false, reason: "unavailable", userMessage: UNAVAILABLE_MESSAGE };
  }
  if (quota === "limited") {
    return { ok: false, reason: "rate_limited", userMessage: RATE_LIMITED_MESSAGE };
  }
  return { ok: true };
}
