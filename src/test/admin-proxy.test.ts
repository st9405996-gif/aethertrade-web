import { describe, expect, it } from "vitest";
import {
  adminProxyTarget,
  isSafeStorageObjectPath,
  isSafeWebsiteMediaDeletePayload,
  publicMediaProxyUrl,
  websiteMediaUploadProxyUrl,
} from "@/lib/admin-proxy";

describe("admin Supabase proxy allowlist", () => {
  it("allows Global SEO reads and updates through PostgREST", () => {
    expect(
      adminProxyTarget(
        "/api/admin-supabase/rest/v1/global_seo_settings",
        "?select=settings&id=eq.1",
        "GET",
      ),
    ).toBe("/rest/v1/global_seo_settings?select=settings&id=eq.1");

    expect(
      adminProxyTarget("/api/admin-supabase/rest/v1/global_seo_settings", "?id=eq.1", "PATCH"),
    ).toBe("/rest/v1/global_seo_settings?id=eq.1");
  });

  it("keeps existing admin tables available", () => {
    for (const table of [
      "audit_logs",
      "analytics_events",
      "content_records",
      "content_revisions",
      "inquiries",
      "inquiry_notes",
      "media_assets",
      "newsletter_subscribers",
      "user_roles",
    ]) {
      expect(adminProxyTarget(`/api/admin-supabase/rest/v1/${table}`, "?select=*", "GET")).toBe(
        `/rest/v1/${table}?select=*`,
      );
    }
  });

  it("rejects unknown tables and paths outside the admin proxy", () => {
    expect(adminProxyTarget("/api/admin-supabase/rest/v1/private_secrets", "", "GET")).toBeNull();
    expect(adminProxyTarget("/rest/v1/global_seo_settings", "", "GET")).toBeNull();
  });

  it("allows only safe media object paths and supported methods", () => {
    expect(isSafeStorageObjectPath("user-1/photo.png")).toBe(true);
    expect(isSafeStorageObjectPath("../secret")).toBe(false);
    expect(publicMediaProxyUrl("website-media", "user-1/photo.png")).toBe(
      "/api/admin-supabase/storage/v1/object/public/website-media/user-1/photo.png",
    );
    expect(publicMediaProxyUrl("other-bucket", "user-1/photo.png")).toBe("");
    expect(publicMediaProxyUrl("website-media", "../secret")).toBe("");
    expect(websiteMediaUploadProxyUrl("user-1/photo.png")).toBe(
      "/api/admin-supabase/storage/v1/object/website-media/user-1/photo.png",
    );
    expect(websiteMediaUploadProxyUrl("../secret")).toBe("");
    expect(isSafeWebsiteMediaDeletePayload({ prefixes: ["user-1/photo.png"] })).toBe(true);
    expect(isSafeWebsiteMediaDeletePayload({ prefixes: [""] })).toBe(false);
    expect(isSafeWebsiteMediaDeletePayload({ prefixes: ["user-1/", "user-2/"] })).toBe(false);
    expect(isSafeWebsiteMediaDeletePayload({ prefixes: ["../secret"] })).toBe(false);
    expect(isSafeWebsiteMediaDeletePayload({ prefixes: [] })).toBe(false);
    expect(isSafeWebsiteMediaDeletePayload({ prefixes: ["user-1/photo.png"], extra: true })).toBe(
      false,
    );
    expect(
      adminProxyTarget(
        "/api/admin-supabase/storage/v1/object/website-media/user-1/photo.png",
        "",
        "POST",
      ),
    ).toBe("/storage/v1/object/website-media/user-1/photo.png");
    expect(
      adminProxyTarget("/api/admin-supabase/storage/v1/object/website-media/../secret", "", "POST"),
    ).toBeNull();
    expect(
      adminProxyTarget(
        "/api/admin-supabase/storage/v1/object/website-media/user-1/photo.png",
        "",
        "GET",
      ),
    ).toBeNull();
    expect(
      adminProxyTarget(
        "/api/admin-supabase/storage/v1/object/public/website-media/user-1/photo.png",
        "",
        "GET",
      ),
    ).toBe("/storage/v1/object/public/website-media/user-1/photo.png");
  });
});
