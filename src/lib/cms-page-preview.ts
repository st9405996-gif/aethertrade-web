import type { PublishedCmsPage, CmsPageSection } from "@/lib/public-cms.functions";
import type { ContentRecord, MediaRecord } from "@/lib/workspace-model";

type JsonRecord = Record<string, unknown>;

function isRecord(value: unknown): value is JsonRecord {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function text(value: unknown, maxLength: number): string {
  return typeof value === "string" ? value.trim().slice(0, maxLength) : "";
}

function parseSections(value: unknown, media: readonly MediaRecord[]): CmsPageSection[] {
  let entries: unknown = value;
  if (typeof entries === "string") {
    try {
      entries = JSON.parse(entries);
    } catch {
      return [];
    }
  }
  if (!Array.isArray(entries)) return [];

  const knownMediaUrls = new Set(media.map((item) => item.url).filter(Boolean));
  return entries.slice(0, 30).flatMap((entry, index) => {
    if (!isRecord(entry)) return [];

    const title = text(entry["title"], 160);
    const body = text(entry["body"], 10000);
    const candidateUrl = text(entry["imageUrl"], 500);
    const imageUrl = knownMediaUrls.has(candidateUrl) ? candidateUrl : "";
    const imageAlt = text(entry["imageAlt"], 500) || title;
    if (!title && !body && !imageUrl) return [];

    return [
      {
        id: text(entry["id"], 80) || `section-${index}`,
        title,
        body,
        imageUrl,
        imageAlt,
      },
    ];
  });
}

export function createCmsPagePreview(
  record: ContentRecord,
  media: readonly MediaRecord[],
): PublishedCmsPage | null {
  if (record.module !== "pages") return null;

  return {
    slug: text(record.slug, 160),
    title: text(record.title, 160),
    body: text(record.body, 30000),
    seoTitle: text(record.seoTitle, 160),
    seoDescription: text(record.seoDescription, 320),
    canonical: text(record.canonical, 500),
    noindex: record.noindex,
    sections: parseSections(record.fields["sections"], media),
  };
}
