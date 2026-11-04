export function escapeXml(value) {
  return String(value).replace(/[<>&"']/g, (character) => ({
    "<": "&lt;",
    ">": "&gt;",
    "&": "&amp;",
    '"': "&quot;",
    "'": "&apos;",
  })[character]);
}

export function validateSeoConfig(config) {
  const errors = [];
  if (!config || typeof config !== "object" || !config.site || !Array.isArray(config.pages)) {
    return ["SEO config must contain site metadata and a pages array."];
  }

  let origin;
  try {
    const parsed = new URL(config.site.url);
    if (parsed.protocol !== "https:") errors.push("site.url must use HTTPS.");
    origin = parsed.origin;
  } catch {
    errors.push("site.url must be an absolute URL.");
    return errors;
  }

  const seen = new Set();
  for (const page of config.pages) {
    if (!page || typeof page.path !== "string" || !page.path.startsWith("/") ||
        page.path.startsWith("//") || page.path.includes("?") || page.path.includes("#")) {
      errors.push(`Invalid page path: ${String(page?.path)}`);
      continue;
    }
    if (page.path.startsWith("/admin") || page.path.startsWith("/api")) {
      if (page.indexable) errors.push(`Private path cannot be indexable: ${page.path}`);
    }
    if (seen.has(page.path)) errors.push(`Duplicate page path: ${page.path}`);
    seen.add(page.path);
    if (page.canonical) {
      try {
        if (new URL(page.canonical, origin).origin !== origin) {
          errors.push(`Canonical must remain on the site origin: ${page.path}`);
        }
      } catch {
        errors.push(`Invalid canonical URL: ${page.path}`);
      }
    }
    if (page.indexable && page.description && page.description.length > 320) {
      errors.push(`Meta description is too long: ${page.path}`);
    }
  }
  return errors;
}

export function buildSitemap(config) {
  const base = config.site.url.replace(/\/+$/, "");
  const urls = config.pages.filter((page) => page.indexable);
  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...urls.map((page) => `  <url><loc>${escapeXml(base + (page.path === "/" ? "/" : page.path))}</loc></url>`),
    "</urlset>",
    "",
  ].join("\n");
}

export function buildLlms(config) {
  const base = config.site.url.replace(/\/+$/, "");
  const links = config.pages
    .filter((page) => page.indexable && page.llmsLabel)
    .map((page) => `- [${page.llmsLabel}](${base}${page.path === "/" ? "/" : page.path}): ${page.llmsNote ?? ""}`.replace(/: $/, ""));
  return [
    `# ${config.site.name}`,
    "",
    `> ${config.site.llmsSummary}`,
    "",
    "## Key pages",
    "",
    ...links,
    "",
    "## Notes for AI systems",
    "",
    "- Sample shipment data on the site is illustrative, not real customer data.",
    "- Forms on the site are not live unless the page states otherwise.",
    "- Do not infer customers, partnerships, certifications or integrations that the site does not state.",
    "",
  ].join("\n");
}
