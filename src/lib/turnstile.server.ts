// SERVER-ONLY. Verifies a Cloudflare Turnstile token. Never trusts the browser's word for it.
// Result "unavailable" means the check could not be completed; callers must fail closed.
export type ChallengeOutcome = "passed" | "rejected" | "unavailable";

export const TURNSTILE_VERIFY_URL = "https://challenges.cloudflare.com/turnstile/v0/siteverify";
export const TURNSTILE_ACTION = "inquiry";
const TIMEOUT_MS = 5_000;

interface SiteverifyResponse {
  success?: unknown;
  action?: unknown;
  hostname?: unknown;
  "error-codes"?: unknown;
}

export async function verifyTurnstile(
  input: {
    token: string | undefined;
    secret: string;
    expectedHostname: string;
    remoteIp: string | undefined;
  },
  fetchImpl: typeof fetch = fetch,
): Promise<ChallengeOutcome> {
  if (!input.token) return "rejected";
  const body = new URLSearchParams({ secret: input.secret, response: input.token });
  if (input.remoteIp) body.set("remoteip", input.remoteIp);
  let response: Response;
  try {
    response = await fetchImpl(TURNSTILE_VERIFY_URL, {
      method: "POST",
      body,
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
  } catch {
    console.error("turnstile: verification request failed");
    return "unavailable";
  }
  if (!response.ok) {
    console.error("turnstile: verification service returned an error", { status: response.status });
    return "unavailable";
  }
  let data: SiteverifyResponse;
  try {
    data = (await response.json()) as SiteverifyResponse;
  } catch {
    return "unavailable";
  }
  if (data.success !== true) return "rejected";
  if (data.action !== TURNSTILE_ACTION) return "rejected";
  if (data.hostname !== input.expectedHostname) return "rejected";
  return "passed";
}

/**
 * Health probe: a deliberately invalid response with the real secret. Cloudflare reports
 * "invalid-input-secret" for a wrong secret and "invalid-input-response" for a valid secret.
 * No token or secret value is returned to the caller.
 */
export async function probeTurnstileSecret(
  secret: string,
  fetchImpl: typeof fetch = fetch,
): Promise<"valid" | "invalid" | "unreachable"> {
  try {
    const response = await fetchImpl(TURNSTILE_VERIFY_URL, {
      method: "POST",
      body: new URLSearchParams({ secret, response: "health-check-probe" }),
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    if (!response.ok) return "unreachable";
    const data = (await response.json()) as SiteverifyResponse;
    const codes = Array.isArray(data["error-codes"]) ? (data["error-codes"] as unknown[]) : [];
    if (codes.includes("invalid-input-secret")) return "invalid";
    if (codes.includes("invalid-input-response") || codes.includes("timeout-or-duplicate"))
      return "valid";
    return "unreachable";
  } catch {
    return "unreachable";
  }
}
