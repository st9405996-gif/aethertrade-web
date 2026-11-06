const reservedCmsPageSlugs = new Set([
  "about",
  "admin",
  "api",
  "auth",
  "automations",
  "careers",
  "contact",
  "cookie-policy",
  "custom-solutions",
  "faqs",
  "home",
  "how-it-works",
  "industries",
  "insights",
  "pages",
  "partnerships",
  "platform",
  "privacy-policy",
  "request-demo",
  "reset-password",
  "services",
  "solutions",
  "terms",
  "thank-you",
]);

export function isValidCmsPageSlug(slug: unknown): slug is string {
  return (
    typeof slug === "string" &&
    slug.length > 0 &&
    slug.length <= 160 &&
    /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)
  );
}

export function isReservedCmsPageSlug(slug: string): boolean {
  return reservedCmsPageSlugs.has(slug);
}

export function isRoutableCmsPageSlug(slug: unknown): slug is string {
  return isValidCmsPageSlug(slug) && !isReservedCmsPageSlug(slug);
}

export function cmsPagePath(slug: string): string {
  return "/pages/" + encodeURIComponent(slug);
}
