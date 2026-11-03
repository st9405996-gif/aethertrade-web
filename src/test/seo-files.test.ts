/**
 * @vitest-environment node
 */
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const root = process.cwd();
const sitemap = readFileSync(join(root, "public/sitemap.xml"), "utf8");
const robots = readFileSync(join(root, "public/robots.txt"), "utf8");
const routesDir = join(root, "src/routes");

const sitemapPaths = [
  ...sitemap.matchAll(/<loc>https:\/\/aethertrade\.cloud(\/[^<]*)<\/loc>/g),
].map((m) => m[1]!);

/** Maps a route file to its URL path (index.tsx -> /, platform.tsx -> /platform). */
function routePathOf(file: string): string {
  const base = file.replace(/\.tsx?$/, "");
  if (base === "index") return "/";
  return "/" + base;
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
      expect(files.has(path), `missing route for ${path}`).toBe(true);
    }
  });

  it("robots.txt points to the sitemap and blocks non-public paths", () => {
    expect(robots).toContain("Sitemap: https://aethertrade.cloud/sitemap.xml");
    for (const path of ["/admin", "/auth", "/reset-password", "/thank-you", "/api/"]) {
      expect(robots).toContain(`Disallow: ${path}`);
    }
  });
});
