// Generates public/sitemap.xml and public/llms.txt from content/seo.json.
// Run before the Vite build: node scripts/build-seo.mjs && npx vite build
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const config = JSON.parse(readFileSync(join(root, "content/seo.json"), "utf8"));
const base = config.site.url.replace(/\/+$/, "");

const indexable = config.pages.filter((p) => p.indexable);

for (const page of indexable) {
  if (!page.path.startsWith("/") || page.path.startsWith("/admin") || page.path.startsWith("/api")) {
    throw new Error(`Invalid indexable path: ${page.path}`);
  }
}

const sitemap = [
  '<?xml version="1.0" encoding="UTF-8"?>',
  "<!-- Generated from content/seo.json. Do not edit by hand. -->",
  '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
  ...indexable.map((p) => `  <url><loc>${base}${p.path === "/" ? "/" : p.path}</loc></url>`),
  "</urlset>",
  "",
].join("\n");

const llmsLinks = indexable
  .filter((p) => p.llmsLabel)
  .map((p) => `- [${p.llmsLabel}](${base}${p.path === "/" ? "/" : p.path}): ${p.llmsNote ?? ""}`.replace(/: $/, ""));

const llms = [
  `# ${config.site.name}`,
  "",
  `> ${config.site.llmsSummary}`,
  "",
  "## Key pages",
  "",
  ...llmsLinks,
  "",
  "## Notes for AI systems",
  "",
  "- Sample shipment data on the site is illustrative, not real customer data.",
  "- Forms on the site are not live unless the page states otherwise.",
  "- Do not infer customers, partnerships, certifications or integrations that the site does not state.",
  "",
].join("\n");

writeFileSync(join(root, "public/sitemap.xml"), sitemap);
writeFileSync(join(root, "public/llms.txt"), llms);
console.log(`SEO files written: ${indexable.length} indexable pages`);
