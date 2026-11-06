import { describe, expect, it } from "vitest";
import {
  cmsPagePath,
  isReservedCmsPageSlug,
  isRoutableCmsPageSlug,
  isValidCmsPageSlug,
} from "@/lib/cms-page-routing";

describe("public CMS page routes", () => {
  it("accepts lowercase slugs with hyphen separators", () => {
    expect(isValidCmsPageSlug("custom-page-2026")).toBe(true);
    expect(isRoutableCmsPageSlug("custom-page-2026")).toBe(true);
    expect(cmsPagePath("custom-page-2026")).toBe("/pages/custom-page-2026");
  });

  it.each(["", "Uppercase", "two words", "a/b", "-leading", "trailing-", "x".repeat(161)])(
    "rejects invalid slug %s",
    (slug) => {
      expect(isValidCmsPageSlug(slug)).toBe(false);
      expect(isRoutableCmsPageSlug(slug)).toBe(false);
    },
  );

  it.each(["about", "home", "careers", "admin", "api", "auth", "pages", "reset-password"])(
    "reserves route slug %s",
    (slug) => {
      expect(isReservedCmsPageSlug(slug)).toBe(true);
      expect(isRoutableCmsPageSlug(slug)).toBe(false);
    },
  );
});
