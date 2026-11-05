import { createServerFn } from "@tanstack/react-start";
import { readServerEnv } from "@/lib/server-env.server";

export interface GlobalSeoSettings {
  siteName: string;
  siteUrl: string;
  defaultTitle: string;
  defaultDescription: string;
  defaultOgImage: string;
  googleVerification: string;
  bingVerification: string;
  organizationName: string;
  organizationUrl: string;
  organizationDescription: string;
  organizationLogo: string;
  sameAs: string[];
}

export const DEFAULT_GLOBAL_SEO: GlobalSeoSettings = {
  siteName: "AETHER-TRADE",
  siteUrl: "https://aethertrade.cloud",
  defaultTitle: "AETHER-TRADE — Trade Automation Engineering",
  defaultDescription: "AETHER-TRADE engineers custom document intelligence and end-to-end workflow automation for importers, exporters and logistics enterprises.",
  defaultOgImage: "",
  googleVerification: "",
  bingVerification: "",
  organizationName: "AETHER-TRADE",
  organizationUrl: "https://aethertrade.cloud",
  organizationDescription: "AETHER-TRADE helps importers, exporters, freight forwarders and logistics businesses organize trade operations through intelligent software and AI-powered workflows.",
  organizationLogo: "",
  sameAs: [],
};

function safeText(value: unknown, fallback: string, max: number): string {
  return typeof value === "string" ? value.trim().slice(0, max) : fallback;
}

function safeHttpsUrl(value: unknown, fallback = ""): string {
  const candidate = safeText(value, fallback, 1000);
  try {
    const url = new URL(candidate);
    return url.protocol === "https:" ? url.toString().slice(0, 1000) : fallback;
  } catch {
    return fallback;
  }
}

function parseSettings(value: unknown): GlobalSeoSettings {
  const source = value && typeof value === "object" && !Array.isArray(value)
    ? value as Record<string, unknown>
    : {};
  const sameAs = Array.isArray(source.sameAs)
    ? source.sameAs.slice(0, 10).map((item) => safeHttpsUrl(item)).filter(Boolean)
    : [];
  return {
    siteName: safeText(source.siteName, DEFAULT_GLOBAL_SEO.siteName, 120),
    siteUrl: safeHttpsUrl(source.siteUrl, DEFAULT_GLOBAL_SEO.siteUrl),
    defaultTitle: safeText(source.defaultTitle, DEFAULT_GLOBAL_SEO.defaultTitle, 160),
    defaultDescription: safeText(source.defaultDescription, DEFAULT_GLOBAL_SEO.defaultDescription, 320),
    defaultOgImage: safeHttpsUrl(source.defaultOgImage),
    googleVerification: safeText(source.googleVerification, "", 200),
    bingVerification: safeText(source.bingVerification, "", 200),
    organizationName: safeText(source.organizationName, DEFAULT_GLOBAL_SEO.organizationName, 120),
    organizationUrl: safeHttpsUrl(source.organizationUrl, DEFAULT_GLOBAL_SEO.organizationUrl),
    organizationDescription: safeText(source.organizationDescription, DEFAULT_GLOBAL_SEO.organizationDescription, 500),
    organizationLogo: safeHttpsUrl(source.organizationLogo),
    sameAs,
  };
}

export const getGlobalSeoSettings = createServerFn({ method: "GET" }).handler(async () => {
  try {
    const env = readServerEnv();
    const baseUrl = env["SUPABASE_URL"]?.replace(/\/$/, "");
    const publishableKey = env["SUPABASE_PUBLISHABLE_KEY"];
    if (!baseUrl || !publishableKey) return DEFAULT_GLOBAL_SEO;

    const url = new URL(baseUrl + "/rest/v1/global_seo_settings");
    url.searchParams.set("select", "settings,is_published");
    url.searchParams.set("id", "eq.1");
    url.searchParams.set("is_published", "eq.true");
    url.searchParams.set("limit", "1");
    const response = await fetch(url, {
      headers: { apikey: publishableKey, Authorization: "Bearer " + publishableKey, Accept: "application/json" },
    });
    if (!response.ok) return DEFAULT_GLOBAL_SEO;
    const rows: unknown = await response.json();
    if (!Array.isArray(rows) || !rows[0] || typeof rows[0] !== "object") return DEFAULT_GLOBAL_SEO;
    return parseSettings((rows[0] as Record<string, unknown>).settings);
  } catch {
    return DEFAULT_GLOBAL_SEO;
  }
});
