import { describe, expect, it } from "vitest";
import { buildRuntimeLlms, buildRuntimeSitemap, escapeSeoXml } from "@/lib/seo-runtime";

describe("runtime SEO documents", () => {
  const records = [
    { module: "pages", slug: "home", title: "Home" },
    { module: "insights", slug: "safe-article", title: "Trade & documents" },
    { module: "insights", slug: "draft", title: "Draft" },
  ];
  it("escapes XML special characters", () => expect(escapeSeoXml("<A & B>")).toBe("&lt;A &amp; B&gt;"));
  it("builds sitemap URLs for CMS pages and articles", () => {
    const xml = buildRuntimeSitemap(records, "https://aethertrade.cloud");
    expect(xml).toContain("https://aethertrade.cloud/");
    expect(xml).toContain("https://aethertrade.cloud/insights/safe-article");
    expect(xml).not.toContain("/insights/draft");
  });
  it("lists published content in llms.txt", () => {
    const text = buildRuntimeLlms(records, "AETHER-TRADE", "Trade operations", "https://aethertrade.cloud");
    expect(text).toContain("[Trade & documents](https://aethertrade.cloud/insights/safe-article)");
  });
});
