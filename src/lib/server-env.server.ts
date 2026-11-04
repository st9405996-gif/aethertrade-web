import { env as cloudflareEnv } from "cloudflare:workers";

const SERVER_BINDING_KEYS = [
  "ABUSE_HASH_SECRET",
  "CONFIRMATION_SECRET",
  "INQUIRY_DELIVERY_ENABLED",
  "INQUIRY_FROM_EMAIL",
  "INQUIRY_NOTIFY_TO",
  "INQUIRY_SALES_NOTIFY_TO",
  "PUBLIC_SITE_HOSTNAME",
  "RESEND_API_KEY",
  "SUPABASE_PUBLISHABLE_KEY",
  "SUPABASE_SERVICE_ROLE_KEY",
  "SUPABASE_URL",
  "TURNSTILE_SECRET_KEY",
  "VITE_TURNSTILE_SITE_KEY",
] as const;

/**
 * Read Cloudflare bindings from the current request's runtime context.
 * Keep process.env as a fallback for local development and non-Worker tests;
 * never copy request-specific bindings into process.env.
 */
export function readServerEnv(): Record<string, string | undefined> {
  const runtime = cloudflareEnv as unknown as Record<string, unknown>;
  const local = typeof process !== "undefined" && process.env ? process.env : {};

  return Object.fromEntries(
    SERVER_BINDING_KEYS.map((key) => [
      key,
      typeof runtime[key] === "string" ? (runtime[key] as string) : local[key],
    ]),
  );
}
