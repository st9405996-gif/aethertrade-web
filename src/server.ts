import "./lib/error-capture";
import { readServerEnv } from "./lib/server-env.server";

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

const ADMIN_PROXY_PREFIX = "/api/admin-supabase";
const ADMIN_TABLES = new Set(["audit_logs","content_records","content_revisions","inquiries","inquiry_notes","media_assets","user_roles"]);
function adminProxyTarget(pathname: string, search: string): string | null {
  const path = pathname.slice(ADMIN_PROXY_PREFIX.length);
  const grantType = new URLSearchParams(search).get("grant_type");
  if ((path === "/auth/v1/token" && ["password","refresh_token"].includes(grantType ?? "")) || path === "/auth/v1/recover" || path === "/auth/v1/user" || path === "/auth/v1/logout") return path + search;
  const table = path.match(/^\/rest\/v1\/([a-z_]+)$/);
  if (table && ADMIN_TABLES.has(table[1])) return path + search;
  if (path.startsWith("/storage/v1/object/public/") && path.length > 27) return path + search;
  return null;
}
async function proxyAdminSupabase(request: Request): Promise<Response> {
  const requestUrl = new URL(request.url);
  if (request.method === "OPTIONS") return new Response("Method not allowed", { status: 405 });
  const origin = request.headers.get("origin");
  if (origin && origin !== requestUrl.origin) return new Response("Forbidden", { status: 403 });
  const config = readServerEnv();
  const base = config["SUPABASE_URL"]?.replace(/\/$/, "");
  const key = config["SUPABASE_PUBLISHABLE_KEY"];
  if (!base || !key) return new Response(JSON.stringify({message:"Supabase server connection settings are missing."}), {status:503,headers:{"content-type":"application/json; charset=utf-8","cache-control":"no-store"}});
  const target = adminProxyTarget(requestUrl.pathname, requestUrl.search);
  if (!target) return new Response("Not found", {status:404});
  const storage = target.startsWith("/storage/v1/object/public/");
  const publicAuth = target.startsWith("/auth/v1/token") || target.startsWith("/auth/v1/recover");
  const rest = target.startsWith("/rest/v1/");
  const auth = ((target.startsWith("/auth/v1/token") || target === "/auth/v1/recover" || target === "/auth/v1/logout") && request.method === "POST") || (target === "/auth/v1/user" && ["GET","PUT"].includes(request.method));
  if (!(storage && request.method === "GET") && !(rest && ["GET","POST","PATCH","DELETE"].includes(request.method)) && !auth) return new Response("Method not allowed", {status:405});
  const authorization = request.headers.get("authorization");
  if (!storage && !publicAuth && !authorization?.startsWith("Bearer ")) return new Response(JSON.stringify({message:"Authentication required."}), {status:401,headers:{"content-type":"application/json; charset=utf-8","cache-control":"no-store"}});
  const headers = new Headers({apikey:key});
  for (const name of ["accept","content-type","prefer","range"]) { const value=request.headers.get(name); if(value) headers.set(name,value); }
  if (authorization) headers.set("authorization",authorization);
  const upstream = await fetch(new URL(target,base), {method:request.method,headers,body:["GET","HEAD"].includes(request.method)?undefined:await request.arrayBuffer(),redirect:"manual"});
  const outHeaders = new Headers();
  for (const name of ["content-type","content-range","accept-ranges","etag","last-modified"]) { const value=upstream.headers.get(name); if(value) outHeaders.set(name,value); }
  outHeaders.set("cache-control",storage?"public, max-age=300":"no-store");
  return new Response(upstream.body,{status:upstream.status,statusText:upstream.statusText,headers:outHeaders});
}

export default {
  async fetch(request: Request, env: unknown, ctx: unknown) {
    const requestUrl = new URL(request.url);
    if (requestUrl.pathname.startsWith("/api/admin-supabase/")) return withSecurityHeaders(await proxyAdminSupabase(request));
    if (requestUrl.pathname === "/api/admin-config") {
      if (request.method !== "GET") {
        return withSecurityHeaders(new Response("Method not allowed", { status: 405, headers: { "allow": "GET" } }));
      }
      const config = readServerEnv();
      const rawUrl = config["SUPABASE_URL"];
      const url = rawUrl?.endsWith("/") ? rawUrl.slice(0, -1) : rawUrl;
      const key = config["SUPABASE_PUBLISHABLE_KEY"];
      if (!url || !key) {
        return withSecurityHeaders(new Response(JSON.stringify({ message: "Supabase public connection settings are missing from the Cloudflare Worker." }), {
          status: 503,
          headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" },
        }));
      }
      return withSecurityHeaders(new Response(JSON.stringify({ url, configured: true }), {
        status: 200,
        headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store, max-age=0" },
      }));
    }
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
