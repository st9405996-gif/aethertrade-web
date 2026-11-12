import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { isPublicAt } from "@/lib/publication";
import { isValidCmsPageSlug } from "@/lib/cms-page-routing";
import { publicMediaProxyUrl } from "@/lib/admin-proxy";

export interface CmsPageSection {
  id: string;
  title: string;
  body: string;
  imageUrl: string;
  imageAlt: string;
  /** Optional lucide icon name (e.g. "ShieldCheck"), used by homepage/landing section groups. */
  icon: string;
  /** Optional group tag (e.g. "challenges", "approach") so one page can hold several distinct, CMS-editable section groups. */
  group: string;
  hidden?: boolean;
}
export interface PublishedCmsPage {
  slug: string;
  title: string;
  body: string;
  seoTitle: string;
  seoDescription: string;
  canonical: string;
  noindex: boolean;
  sections: CmsPageSection[];
  /** Editable hero block. Falls back to each page's built-in default copy when empty. */
  heroEyebrow: string;
  heroTitle: string;
  heroDescription: string;
  /** Editable closing CTA band. Falls back to each page's built-in default copy when empty. */
  ctaTitle: string;
  ctaDescription: string;
}
/** Returns the CMS value when editors have set one, otherwise the page's built-in default. */
export function cmsText(value: string | undefined, fallback: string): string {
  return value && value.trim() ? value : fallback;
}
/** Sections belonging to one named group (e.g. "challenges"), in their saved order. Empty when editors haven't added any for this group yet, so callers can fall back to a built-in default. */
export function cmsGroup(
  page: PublishedCmsPage | null | undefined,
  group: string,
): CmsPageSection[] {
  return (page?.sections ?? []).filter((section) => section.group === group);
}
/** Builds PageHero props, preferring the CMS "Pages & sections" record's hero fields over the page's built-in default copy. */
export function cmsHero(
  page: PublishedCmsPage | null | undefined,
  fallback: { eyebrow?: string; title: string; description?: string },
): { eyebrow: string; title: string; description: string } {
  return {
    eyebrow: cmsText(page?.heroEyebrow, fallback.eyebrow ?? ""),
    title: cmsText(page?.heroTitle, fallback.title),
    description: cmsText(page?.heroDescription, fallback.description ?? ""),
  };
}
/** Builds CtaBand props, preferring the CMS "Pages & sections" record's CTA fields over the page's built-in default copy. */
export function cmsCta(
  page: PublishedCmsPage | null | undefined,
  fallback: { title: string; description: string },
): { title: string; description: string } {
  return {
    title: cmsText(page?.ctaTitle, fallback.title),
    description: cmsText(page?.ctaDescription, fallback.description),
  };
}

