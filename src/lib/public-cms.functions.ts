import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { readServerEnv } from "@/lib/server-env.server";
import { isPublicAt } from "@/lib/publication";
import { isValidCmsPageSlug } from "@/lib/cms-page-routing";
import { publicMediaProxyUrl } from "@/lib/admin-proxy";

export interface CmsPageSection {
  id: string;
  title: string;
  body: string;
  imageUrl: string;
  imageAlt: string;
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
  return entries.slice(0, 30).flatMap((entry, index) => {
    const item = asRecord(entry);
    if (!item) return [];
    const title = asText(item["title"]).trim().slice(0, 160);
    const body = asText(item["body"]).trim().slice(0, 10000);
    const imageUrl = safeImageUrl(item["imageUrl"], baseUrl);
    const imageAlt = asText(item["imageAlt"]).trim().slice(0, 500) || title;
    if (!title && !body && !imageUrl) return [];
    return [
      {
        id: asText(item["id"]).slice(0, 80) || "section-" + index,
        title,
        body,
        imageUrl,
        imageAlt,
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

export function mergeCmsHead<T extends CmsHeadBase>(
  base: T,
  page?: PublishedCmsPage | null,
  options: { fallbackPath?: string } = {},
): T {
  if (!page) return base;
  const hasContent = page.body.trim().length > 0 || page.sections.length > 0;
  const hasSeo = Boolean(page.seoTitle || page.seoDescription || page.canonical);
  if (!hasContent && !hasSeo && !page.noindex) return base;

  const title = page.seoTitle || (hasContent ? page.title + " — AETHER-TRADE" : "");
  const description = page.seoDescription;
  const fallbackPath = options.fallbackPath ?? (page.slug === "home" ? "/" : "/" + page.slug);
  const canonical =
    page.canonical || (hasContent ? "https://aethertrade.cloud" + fallbackPath : "");

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
    if (canonical && item.property === "og:url") return false;
    if ((hasContent || hasSeo || page.noindex) && item.name === "robots") return false;
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
  if (page.noindex) meta.push({ name: "robots", content: "noindex, nofollow" });
  if (canonical) meta.push({ property: "og:url", content: canonical });

  const links = (base.links || []).filter((item) => item.rel !== "canonical");
  if (canonical) links.push({ rel: "canonical", href: canonical });
  return { ...base, meta, links } as T;
}
