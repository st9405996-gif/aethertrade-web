// Read-only validation for SEO configuration and generated discovery files.
import { readFileSync } from "node:fs";
import { validateSeoConfig } from "./seo-utils.mjs";

const config = JSON.parse(readFileSync("content/seo.json", "utf8"));
const errors = validateSeoConfig(config);
const sitemap = readFileSync("public/sitemap.xml", "utf8");
const robots = readFileSync("public/robots.txt", "utf8");
const llms = readFileSync("public/llms.txt", "utf8");

const base = config.site.url.replace(/\/+$/, "");
for (const page of config.pages.filter((entry) => entry.indexable)) {
  const url = base + (page.path === "/" ? "/" : page.path);
  if (!sitemap.includes("<loc>" + url + "</loc>")) errors.push("Sitemap is missing " + page.path);
}
for (const page of config.pages.filter((entry) => !entry.indexable)) {
  const url = base + (page.path === "/" ? "/" : page.path);
  if (sitemap.includes("<loc>" + url + "</loc>")) {
    errors.push("Sitemap must omit non-indexable path " + page.path);
  }
}
if (!robots.includes("Sitemap: " + base + "/sitemap.xml")) {
  errors.push("robots.txt must reference the canonical sitemap URL.");
}
const oaiSection =
  robots.match(/^User-agent: OAI-SearchBot\s*$([\\s\\S]*?)(?=^User-agent:|^Sitemap:|$)/m)?.[1] ?? "";
if (!/^Allow: \/$/m.test(oaiSection)) {
  errors.push("robots.txt must explicitly allow OAI-SearchBot for ChatGPT search discovery.");
}
if (!llms.startsWith("# " + config.site.name + "\n")) {
  errors.push("llms.txt is missing the site heading.");
}
if (/&(?!amp;|lt;|gt;|quot;|apos;)/.test(sitemap)) {
  errors.push("Sitemap contains an unescaped XML ampersand.");
}

if (errors.length) {
  console.error("SEO checks failed:");
  for (const error of errors) console.error("- " + error);
  process.exitCode = 1;
} else {
  console.log(
    "SEO checks passed for " + config.pages.filter((page) => page.indexable).length +
      " configured public URLs.",
  );
}