type JsonRecord = Record<string, unknown>;
function asRecord(value: unknown): JsonRecord | null {
  return value !== null && typeof value === "object" && !Array.isArray(value)
    ? (value as JsonRecord)
    : null;
}
function asText(value: unknown): string {
  return typeof value === "string" ? value : "";
}
function safeImageUrl(value: unknown, baseUrl: string): string {
  const url = asText(value).trim();
  const proxyPrefix = "/api/admin-supabase/storage/v1/object/public/website-media/";
  if (url.startsWith(proxyPrefix))
    return publicMediaProxyUrl("website-media", url.slice(proxyPrefix.length));

  try {
    const candidate = new URL(url);
    const supabase = new URL(baseUrl);
    const storagePrefix = "/storage/v1/object/public/website-media/";
    if (
      candidate.origin !== supabase.origin ||
      candidate.search ||
      candidate.hash ||
      !candidate.pathname.startsWith(storagePrefix)
    )
      return "";
    return publicMediaProxyUrl("website-media", candidate.pathname.slice(storagePrefix.length));
  } catch {
    return "";
  }
}
function parseSections(value: unknown, baseUrl: string): CmsPageSection[] {
  let entries: unknown = value;
  if (typeof entries === "string") {
    try {
      entries = JSON.parse(entries);
    } catch {
      return [];
    }
  }
  if (!Array.isArray(entries)) return [];
  return entries.slice(0, 60).flatMap((entry, index) => {
    const item = asRecord(entry);
    if (!item) return [];
    const title = asText(item["title"]).trim().slice(0, 160);
    const body = asText(item["body"]).trim().slice(0, 10000);
    const imageUrl = safeImageUrl(item["imageUrl"], baseUrl);
    const imageAlt = asText(item["imageAlt"]).trim().slice(0, 500) || title;
    const icon = asText(item["icon"]).trim().slice(0, 60);
    const group = asText(item["group"]).trim().slice(0, 60);
    const hidden = item["hidden"] === true;
    if (!title && !body && !imageUrl) return [];
    return [
      {
        id: asText(item["id"]).slice(0, 80) || "section-" + index,
        title,
        body,
        imageUrl,
        imageAlt,
        icon,
        group,
        hidden,
      },
    ];
  });
}
function parsePage(value: unknown, baseUrl: string, now = Date.now()): PublishedCmsPage | null {
  const row = asRecord(value);
  if (!row || !isPublicAt(row["publication"], row["scheduled_at"], now)) return null;
  const slug = asText(row["slug"]);
  const title = asText(row["title"]).trim();
  if (!slug || !title) return null;
  const fields = asRecord(row["fields"]);
  return {
    slug,
    title,
    body: asText(row["body"]).trim().slice(0, 30000),
    seoTitle: asText(row["seo_title"]).trim().slice(0, 160),
    seoDescription: asText(row["seo_description"]).trim().slice(0, 320),
    canonical: asText(row["canonical"]).trim().slice(0, 500),
    noindex: row["noindex"] === true,
    sections: parseSections(fields?.["sections"], baseUrl),
    heroEyebrow: asText(fields?.["heroEyebrow"]).trim().slice(0, 80),
    heroTitle: asText(fields?.["heroTitle"]).trim().slice(0, 160),
    heroDescription: asText(fields?.["heroDescription"]).trim().slice(0, 500),
    ctaTitle: asText(fields?.["ctaTitle"]).trim().slice(0, 160),
    ctaDescription: asText(fields?.["ctaDescription"]).trim().slice(0, 500),
  };
}

const slugInput = z.object({
  slug: z
    .string()
    .min(1)
    .max(160)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
});
export async function fetchPublishedCmsPage(
  baseUrl: string | undefined,
  publishableKey: string | undefined,
  slug: string,
  fetchImpl: typeof fetch = fetch,
  now = Date.now(),
): Promise<PublishedCmsPage | null> {
  if (!isValidCmsPageSlug(slug)) throw new Error("Invalid CMS page slug.");
  const normalizedBaseUrl = baseUrl?.replace(/\/+$/, "");
  if (!normalizedBaseUrl || !publishableKey) {
    throw new Error("Public CMS connection is not configured.");
  }

  const url = new URL(normalizedBaseUrl + "/rest/v1/content_records");
  url.searchParams.set(
    "select",
    "slug,title,body,publication,scheduled_at,seo_title,seo_description,canonical,noindex,fields",
  );
  url.searchParams.set("module", "eq.pages");
  url.searchParams.set(
    "or",
    `(publication.eq.Published,and(publication.eq.Scheduled,scheduled_at.lte.${new Date(now).toISOString()}))`,
  );
  url.searchParams.set("slug", "eq." + slug);
  url.searchParams.set("limit", "1");

  const response = await fetchImpl(url, {
    cache: "no-store",
    method: "GET",
    headers: {
      apikey: publishableKey,
      Authorization: "Bearer " + publishableKey,
      Accept: "application/json",
    },
  });
  if (!response.ok) {
    throw new Error("Published CMS page request failed with status " + response.status + ".");
  }

  const payload: unknown = await response.json();
  if (!Array.isArray(payload)) throw new Error("Published CMS page response was not a list.");
  const page = parsePage(payload[0], normalizedBaseUrl, now);
  return page?.slug === slug ? page : null;
}

