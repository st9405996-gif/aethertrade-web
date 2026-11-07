import { publicMediaProxyUrl } from "@/lib/admin-proxy";
import type { MediaRecord } from "@/lib/workspace-model";

type JsonRecord = Record<string, unknown>;

function asRecord(value: unknown): JsonRecord {
  return value !== null && typeof value === "object" && !Array.isArray(value)
    ? (value as JsonRecord)
    : {};
}

function text(source: JsonRecord, key: string): string {
  return typeof source[key] === "string" ? source[key] : "";
}

function numeric(source: JsonRecord, key: string): number {
  return typeof source[key] === "number" ? source[key] : Number(source[key]) || 0;
}

export function mapAdminMediaRecord(value: unknown): MediaRecord {
  const source = asRecord(value);
  const bucketId = text(source, "bucket_id");
  const objectPath = text(source, "object_path");

  return {
    id: text(source, "id"),
    name: text(source, "filename"),
    type: text(source, "content_type"),
    size: numeric(source, "file_size"),
    alt: text(source, "alt_text"),
    bucketId,
    objectPath,
    url: source["is_public"] === true ? publicMediaProxyUrl(bucketId, objectPath) : "",
  };
}

/**
 * Maps a stored section image value, which may be a legacy direct Supabase URL,
 * to the catalogue entry it points at, so the picker shows the selected image.
 * Unknown values are returned unchanged.
 */
export function matchStoredMediaUrl(
  stored: string,
  media: ReadonlyArray<Pick<MediaRecord, "url" | "objectPath">>,
): string {
  if (!stored) return "";
  const path = stored.split(/[?#]/)[0] ?? "";
  const hit = media.find(
    (m) => m.url && m.objectPath && path.endsWith("/website-media/" + m.objectPath),
  );
  return hit ? hit.url : stored;
}
