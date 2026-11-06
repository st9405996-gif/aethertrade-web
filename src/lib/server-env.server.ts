const SERVER_BINDING_KEYS = [
  "ABUSE_HASH_SECRET",
  "CONFIRMATION_SECRET",
  "INQUIRY_DELIVERY_ENABLED",
  "INQUIRY_FROM_EMAIL",
  "INQUIRY_NOTIFY_TO",
  "INQUIRY_SALES_NOTIFY_TO",
  "OPS_HEALTH_TOKEN",
  "PUBLIC_SITE_HOSTNAME",
  "RESEND_API_KEY",
  "SUPABASE_PUBLISHABLE_KEY",
  "SUPABASE_SERVICE_ROLE_KEY",
  "SUPABASE_URL",
  "TURNSTILE_SECRET_KEY",
  "VITE_TURNSTILE_SITE_KEY",
] as const;

/**
 * Read only the server bindings this application needs.
 *
 * Cloudflare Workers populates process.env from Worker bindings when
 * nodejs_compat_populate_process_env is enabled. This avoids importing
 * cloudflare:workers into the Nitro-generated bundle and avoids mutating
 * process.env ourselves between requests.
 */
export function readServerEnv(): Record<string, string | undefined> {
  const runtime = typeof process !== "undefined" && process.env ? process.env : {};

  return Object.fromEntries(SERVER_BINDING_KEYS.map((key) => [key, runtime[key]]));
}
