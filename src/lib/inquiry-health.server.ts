// SERVER-ONLY. Operational readiness check for live inquiry delivery.
// Reports dependency categories only: never secret values, error text, rows or personal data.
// It does NOT create inquiries or send messages, so it does not prove end-to-end delivery.
import { sha256Hex, timingSafeEqual } from "@/lib/crypto-utils";
import { parseDeliveryConfig } from "@/lib/inquiry-delivery.server";
import { probeTurnstileSecret } from "@/lib/turnstile.server";
import { readServerEnv } from "@/lib/server-env.server";

const TIMEOUT_MS = 5_000;
const MIN_TOKEN_LENGTH = 32;

export type ServiceCheck = "ok" | "failed" | "unreachable" | "skipped";
export type SenderDomainCheck = "verified" | "not_verified" | "unknown" | "skipped";

export interface HealthReport {
  status: "healthy" | "unhealthy";
  delivery_flag: "enabled" | "disabled";
  checks: {
    configuration: "valid" | "invalid" | "missing_variables";
    supabase_inquiries: ServiceCheck;
    supabase_quotas: ServiceCheck;
    resend_api: ServiceCheck;
    sender_domain: SenderDomainCheck;
    turnstile_secret: ServiceCheck;
  };
  missing_variables: string[];
  delivery_verified: false;
  note: string;
}

export const HEALTH_NOTE =
  "Health checks confirm configuration and provider reachability only. They do not create inquiries or send messages. End-to-end delivery is proven only by the staging test runbook.";

/** Authorizes a request by bearer token. Without a configured token the endpoint is hidden. */
export async function isAuthorizedHealthRequest(
  authorization: string | null,
  expectedToken: string | undefined,
): Promise<boolean> {
  if (!expectedToken || expectedToken.length < MIN_TOKEN_LENGTH) return false;
  const match = /^Bearer (.+)$/.exec(authorization ?? "");
  if (!match) return false;
  return timingSafeEqual(await sha256Hex(match[1]!), await sha256Hex(expectedToken));
}

async function probeGet(
  url: string,
  headers: Record<string, string>,
  fetchImpl: typeof fetch,
): Promise<{ status: number } | "unreachable"> {
  try {
    const response = await fetchImpl(url, { headers, signal: AbortSignal.timeout(TIMEOUT_MS) });
    return { status: response.status };
  } catch {
    return "unreachable";
  }
}

function toServiceCheck(result: { status: number } | "unreachable"): ServiceCheck {
  if (result === "unreachable") return "unreachable";
  return result.status >= 200 && result.status < 300 ? "ok" : "failed";
}

function senderDomainOf(fromEmail: string): string | null {
  const match = /<([^<>]+)>\s*$/.exec(fromEmail.trim());
  const address = match ? match[1]! : fromEmail.trim();
  const at = address.lastIndexOf("@");
  return at === -1 ? null : address.slice(at + 1).toLowerCase();
}

export async function runInquiryHealthCheck(
  env: Record<string, string | undefined>,
  fetchImpl: typeof fetch = fetch,
): Promise<{ httpStatus: 200 | 503; report: HealthReport }> {
  const flag = env["INQUIRY_DELIVERY_ENABLED"] === "true" ? "enabled" : "disabled";
  const parsed = parseDeliveryConfig(env);

  if (!parsed.valid) {
    const report: HealthReport = {
      status: "unhealthy",
      delivery_flag: flag,
      checks: {
        configuration: parsed.missing.length ? "missing_variables" : "invalid",
        supabase_inquiries: "skipped",
        supabase_quotas: "skipped",
        resend_api: "skipped",
        sender_domain: "skipped",
        turnstile_secret: "skipped",
      },
      missing_variables: parsed.missing,
      delivery_verified: false,
      note: HEALTH_NOTE,
    };
    return { httpStatus: 503, report };
  }

  const config = parsed.config;
  const supabaseHeaders = {
    apikey: config.serviceRoleKey,
    Authorization: `Bearer ${config.serviceRoleKey}`,
  };
  const inquiries = toServiceCheck(
    await probeGet(
      `${config.supabaseUrl}/rest/v1/inquiries?select=request_key&limit=1`,
      supabaseHeaders,
      fetchImpl,
    ),
  );
  const quotas = toServiceCheck(
    await probeGet(
      `${config.supabaseUrl}/rest/v1/submission_quotas?select=quota_key&limit=1`,
      supabaseHeaders,
      fetchImpl,
    ),
  );

  // Resend: one request. The key must be accepted and the sender's domain must be verified.
  // Only booleans are reported; domain names and ids are never returned.
  const senderDomain = senderDomainOf(config.fromEmail);
  let resend: ServiceCheck = "unreachable";
  let sender: SenderDomainCheck = "unknown";
  try {
    const response = await fetchImpl("https://api.resend.com/domains", {
      headers: { Authorization: `Bearer ${config.resendApiKey}` },
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    if (response.status === 200) {
      resend = "ok";
      const body = (await response.json().catch(() => ({}))) as {
        data?: { name?: unknown; status?: unknown }[];
      };
      const match = Array.isArray(body.data)
        ? body.data.find((d) => typeof d.name === "string" && d.name.toLowerCase() === senderDomain)
        : undefined;
      sender =
        match && match.status === "verified"
          ? "verified"
          : Array.isArray(body.data)
            ? "not_verified"
            : "unknown";
    } else {
      resend = "failed";
    }
  } catch {
    resend = "unreachable";
  }

  const turnstile = await probeTurnstileSecret(config.turnstileSecret, fetchImpl);
  const turnstileCheck: ServiceCheck =
    turnstile === "valid" ? "ok" : turnstile === "invalid" ? "failed" : "unreachable";

  const allOk =
    inquiries === "ok" &&
    quotas === "ok" &&
    resend === "ok" &&
    sender === "verified" &&
    turnstileCheck === "ok";

  const report: HealthReport = {
    status: allOk ? "healthy" : "unhealthy",
    delivery_flag: flag,
    checks: {
      configuration: "valid",
      supabase_inquiries: inquiries,
      supabase_quotas: quotas,
      resend_api: resend,
      sender_domain: sender,
      turnstile_secret: turnstileCheck,
    },
    missing_variables: [],
    delivery_verified: false,
    note: HEALTH_NOTE,
  };
  return { httpStatus: allOk ? 200 : 503, report };
}

/** Route handler. Returns 404 (not 401) when unauthorized, so the endpoint's existence is not revealed. */
export async function handleInquiryHealthRequest(request: Request): Promise<Response> {
  const env = readServerEnv();
  const authorized = await isAuthorizedHealthRequest(
    request.headers.get("authorization"),
    env["OPS_HEALTH_TOKEN"],
  );
  if (!authorized) return new Response(null, { status: 404 });
  const { httpStatus, report } = await runInquiryHealthCheck(env);
  return new Response(JSON.stringify(report), {
    status: httpStatus,
    headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" },
  });
}
