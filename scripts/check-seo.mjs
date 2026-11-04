// Read-only validation for SEO configuration and generated discovery files.
import { readFileSync } from "node:fs";
import { validateSeoConfig } from "./seo-utils.mjs";

const config = JSON.parse(readFileSync("content/seo.json", "utf8"));
const errors = validateSeoConfig(config);
const sitemap = readFileSync("public/sitemap.xml", "utf8");
const robots = readFileSync("public/robots.txt", "utf8");
const llms = readFileSync("public/llms.txt", "utf8");

for (const page of config.pages.filter((entry) => entry.indexable)) {
  const url = config.site.url.replace(/\/+$/, "") + (page.path === "/" ? "/" : page.path);
  if (!sitemap.includes(`<loc>${url}</loc>`)) errors.push(`Sitemap is missing ${page.path}`);
}
if (!robots.includes(`Sitemap: ${config.site.url.replace(/\/+$/, "")}/sitemap.xml`)) {
  errors.push("robots.txt must reference the canonical sitemap URL.");
}
if (!llms.startsWith(`# ${config.site.name}\n`)) errors.push("llms.txt is missing the site heading.");
if (/&(?!amp;|lt;|gt;|quot;|apos;)/.test(sitemap)) errors.push("Sitemap contains an unescaped XML ampersand.");

if (errors.length) {
  console.error("SEO checks failed:");
  for (const error of errors) console.error(`- ${error}`);
  process.exitCode = 1;
} else {
  console.log(`SEO checks passed for ${config.pages.filter((page) => page.indexable).length} configured public URLs.`);
}
