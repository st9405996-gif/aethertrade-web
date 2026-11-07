import { describe, expect, it } from "vitest";
import { mapAdminMediaRecord, matchStoredMediaUrl } from "@/lib/admin-media";

describe("admin media record mapping", () => {
  it("lists public media with a same-origin URL and saved alt text", () => {
    expect(
      mapAdminMediaRecord({
        id: "media-id",
        filename: "photo.png",
        content_type: "image/png",
        file_size: 128,
        alt_text: "Shipment document",
        bucket_id: "website-media",
        object_path: "user-1/photo.png",
        is_public: true,
      }),
    ).toEqual({
      id: "media-id",
      name: "photo.png",
      type: "image/png",
      size: 128,
      alt: "Shipment document",
      bucketId: "website-media",
      objectPath: "user-1/photo.png",
      url: "/api/admin-supabase/storage/v1/object/public/website-media/user-1/photo.png",
    });
  });

  it("does not expose private, unsupported-bucket, or unsafe-path media URLs", () => {
    const base = {
      id: "media-id",
      bucket_id: "website-media",
      object_path: "user-1/photo.png",
    };

    expect(mapAdminMediaRecord({ ...base, is_public: false }).url).toBe("");
    expect(mapAdminMediaRecord({ ...base, bucket_id: "other-bucket", is_public: true }).url).toBe(
      "",
    );
    expect(
      mapAdminMediaRecord({ ...base, object_path: "../private/photo.png", is_public: true }).url,
    ).toBe("");
  });
});

describe("stored section image matching", () => {
  const OBJECT = "user-1/0b1c-photo.png";
  const proxy = "/api/admin-supabase/storage/v1/object/public/website-media/" + OBJECT;

  it("maps a legacy direct Supabase URL to the matching catalogue entry", () => {
    const legacy = `https://project.supabase.co/storage/v1/object/public/website-media/${OBJECT}?t=1`;
    expect(matchStoredMediaUrl(legacy, [{ url: proxy, objectPath: OBJECT }])).toBe(proxy);
  });

  it("does not match a different object that merely shares a suffix", () => {
    const other = `https://project.supabase.co/storage/v1/object/public/website-media/x-${OBJECT}`;
    expect(matchStoredMediaUrl(other, [{ url: proxy, objectPath: OBJECT }])).toBe(other);
  });

  it("returns empty and unknown values unchanged", () => {
    expect(matchStoredMediaUrl("", [])).toBe("");
    expect(matchStoredMediaUrl("https://other.example/x.png", [])).toBe(
      "https://other.example/x.png",
    );
  });
});