export const getPublishedCmsPage = createServerFn({ method: "GET" })
  .inputValidator((input: unknown) => {
    const parsed = slugInput.safeParse(input);
    if (!parsed.success) throw new Error("Invalid CMS page slug.");
    return parsed.data;
  })
  .handler(async ({ data }) => {
    const { readServerEnv } = await import("@/lib/server-env.server");
    const env = readServerEnv();
    return fetchPublishedCmsPage(env["SUPABASE_URL"], env["SUPABASE_PUBLISHABLE_KEY"], data.slug);
  });

type CmsMeta = {
  title?: string;
  name?: string;
  property?: string;
  content?: string;
  [key: string]: unknown;
};
type CmsLink = { rel?: string; href?: string; [key: string]: unknown };
type CmsHeadBase = { meta?: CmsMeta[]; links?: CmsLink[]; [key: string]: unknown };

const CANONICAL_SITE_ORIGIN = "https://aethertrade.cloud";

/**
 * Emits a self-referencing canonical for the route being rendered. CMS overrides
 * are accepted only when they resolve to the same route on an approved site host.
 */
export function mergeCmsHead<T extends CmsHeadBase>(
  base: T,
  page?: PublishedCmsPage | null,
  options: { fallbackPath?: string; title?: string; description?: string } = {},
): T {
  const fallbackPath =
    options.fallbackPath ?? (page ? (page.slug === "home" ? "/" : "/" + page.slug) : undefined);
  if (!fallbackPath) return base;

  const safePath =
    fallbackPath.startsWith("/") &&
    !fallbackPath.startsWith("//") &&
    !fallbackPath.includes("?") &&
    !fallbackPath.includes("#")
      ? fallbackPath
      : "/";
  let canonicalPath = safePath;

  if (page?.canonical) {
    try {
      const candidate = new URL(page.canonical);
      const allowedOrigins = new Set([
        CANONICAL_SITE_ORIGIN,
        "https://www.aethertrade.cloud",
      ]);
      if (
        allowedOrigins.has(candidate.origin) &&
        candidate.pathname === safePath &&
        !candidate.search &&
        !candidate.hash
      ) {
        canonicalPath = candidate.pathname;
      }
    } catch {
      // Invalid CMS canonical values fall back to the current route.
    }
  }

  const canonical = CANONICAL_SITE_ORIGIN + canonicalPath;
  const hasContent = Boolean(page && (page.body.trim().length > 0 || page.sections.length > 0));
  const hasSeo = Boolean(options.title || options.description || (page && (page.seoTitle || page.seoDescription || page.canonical)));
  const title = options.title ?? (page
    ? page.seoTitle || (hasContent ? page.title + " — AETHER-TRADE" : "")
    : "");
  const description = options.description ?? page?.seoDescription ?? "";

  const meta = (base.meta || []).filter((item) => {
    if (title && (item.title || item.property === "og:title" || item.name === "twitter:title"))
      return false;
    if (
      description &&
      (item.name === "description" ||
        item.property === "og:description" ||
        item.name === "twitter:description")
    )
      return false;
    if (item.property === "og:url") return false;
    if ((hasContent || hasSeo || page?.noindex) && item.name === "robots") return false;
    return true;
  });
  if (title)
    meta.push(
      { title },
      { property: "og:title", content: title },
      { name: "twitter:title", content: title },
    );
  if (description)
    meta.push(
      { name: "description", content: description },
      { property: "og:description", content: description },
      { name: "twitter:description", content: description },
    );
  if (page?.noindex) meta.push({ name: "robots", content: "noindex, nofollow" });
  meta.push({ property: "og:url", content: canonical });

  const links = (base.links || []).filter((item) => item.rel !== "canonical");
  links.push({ rel: "canonical", href: canonical });
  return { ...base, meta, links } as T;
}
