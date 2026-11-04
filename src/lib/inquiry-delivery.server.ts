// SERVER-ONLY. Imported dynamically from inside server function handlers so that
// credentials and provider code never reach the browser bundle.
//
// Live delivery stays OFF unless INQUIRY_DELIVERY_ENABLED=true AND every required
// value is present and valid. Any other state keeps the site in demo mode, where
// nothing is stored or sent. The code paths below are unit-tested with mocked
// fetch only; they must be verified against real Supabase and Resend accounts
// before INQUIRY_DELIVERY_ENABLED is ever set to "true" in production.

import { z } from "zod";

export const PROVIDER_TIMEOUT_MS = 8_000;

export interface DeliveryConfig {
  supabaseUrl: string;
  serviceRoleKey: string;
  resendApiKey: string;
  notifyTo: string;
  salesNotifyTo: string;
  fromEmail: string;
  confirmationSecret: string;
  turnstileSecret: string;
  publicSiteHostname: string;
  abuseHashSecret: string;
  quotaLimit: number;
  quotaWindowSeconds: number;
}

export type ConfigParseResult =
  | { valid: true; config: DeliveryConfig; missing: [] }
  | { valid: false; config: null; missing: string[] };

export type DeliveryConfigReadout =
  | { enabled: true; config: DeliveryConfig; missing: [] }
  | { enabled: false; config: null; missing: string[] };

export interface DeliveryInput {
  requestKey: string;
  kind: "contact" | "demo";
  name: string;
  email: string;
  company: string;
  country: string;
  category: string;
  automation: string;
  message: string;
  requirements: string;
}

export type DeliveryResult = {
  reference: string;
  persisted: true;
  duplicate: boolean;
  notified: boolean;
  confirmationSent: boolean;
};

export class InquiryDeliveryError extends Error {
  constructor(
    message: string,
    readonly step: "persist" | "lookup",
    readonly status: number | null,
  ) {
    super(message);
    this.name = "InquiryDeliveryError";
  }
}

const GENERIC_SAVE_FAILURE = "Your inquiry could not be saved right now. Please try again later.";

const httpsOrLocalUrl = z.url().refine(
  (value) => {
    try {
      const url = new URL(value);
      return (
        url.protocol === "https:" || url.hostname === "localhost" || url.hostname === "127.0.0.1"
      );
    } catch {
      return false;
    }
  },
  { message: "must be an https URL" },
);

// Accepts "address@domain" or "Display Name <address@domain>" (the form Resend accepts).
const senderSchema = z.string().refine(
  (value) => {
    const match = /<([^<>]+)>\s*$/.exec(value.trim());
    const address = match ? match[1] : value.trim();
    return z.email().safeParse(address).success;
  },
  { message: "must be an email address or 'Name <email>'" },
);

const configSchema = z.object({
  SUPABASE_URL: httpsOrLocalUrl,
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(20),
  RESEND_API_KEY: z.string().min(10),
  INQUIRY_NOTIFY_TO: z.email(),
  INQUIRY_SALES_NOTIFY_TO: z.email(),
  INQUIRY_FROM_EMAIL: senderSchema,
  CONFIRMATION_SECRET: z.string().min(32),
  TURNSTILE_SECRET_KEY: z.string().min(10),
  PUBLIC_SITE_HOSTNAME: z.string().regex(/^[a-z0-9.-]+$/i).max(253),
  ABUSE_HASH_SECRET: z.string().min(32),
});

export const QUOTA_LIMIT_PER_WINDOW = 5;
export const QUOTA_WINDOW_SECONDS = 10 * 60;

/**
 * Parses and validates every value required for live delivery. This is configuration
 * validation only. It does not prove that any provider accepts the credentials.
 * Returns the names of missing or invalid variables, never their values.
 */
