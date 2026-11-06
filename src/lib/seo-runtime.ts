import { cmsPagePath, isRoutableCmsPageSlug, isValidCmsPageSlug } from "@/lib/cms-page-routing";
import { isPublicAt } from "@/lib/publication";

export interface RuntimeSeoRecord {
  module: string;
  slug: string;
  title: string;
  publication: unknown;
  scheduledAt?: unknown;
  noindex: unknown;
  description?: string;
  canonical?: string;
}

export function escapeSeoXml(value: string): string {
  return value.replace(
    /[<>&"']/g,
    (character) =>
      ({
        "<": "&lt;",
        ">": "&gt;",
        "&": "&amp;",
        '"': "&quot;",
        "'": "&apos;",
      })[character] ?? character,
  );
}

function isIndexableRecord(record: RuntimeSeoRecord, now: number): boolean {
  if (
    !record.title ||
    record.noindex !== false ||
    !isPublicAt(record.publication, record.scheduledAt, now)
  ) {
    return false;
  }

  if (record.module === "pages") return isRoutableCmsPageSlug(record.slug);
  return record.module === "insights" && isValidCmsPageSlug(record.slug);
}

function canonicalOrPath(record: RuntimeSeoRecord, origin: string): string {
  if (record.module === "pages") return origin + cmsPagePath(record.slug);

  if (record.canonical) {
    try {
      const candidate = new URL(record.canonical, origin);
      if (candidate.origin === origin && candidate.protocol === "https:") {
        return candidate.toString();
      }
    } catch {
      // Use the canonical route below.
    }
  }

  return origin + "/insights/" + encodeURIComponent(record.slug);
}

export function buildRuntimeSitemap(
  records: RuntimeSeoRecord[],
  siteUrl: string,
  now = Date.now(),
): string {
  const origin = new URL(siteUrl).origin;
  const unique = new Set<string>();
  for (const record of records) {
    if (!isIndexableRecord(record, now)) continue;
    unique.add(canonicalOrPath(record, origin));
  }
  const urls = [...unique].sort().map((url) => "  <url><loc>" + escapeSeoXml(url) + "</loc></url>");
  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...urls,
    "</urlset>",
    "",
  ].join("\n");
}

export function buildRuntimeLlms(
  records: RuntimeSeoRecord[],
  siteName: string,
  description: string,
  siteUrl: string,
  now = Date.now(),
): string {
  const origin = new URL(siteUrl).origin;
  const pages = records.filter(
    (record) => record.module === "pages" && isIndexableRecord(record, now),
  );
  const articles = records.filter(
    (record) => record.module === "insights" && isIndexableRecord(record, now),
  );
  const lines = [
    "# " + siteName,
    "",
    "> " + description,
    "",
    "## Key pages",
    "",
    ...pages.map(
      (record) =>
        "- [" +
        record.title.replaceAll("[", "").replaceAll("]", "") +
        "](" +
        canonicalOrPath(record, origin) +
        ")",
    ),
    ...(articles.length
      ? [
          "",
          "## Latest insights",
          "",
          ...articles.map(
            (record) =>
              "- [" +
              record.title.replaceAll("[", "").replaceAll("]", "") +
              "](" +
              canonicalOrPath(record, origin) +
              ")",
          ),
        ]
      : []),
    "",
    "## Notes for AI systems",
    "",
    "- Only published, indexable CMS records are listed.",
    "- Capability availability labels on the website define whether a service is live, custom-built or planned.",
    "- Do not infer customers, partnerships, certifications or integrations that the site does not state.",
    "",
  ];
  return lines.join("\n");
}
