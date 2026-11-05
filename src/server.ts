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


async function dynamicSeoDocument(pathname: string, config: Record<string, string | undefined>): Promise<Response | null> {
  if (pathname !== "/sitemap.xml" && pathname !== "/llms.txt") return null;
  const baseUrl = config["SUPABASE_URL"]?.replace(/\/+$/, "");
  const key = config["SUPABASE_PUBLISHABLE_KEY"];
  if (!baseUrl || !key) return null;
  try {
    const headers = { apikey: key, Authorization: "Bearer " + key, Accept: "application/json" };
    const recordsUrl = new URL(baseUrl + "/rest/v1/content_records");
    recordsUrl.searchParams.set("select", "module,slug,title,canonical");
    recordsUrl.searchParams.set("module", "in.(pages,insights)");
    recordsUrl.searchParams.set("noindex", "eq.false");
    recordsUrl.searchParams.set("or", `(publication.eq.Published,and(publication.eq.Scheduled,scheduled_at.lte.${new Date().toISOString()}))`);
    recordsUrl.searchParams.set("order", "module.asc,position.asc,title.asc");
    recordsUrl.searchParams.set("limit", "500");
    const settingsUrl = new URL(baseUrl + "/rest/v1/global_seo_settings");
    settingsUrl.searchParams.set("select", "settings");
    settingsUrl.searchParams.set("id", "eq.1");
    settingsUrl.searchParams.set("is_published", "eq.true");
    settingsUrl.searchParams.set("limit", "1");
    const [recordsResponse, settingsResponse] = await Promise.all([
      fetch(recordsUrl, { headers }), fetch(settingsUrl, { headers }),
    ]);
    if (!recordsResponse.ok) return null;
    const payload: unknown = await recordsResponse.json();
    if (!Array.isArray(payload)) return null;
    const records = payload.flatMap(value => {
      if (!value || typeof value !== "object") return [];
      const row = value as Record<string, unknown>;
      if (typeof row.slug !== "string" || typeof row.title !== "string" || !["pages", "insights"].includes(String(row.module))) return [];
      return [{ module: String(row.module), slug: row.slug, title: row.title, canonical: typeof row.canonical === "string" ? row.canonical : "" }];
    });
    let siteName = "AETHER-TRADE";
    let siteUrl = "https://aethertrade.cloud";
    let description = "AETHER-TRADE helps businesses organize global trade operations through document intelligence and workflow automation.";
    if (settingsResponse.ok) {
      const settingsPayload: unknown = await settingsResponse.json();
      const first = Array.isArray(settingsPayload) ? settingsPayload[0] : null;
      const saved = first && typeof first === "object" ? (first as Record<string, unknown>).settings : null;
      if (saved && typeof saved === "object") {
        const value = saved as Record<string, unknown>;
        if (typeof value.siteName === "string" && value.siteName.trim()) siteName = value.siteName.trim().slice(0, 120);
        if (typeof value.siteUrl === "string") {
          try { const candidate = new URL(value.siteUrl); if (candidate.protocol === "https:" && candidate.hostname === "aethertrade.cloud") siteUrl = candidate.origin; } catch { /* retain production origin */ }
        }
        if (typeof value.organizationDescription === "string" && value.organizationDescription.trim()) description = value.organizationDescription.trim().slice(0, 500);
      }
    }
    const body = pathname === "/sitemap.xml"
      ? buildRuntimeSitemap(records, siteUrl)
      : buildRuntimeLlms(records, siteName, description, siteUrl);
    return new Response(body, {
      status: 200,
      headers: {
        "content-type": pathname === "/sitemap.xml" ? "application/xml; charset=utf-8" : "text/plain; charset=utf-8",
        "cache-control": "public, max-age=0, s-maxage=60",
      },
    });
  } catch (error) {
    console.error("Dynamic SEO document generation failed", error);
    return null;
  }
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
