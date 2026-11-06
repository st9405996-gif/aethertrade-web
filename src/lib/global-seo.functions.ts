import { createServerFn } from "@tanstack/react-start";
import { readServerEnv } from "@/lib/server-env.server";

import { DEFAULT_GLOBAL_SEO, type GlobalSeoSettings } from "@/lib/global-seo.model";
export { DEFAULT_GLOBAL_SEO } from "@/lib/global-seo.model";
export type { GlobalSeoSettings } from "@/lib/global-seo.model";

function safeText(value: unknown, fallback: string, max: number): string {
  return typeof value === "string" ? value.trim().slice(0, max) : fallback;
}

function safeHttpsUrl(value: unknown, fallback = ""): string {
  const candidate = safeText(value, "", 1000);
  if (!candidate) return fallback;
  try {
    const url = new URL(candidate);
    return url.protocol === "https:" ? url.toString().slice(0, 1000) : fallback;
  } catch {
    return fallback;
  }
}

export function parseGlobalSeoSettings(value: unknown): GlobalSeoSettings {
  const source =
    value && typeof value === "object" && !Array.isArray(value)
      ? (value as Record<string, unknown>)
      : {};
  const sameAsValue = source["sameAs"];
  const sameAs = Array.isArray(sameAsValue)
    ? sameAsValue
        .slice(0, 10)
        .map((item) => safeHttpsUrl(item))
        .filter(Boolean)
    : [];
  return {
    siteName: safeText(source["siteName"], DEFAULT_GLOBAL_SEO.siteName, 120),
    siteUrl: safeHttpsUrl(source["siteUrl"], DEFAULT_GLOBAL_SEO.siteUrl),
    defaultTitle: safeText(source["defaultTitle"], DEFAULT_GLOBAL_SEO.defaultTitle, 160),
    defaultDescription: safeText(
      source["defaultDescription"],
      DEFAULT_GLOBAL_SEO.defaultDescription,
      320,
    ),
    defaultOgImage: safeHttpsUrl(source["defaultOgImage"]),
    googleVerification: safeText(source["googleVerification"], "", 200),
    bingVerification: safeText(source["bingVerification"], "", 200),
    organizationName: safeText(
      source["organizationName"],
      DEFAULT_GLOBAL_SEO.organizationName,
      120,
    ),
    organizationUrl: safeHttpsUrl(source["organizationUrl"], DEFAULT_GLOBAL_SEO.organizationUrl),
    organizationDescription: safeText(
      source["organizationDescription"],
      DEFAULT_GLOBAL_SEO.organizationDescription,
      500,
    ),
    organizationLogo: safeHttpsUrl(source["organizationLogo"]),
    sameAs,
  };
}

export async function readPublishedGlobalSeoSettings(
  baseUrl: string | undefined,
  publishableKey: string | undefined,
  fetchImpl: typeof fetch = fetch,
): Promise<GlobalSeoSettings> {
  try {
    const normalizedBaseUrl = baseUrl?.replace(/\/+$/, "");
    if (!normalizedBaseUrl || !publishableKey) return DEFAULT_GLOBAL_SEO;

    const url = new URL(normalizedBaseUrl + "/rest/v1/global_seo_settings");
    url.searchParams.set("select", "settings,is_published");
    url.searchParams.set("id", "eq.1");
    url.searchParams.set("is_published", "eq.true");
    url.searchParams.set("limit", "1");
    const response = await fetchImpl(url, {
      headers: {
        apikey: publishableKey,
        Authorization: "Bearer " + publishableKey,
        Accept: "application/json",
      },
    });
    if (!response.ok) return DEFAULT_GLOBAL_SEO;
    const rows: unknown = await response.json();
    if (!Array.isArray(rows) || !rows[0] || typeof rows[0] !== "object") return DEFAULT_GLOBAL_SEO;
    return parseGlobalSeoSettings((rows[0] as Record<string, unknown>)["settings"]);
  } catch {
    return DEFAULT_GLOBAL_SEO;
  }
}

export const getGlobalSeoSettings = createServerFn({ method: "GET" }).handler(async () => {
  const env = readServerEnv();
  return readPublishedGlobalSeoSettings(env["SUPABASE_URL"], env["SUPABASE_PUBLISHABLE_KEY"]);
});
