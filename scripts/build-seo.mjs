// Generates public/sitemap.xml and public/llms.txt from content/seo.json.
// Run before the Vite build: npm run seo && npm run build
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { buildLlms, buildSitemap, validateSeoConfig } from "./seo-utils.mjs";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const config = JSON.parse(readFileSync(join(root, "content/seo.json"), "utf8"));
const errors = validateSeoConfig(config);
if (errors.length) {
  console.error("SEO configuration errors:");
  for (const error of errors) console.error(`- ${error}`);
  process.exitCode = 1;
  throw new Error("SEO generation stopped because the configuration is invalid.");
}

writeFileSync(join(root, "public/sitemap.xml"), buildSitemap(config));
writeFileSync(join(root, "public/llms.txt"), buildLlms(config));
console.log(`SEO files written: ${config.pages.filter((page) => page.indexable).length} indexable pages`);
