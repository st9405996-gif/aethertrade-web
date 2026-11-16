const SERVER_BINDING_KEYS = [
  "ABUSE_HASH_SECRET",
  "CONFIRMATION_SECRET",
  "INQUIRY_DELIVERY_ENABLED",
  "INQUIRY_FROM_EMAIL",
  "INQUIRY_NOTIFY_TO",
  "INQUIRY_SALES_NOTIFY_TO",
  "GROQ_API_KEY",
  "GROQ_MODEL",
  "OPENROUTER_API_KEY",
  "OPENROUTER_MODEL",
  "CLOUDFLARE_AI_MODEL",
  "OPS_HEALTH_TOKEN",
  "PUBLIC_SITE_HOSTNAME",
  "RESEND_API_KEY",
  "SUPABASE_PUBLISHABLE_KEY",
  "VITE_SUPABASE_PUBLISHABLE_KEY",
  "SUPABASE_SERVICE_ROLE_KEY",
  "SUPABASE_URL",
  "VITE_SUPABASE_URL",
  "TURNSTILE_SECRET_KEY",
  "VITE_TURNSTILE_SITE_KEY",
] as const;

export type WorkersAiBinding = {
  run: (model: string, inputs: Record<string, unknown>) => Promise<unknown>;
};

/**
 * Read only the server bindings this application needs.
 * Cloudflare's AI binding is passed directly from the Worker environment;
 * string secrets continue to come from process.env.
 */
export function readServerEnv(workerEnv?: unknown): Record<string, string | undefined> & { AI?: WorkersAiBinding } {
  const runtime = typeof process !== "undefined" && process.env ? process.env : {};
  const bindings = Object.fromEntries(SERVER_BINDING_KEYS.map((key) => [key, runtime[key]]));
  const workerBindings = workerEnv && typeof workerEnv === "object"
    ? workerEnv as { AI?: WorkersAiBinding }
    : {};

  return {
    ...bindings,
    AI: workerBindings.AI,
    SUPABASE_URL: runtime.VITE_SUPABASE_URL ?? runtime.SUPABASE_URL,
    SUPABASE_PUBLISHABLE_KEY:
      runtime.VITE_SUPABASE_PUBLISHABLE_KEY ?? runtime.SUPABASE_PUBLISHABLE_KEY,
  };
}
