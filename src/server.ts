import "./lib/error-capture";

import { consumeLastCapturedError } from "./lib/error-capture";
import { renderErrorPage } from "./lib/error-page";
import { withSecurityHeaders } from "./lib/security-headers";

type ServerEntry = {
  fetch: (request: Request, env: unknown, ctx: unknown) => Promise<Response> | Response;
};

let serverEntryPromise: Promise<ServerEntry> | undefined;

async function getServerEntry(): Promise<ServerEntry> {
  if (!serverEntryPromise) {
    serverEntryPromise = import("@tanstack/react-start/server-entry").then(
      (m) => (m.default ?? m) as ServerEntry,
    );
  }
  return serverEntryPromise;
}

// h3 swallows in-handler throws into a normal 500 Response with body
// {"unhandled":true,"message":"HTTPError"} — try/catch alone never fires for those.
async function normalizeCatastrophicSsrResponse(response: Response): Promise<Response> {
  if (response.status < 500) return response;
  const contentType = response.headers.get("content-type") ?? "";
  if (!contentType.includes("application/json")) return response;

  const body = await response.clone().text();
  if (!isH3SwallowedErrorBody(body)) return response;

  console.error(consumeLastCapturedError() ?? new Error(`h3 swallowed SSR error: ${body}`));
  return new Response(renderErrorPage(), {
    status: 500,
    headers: { "content-type": "text/html; charset=utf-8" },
  });
}

function isH3SwallowedErrorBody(body: string): boolean {
  try {
    const payload = JSON.parse(body) as { unhandled?: unknown; message?: unknown };
    return payload.unhandled === true && payload.message === "HTTPError";
  } catch {
    return false;
  }
}

const RUNTIME_BINDING_KEYS = [
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
 * Cloudflare passes Worker bindings as the second fetch argument. They are not
 * automatically copied into process.env by nodejs_compat, while server functions
 * read their configuration through process.env. Copy only known string bindings
 * at the request boundary; never log or serialize these values.
 */
function hydrateRuntimeBindings(env: unknown): void {
  if (typeof process === "undefined" || !process.env || !env || typeof env !== "object") return;
  const bindings = env as Record<string, unknown>;
  for (const key of RUNTIME_BINDING_KEYS) {
    const value = bindings[key];
    if (typeof value === "string") process.env[key] = value;
    else delete process.env[key];
  }
}

export default {
  async fetch(request: Request, env: unknown, ctx: unknown) {
    hydrateRuntimeBindings(env);
    try {
      const handler = await getServerEntry();
      const response = await handler.fetch(request, env, ctx);
      return withSecurityHeaders(await normalizeCatastrophicSsrResponse(response));
    } catch (error) {
      console.error(error);
      return withSecurityHeaders(
        new Response(renderErrorPage(), {
          status: 500,
          headers: { "content-type": "text/html; charset=utf-8" },
        }),
      );
    }
  },
};