export function parseDeliveryConfig(env: Record<string, string | undefined>): ConfigParseResult {
  const parsed = configSchema.safeParse({
    SUPABASE_URL: env["SUPABASE_URL"] ?? "",
    SUPABASE_SERVICE_ROLE_KEY: env["SUPABASE_SERVICE_ROLE_KEY"] ?? "",
    RESEND_API_KEY: env["RESEND_API_KEY"] ?? "",
    INQUIRY_NOTIFY_TO: env["INQUIRY_NOTIFY_TO"] ?? "",
    INQUIRY_SALES_NOTIFY_TO: env["INQUIRY_SALES_NOTIFY_TO"] ?? "",
    INQUIRY_FROM_EMAIL: env["INQUIRY_FROM_EMAIL"] ?? "",
    CONFIRMATION_SECRET: env["CONFIRMATION_SECRET"] ?? "",
    TURNSTILE_SECRET_KEY: env["TURNSTILE_SECRET_KEY"] ?? "",
    PUBLIC_SITE_HOSTNAME: env["PUBLIC_SITE_HOSTNAME"] ?? "",
    ABUSE_HASH_SECRET: env["ABUSE_HASH_SECRET"] ?? "",
  });
  if (!parsed.success) {
    const missing = [...new Set(parsed.error.issues.map((issue) => String(issue.path[0])))];
    return { valid: false, config: null, missing };
  }
  const d = parsed.data;
  return {
    valid: true,
    missing: [],
    config: {
      supabaseUrl: d.SUPABASE_URL.replace(/\/+$/, ""),
      serviceRoleKey: d.SUPABASE_SERVICE_ROLE_KEY,
      resendApiKey: d.RESEND_API_KEY,
      notifyTo: d.INQUIRY_NOTIFY_TO,
      salesNotifyTo: d.INQUIRY_SALES_NOTIFY_TO,
      fromEmail: d.INQUIRY_FROM_EMAIL,
      confirmationSecret: d.CONFIRMATION_SECRET,
      turnstileSecret: d.TURNSTILE_SECRET_KEY,
      publicSiteHostname: d.PUBLIC_SITE_HOSTNAME.toLowerCase(),
      abuseHashSecret: d.ABUSE_HASH_SECRET,
      quotaLimit: QUOTA_LIMIT_PER_WINDOW,
      quotaWindowSeconds: QUOTA_WINDOW_SECONDS,
    },
  };
}

/**
 * Live delivery is enabled only by an explicit flag AND a valid configuration.
 * A valid configuration is still not proof of delivery; see inquiry-health for provider checks.
 */
export function readDeliveryConfig(env: Record<string, string | undefined>): DeliveryConfigReadout {
  if (env["INQUIRY_DELIVERY_ENABLED"] !== "true") {
    return { enabled: false, config: null, missing: [] };
  }
  const parsed = parseDeliveryConfig(env);
  if (!parsed.valid) return { enabled: false, config: null, missing: parsed.missing };
  return { enabled: true, config: parsed.config, missing: [] };
}

function newReference(): string {
  return `AT-${crypto.randomUUID().replace(/-/g, "").slice(0, 8).toUpperCase()}`;
}

function restHeaders(config: DeliveryConfig): Record<string, string> {
  return {
    apikey: config.serviceRoleKey,
    Authorization: `Bearer ${config.serviceRoleKey}`,
    "Content-Type": "application/json",
  };
}

function teamNotificationText(input: DeliveryInput, reference: string): string {
  return [
    `New ${input.kind} inquiry: ${reference}`,
    "",
    `Name: ${input.name}`,
    `Business email: ${input.email}`,
    `Company: ${input.company}`,
    `Country: ${input.country}`,
    `Category: ${input.category || "-"}`,
    `Selected automation: ${input.automation || "-"}`,
    "",
    "Message:",
    input.message,
    "",
    "Requirements:",
    input.requirements || "-",
    "",
    "Privacy consent was given on the submitting form.",
  ].join("\n");
}

