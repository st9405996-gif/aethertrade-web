const SERVER_BINDING_KEYS = [
  "ABUSE_HASH_SECRET",
  "CONFIRMATION_SECRET",
  "INQUIRY_DELIVERY_ENABLED",
  "INQUIRY_FROM_EMAIL",
  "INQUIRY_NOTIFY_TO",
  "INQUIRY_SALES_NOTIFY_TO",
  "CLOUDFLARE_AI_MODEL",
  "CLOUDFLARE_ACCOUNT_ID",
  "CLOUDFLARE_API_TOKEN",
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
  const runtime = typeof process !== "undefined" && process.env
    ? process.env as Record<string, unknown>
    : {};
  const workerBindings = workerEnv && typeof workerEnv === "object"
    ? workerEnv as Record<string, unknown> & { AI?: WorkersAiBinding }
    : {};
  const bindings = Object.fromEntries(SERVER_BINDING_KEYS.map((key) => [
    key,
    typeof runtime[key] === "string" ? runtime[key] as string
      : typeof workerBindings[key] === "string" ? workerBindings[key] as string
      : undefined,
  ]));
  const processAi = runtime.AI && typeof runtime.AI === "object"
    ? runtime.AI as WorkersAiBinding
    : undefined;

  return {
    ...bindings,
    AI: workerBindings.AI ?? processAi,
    SUPABASE_URL: (typeof runtime.VITE_SUPABASE_URL === "string" ? runtime.VITE_SUPABASE_URL : undefined) ?? (typeof runtime.SUPABASE_URL === "string" ? runtime.SUPABASE_URL : undefined) ?? (typeof workerBindings.VITE_SUPABASE_URL === "string" ? workerBindings.VITE_SUPABASE_URL : undefined) ?? (typeof workerBindings.SUPABASE_URL === "string" ? workerBindings.SUPABASE_URL : undefined),
    SUPABASE_PUBLISHABLE_KEY:
      (typeof runtime.VITE_SUPABASE_PUBLISHABLE_KEY === "string" ? runtime.VITE_SUPABASE_PUBLISHABLE_KEY : undefined) ?? (typeof runtime.SUPABASE_PUBLISHABLE_KEY === "string" ? runtime.SUPABASE_PUBLISHABLE_KEY : undefined) ?? (typeof workerBindings.VITE_SUPABASE_PUBLISHABLE_KEY === "string" ? workerBindings.VITE_SUPABASE_PUBLISHABLE_KEY : undefined) ?? (typeof workerBindings.SUPABASE_PUBLISHABLE_KEY === "string" ? workerBindings.SUPABASE_PUBLISHABLE_KEY : undefined),
  };
}
