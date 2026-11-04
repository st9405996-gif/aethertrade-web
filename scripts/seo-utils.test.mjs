import { describe, expect, it } from "vitest";
import { buildSitemap, escapeXml, validateSeoConfig } from "./seo-utils.mjs";

describe("SEO generation helpers", () => {
  it("escapes XML metacharacters in URL content", () => {
    expect(escapeXml('a&b<"c">')).toBe("a&amp;b&lt;&quot;c&quot;&gt;");
  });

  it("rejects duplicate paths and indexable admin routes", () => {
    const errors = validateSeoConfig({
      site: { url: "https://aethertrade.cloud" },
      pages: [
        { path: "/insights", indexable: true },
        { path: "/insights", indexable: true },
        { path: "/admin", indexable: true },
      ],
    });
    expect(errors).toContain("Duplicate page path: /insights");
    expect(errors).toContain("Private path cannot be indexable: /admin");
  });

  it("builds a sitemap from indexable routes only", () => {
    const xml = buildSitemap({
      site: { url: "https://aethertrade.cloud/" },
      pages: [
        { path: "/", indexable: true },
        { path: "/admin", indexable: false },
      ],
    });
    expect(xml).toContain("<loc>https://aethertrade.cloud/</loc>");
    expect(xml).not.toContain("/admin");
  });
});