function confirmationText(reference: string): string {
  return [
    "Thank you for contacting AETHER-TRADE.",
    "",
    `We have received your inquiry. Your reference number is ${reference}. Please keep it for your records.`,
    "",
    "This message confirms receipt only. Please do not send confidential trade documents or sensitive shipment details.",
  ].join("\n");
}

async function sendEmail(
  fetchImpl: typeof fetch,
  config: DeliveryConfig,
  message: { to: string[]; subject: string; text: string; replyTo?: string },
): Promise<boolean> {
  try {
    const response = await fetchImpl("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${config.resendApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: config.fromEmail,
        to: message.to,
        subject: message.subject,
        text: message.text,
        ...(message.replyTo ? { reply_to: message.replyTo } : {}),
      }),
      signal: AbortSignal.timeout(PROVIDER_TIMEOUT_MS),
    });
    if (!response.ok) {
      console.error("inquiry-delivery: email provider rejected a message", {
        status: response.status,
      });
      return false;
    }
    return true;
  } catch {
    console.error("inquiry-delivery: email provider request failed");
    return false;
  }
}

/**
 * Persists one inquiry (idempotent on requestKey), then sends the team notification
 * and the submitter confirmation. Persistence failure throws; notification failures
 * are reported in the result because the inquiry is already stored.
 */
export async function deliverInquiry(
  input: DeliveryInput,
  config: DeliveryConfig,
  fetchImpl: typeof fetch = fetch,
): Promise<DeliveryResult> {
  const reference = newReference();
  const row = {
    request_key: input.requestKey,
    reference,
    kind: input.kind,
    contact_name: input.name,
    email: input.email,
    company: input.company,
    country: input.country,
    category: input.category,
    automation_slug: input.automation || null,
    message: input.message,
    requirements: input.requirements,
    consent: true,
  };

  const insert = await fetchImpl(`${config.supabaseUrl}/rest/v1/inquiries`, {
    method: "POST",
    headers: { ...restHeaders(config), Prefer: "return=minimal" },
    body: JSON.stringify(row),
    signal: AbortSignal.timeout(PROVIDER_TIMEOUT_MS),
  });

  if (insert.status === 409) {
    // Same requestKey already stored: a retry of an earlier successful submission.
    const lookup = await fetchImpl(
      `${config.supabaseUrl}/rest/v1/inquiries?request_key=eq.${encodeURIComponent(input.requestKey)}&select=reference`,
      { headers: restHeaders(config), signal: AbortSignal.timeout(PROVIDER_TIMEOUT_MS) },
    );
    if (!lookup.ok) {
      console.error("inquiry-delivery: duplicate lookup failed", { status: lookup.status });
      throw new InquiryDeliveryError(GENERIC_SAVE_FAILURE, "lookup", lookup.status);
    }
    const rows = (await lookup.json()) as { reference?: unknown }[];
    const existing = typeof rows[0]?.reference === "string" ? rows[0].reference : null;
    if (!existing) throw new InquiryDeliveryError(GENERIC_SAVE_FAILURE, "lookup", 409);
    return {
      reference: existing,
      persisted: true,
      duplicate: true,
      notified: false,
      confirmationSent: false,
    };
  }

  if (!insert.ok) {
    console.error("inquiry-delivery: persistence failed", { status: insert.status });
    throw new InquiryDeliveryError(GENERIC_SAVE_FAILURE, "persist", insert.status);
  }

  const notified = await sendEmail(fetchImpl, config, {
    to: [input.kind === "demo" || input.category === "Sales" ? config.salesNotifyTo : config.notifyTo],
    subject: `New ${input.kind} inquiry ${reference}`,
    text: teamNotificationText(input, reference),
    replyTo: input.email,
  });
  const confirmationSent = await sendEmail(fetchImpl, config, {
    to: [input.email],
    subject: "We received your AETHER-TRADE inquiry",
    text: confirmationText(reference),
  });

  return { reference, persisted: true, duplicate: false, notified, confirmationSent };
}
