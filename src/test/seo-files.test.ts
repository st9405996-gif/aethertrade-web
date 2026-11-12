/**
 * @vitest-environment node
 */
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const root = process.cwd();
const sitemap = readFileSync(join(root, "public/sitemap.xml"), "utf8");
const robots = readFileSync(join(root, "public/robots.txt"), "utf8");
const llms = readFileSync(join(root, "public/llms.txt"), "utf8");
const seoConfig: {
  site: { url: string };
  pages: Array<{ path: string; indexable: boolean; llmsLabel?: string }>;
} = JSON.parse(readFileSync(join(root, "content/seo.json"), "utf8"));
const routesDir = join(root, "src/routes");

const sitemapPaths = [
  ...sitemap.matchAll(/<loc>https:\/\/aethertrade\.cloud(\/[^<]*)<\/loc>/g),
].map((m) => m[1]!);
const llmsPaths = [...llms.matchAll(/\]\((https:\/\/aethertrade\.cloud[^)]*)\)/g)].map(
  (match) => new URL(match[1]!).pathname,
);

/** Maps a route file to its URL path (index.tsx -> /, platform.tsx -> /platform). */
function routePathOf(file: string): string {
  const base = file.replace(/\.tsx?$/, "");
  if (base === "index") return "/";
  return "/" + base.replace(/\./g, "/");
}

/** Matches concrete URLs against static routes and file-based dynamic segments. */
function hasRoute(path: string, routePaths: Set<string>): boolean {
  return [...routePaths].some((route) => {
    const pattern = route.split("/").map((segment) =>
      segment.startsWith("$") ? "[^/]+" : segment
    ).join("/");
    return new RegExp("^" + pattern + "/?$").test(path);
  });
}

describe("SEO files", () => {
  it("sitemap lists the public pages and nothing else", () => {
    expect(sitemapPaths.length).toBeGreaterThanOrEqual(15);
    for (const path of sitemapPaths) {
      expect(path.startsWith("/admin")).toBe(false);
      expect(path.startsWith("/api")).toBe(false);
    }
  });

  it("sitemap never includes a route that declares noindex", () => {
    const noindex = readdirSync(routesDir)
      .filter((f) => /\.tsx$/.test(f))
      .filter((f) => readFileSync(join(routesDir, f), "utf8").includes('"noindex"'))
      .map(routePathOf);
    for (const path of sitemapPaths) {
      expect(noindex).not.toContain(path);
    }
  });

  it("every sitemap path is an existing route file", () => {
    const files = new Set(readdirSync(routesDir).map(routePathOf));
    for (const path of sitemapPaths) {
      expect(hasRoute(path, files), `missing route for ${path}`).toBe(true);
    }
  });

  it("llms.txt lists only configured public pages with a route", () => {
    const expectedPaths = seoConfig.pages
      .filter((page) => page.indexable && page.llmsLabel)
      .map((page) => page.path);
    expect(llmsPaths).toEqual(expectedPaths);

    const files = new Set(readdirSync(routesDir).map(routePathOf));
    for (const path of llmsPaths) {
      expect(hasRoute(path, files), `missing route for ${path}`).toBe(true);
    }
  });

  it("every indexable page has server-rendered canonical metadata", () => {
    for (const page of seoConfig.pages.filter((entry) => entry.indexable)) {
      if (page.path.startsWith("/insights/")) {
        const articleRoute = readFileSync(join(routesDir, "insights.$slug.tsx"), "utf8");
        expect(articleRoute).toContain("const canonical = `${SITE_URL}/insights/${encodeURIComponent(article.slug)}`");
        continue;
      }

      const routeFile = page.path === "/" ? "index.tsx" : page.path.slice(1) + ".tsx";
      const source = readFileSync(join(routesDir, routeFile), "utf8");
      const hasFallback = source.includes(`fallbackPath: "${page.path}"`);
      const hasExplicitCanonical = source.includes(
        `href: "https://aethertrade.cloud${page.path}"`,
      );
      expect(hasFallback || hasExplicitCanonical, `missing canonical for ${page.path}`).toBe(true);
    }
  });

  it("robots.txt points to the sitemap and blocks non-public paths", () => {
    expect(robots).toContain("Sitemap: https://aethertrade.cloud/sitemap.xml");
    for (const path of ["/admin", "/auth", "/reset-password", "/thank-you", "/api/"]) {
      expect(robots).toContain(`Disallow: ${path}`);
    }
  });
});
