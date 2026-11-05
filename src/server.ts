import "./lib/error-capture";
import { adminProxyTarget } from "./lib/admin-proxy";
import { readServerEnv } from "./lib/server-env.server";

import { consumeLastCapturedError } from "./lib/error-capture";
import { renderErrorPage } from "./lib/error-page";
import { withSecurityHeaders } from "./lib/security-headers";
import { buildRuntimeLlms, buildRuntimeSitemap } from "./lib/seo-runtime";

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

async function proxyAdminSupabase(request: Request): Promise<Response> {
  const requestUrl = new URL(request.url);
  if (request.method === "OPTIONS") return new Response("Method not allowed", { status: 405 });
  const origin = request.headers.get("origin");
  if (origin && origin !== requestUrl.origin) return new Response("Forbidden", { status: 403 });
  const config = readServerEnv();
  const base = config["SUPABASE_URL"]?.replace(/\/$/, "");
  const key = config["SUPABASE_PUBLISHABLE_KEY"];
  if (!base || !key) return new Response(JSON.stringify({message:"Supabase server connection settings are missing."}), {status:503,headers:{"content-type":"application/json; charset=utf-8","cache-control":"no-store"}});
  const target = adminProxyTarget(requestUrl.pathname, requestUrl.search, request.method);
  if (!target) return new Response("Not found", {status:404});
  const targetPath = target.split("?")[0];
  const storage = targetPath.startsWith("/storage/v1/object/");
  const publicStorageRead = targetPath.startsWith("/storage/v1/object/public/website-media/") && request.method === "GET";
  const publicAuth = targetPath.startsWith("/auth/v1/token") || targetPath === "/auth/v1/recover";
  const rest = targetPath.startsWith("/rest/v1/");
  const auth = ((targetPath.startsWith("/auth/v1/token") || targetPath === "/auth/v1/recover" || targetPath === "/auth/v1/logout") && request.method === "POST") || (targetPath === "/auth/v1/user" && ["GET","PUT"].includes(request.method));
  const storageMethod = storage && (publicStorageRead || ["POST","PUT","DELETE"].includes(request.method));
  if (!storageMethod && !(rest && ["GET","POST","PATCH","DELETE"].includes(request.method)) && !auth) return new Response("Method not allowed", {status:405});
  const authorization = request.headers.get("authorization");
  if (!publicStorageRead && !publicAuth && !authorization?.startsWith("Bearer ")) return new Response(JSON.stringify({message:"Authentication required."}), {status:401,headers:{"content-type":"application/json; charset=utf-8","cache-control":"no-store"}});
  const headers = new Headers({apikey:key});
  for (const name of ["accept","content-type","prefer","range","x-upsert","cache-control"]) { const value=request.headers.get(name); if(value) headers.set(name,value); }
  if (authorization) headers.set("authorization",authorization);
  const upstream = await fetch(new URL(target,base), {method:request.method,headers,body:["GET","HEAD"].includes(request.method)?undefined:await request.arrayBuffer(),redirect:"manual"});
  const outHeaders = new Headers();
  for (const name of ["content-type","content-range","accept-ranges","etag","last-modified"]) { const value=upstream.headers.get(name); if(value) outHeaders.set(name,value); }
  outHeaders.set("cache-control",publicStorageRead?"public, max-age=300":"no-store");
  return new Response(upstream.body,{status:upstream.status,statusText:upstream.statusText,headers:outHeaders});
}

export default {
  async fetch(request: Request, env: unknown, ctx: unknown) {
    const requestUrl = new URL(request.url);
    if (requestUrl.pathname.startsWith("/api/admin-supabase/")) return withSecurityHeaders(await proxyAdminSupabase(request));
    const seoDocument = await dynamicSeoDocument(requestUrl.pathname, readServerEnv());
    if (seoDocument) return withSecurityHeaders(seoDocument);
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
