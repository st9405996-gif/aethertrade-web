import type { PublicWebsiteSettings } from "@/lib/public-website-settings.functions";

export function isCareersEnabled(settings: PublicWebsiteSettings | null | undefined): boolean {
  return settings?.status === "available" && settings.careersEnabled === true;
}

export function careersRobotsMeta(
  settings: PublicWebsiteSettings | null | undefined,
): { name: "robots"; content: "noindex, nofollow" } | null {
  return isCareersEnabled(settings) ? null : { name: "robots", content: "noindex, nofollow" };
}

function isCareersLink(link: { label: string; to?: string }): boolean {
  const path = (link.to ?? "").split(/[?#]/, 1)[0]?.replace(/\/+$/, "") ?? "";
  return (
    link.label.trim().toLowerCase() === "careers" ||
    path === "/careers" ||
    path.startsWith("/careers/")
  );
}

export function filterCareersLinks<T extends { label: string; to?: string }>(
  links: readonly T[],
  settings: PublicWebsiteSettings | null | undefined,
): T[] {
  return links.filter((link) => isCareersEnabled(settings) || !isCareersLink(link));
}
