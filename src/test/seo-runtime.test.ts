import { describe, expect, it } from "vitest";
import {
  buildRuntimeLlms,
  buildRuntimeSitemap,
  escapeSeoXml,
  type RuntimeSeoRecord,
} from "@/lib/seo-runtime";

const now = Date.parse("2026-11-06T12:00:00.000Z");
const siteUrl = "https://aethertrade.cloud";
const records: RuntimeSeoRecord[] = [
  {
    module: "pages",
    slug: "custom-page",
    title: "Custom Page",
    publication: "Published",
    noindex: false,
    canonical: "https://aethertrade.cloud/custom-page",
  },
  {
    module: "pages",
    slug: "draft-page",
    title: "Draft Page",
    publication: "Draft",
    noindex: false,
  },
  {
    module: "pages",
    slug: "hidden-page",
    title: "Hidden Page",
    publication: "Published",
    noindex: true,
  },
  {
    module: "pages",
    slug: "about",
    title: "Duplicate About",
    publication: "Published",
    noindex: false,
  },
  {
    module: "pages",
    slug: "invalid slug",
    title: "Invalid Slug",
    publication: "Published",
    noindex: false,
  },
  {
    module: "pages",
    slug: "future-page",
    title: "Future Page",
    publication: "Scheduled",
    scheduledAt: "2026-11-06T12:01:00.000Z",
    noindex: false,
  },
  {
    module: "pages",
    slug: "ready-page",
    title: "Ready Page",
    publication: "Scheduled",
    scheduledAt: "2026-11-06T11:59:00.000Z",
    noindex: false,
  },
  {
    module: "insights",
    slug: "safe-article",
    title: "Trade & documents",
    publication: "Published",
    noindex: false,
  },
];

describe("runtime SEO documents", () => {
  it("escapes XML special characters", () => {
    expect(escapeSeoXml("<A & B>")).toBe("&lt;A &amp; B&gt;");
  });

  it("lists only published, indexable, routable pages under /pages/:slug", () => {
    const xml = buildRuntimeSitemap(records, siteUrl, now);

    expect(xml).toContain("https://aethertrade.cloud/pages/custom-page");
    expect(xml).toContain("https://aethertrade.cloud/pages/ready-page");
    expect(xml).toContain("https://aethertrade.cloud/insights/safe-article");
    expect(xml).toContain("https://aethertrade.cloud/platform");
    expect(xml).toContain("https://aethertrade.cloud/how-it-works");
    expect(xml).not.toContain("https://aethertrade.cloud/custom-page");
    expect(xml).not.toContain("/pages/draft-page");
    expect(xml).not.toContain("/pages/hidden-page");
    expect(xml).not.toContain("/pages/about");
    expect(xml).not.toContain("https://aethertrade.cloud/careers");
    expect(xml).not.toContain("invalid%20slug");
    expect(xml).not.toContain("/pages/future-page");
  });

  it("lists only eligible CMS pages and articles in llms.txt", () => {
    const text = buildRuntimeLlms(records, "AETHER-TRADE", "Trade operations", siteUrl, now);

    expect(text).toContain("[Custom Page](https://aethertrade.cloud/pages/custom-page)");
    expect(text).toContain("[Trade & documents](https://aethertrade.cloud/insights/safe-article)");
    expect(text).toContain("[Platform](https://aethertrade.cloud/platform)");
    expect(text).not.toContain("Draft Page");
    expect(text).not.toContain("Hidden Page");
    expect(text).not.toContain("Duplicate About");
    expect(text).not.toContain("Invalid Slug");
    expect(text).not.toContain("Future Page");
    expect(text).not.toContain("[Careers](https://aethertrade.cloud/careers)");
  });
});
