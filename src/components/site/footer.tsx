import { Link } from "@tanstack/react-router";
import { Logo } from "@/components/site/logo";
import { useQuery } from "@tanstack/react-query";
import { getPublishedContentRecords } from "@/lib/public-content-records.functions";
import { getPublicWebsiteSettings } from "@/lib/public-website-settings.functions";
import { filterCareersLinks } from "@/lib/careers-visibility";

export function Footer() {
  const { data, isError: navigationError } = useQuery({
    queryKey: ["public-footer-navigation"],
    queryFn: () => getPublishedContentRecords({ data: { module: "navigation" } }),
  });
  const { data: siteSettings } = useQuery({
    queryKey: ["public-website-settings"],
    queryFn: () => getPublicWebsiteSettings(),
  });
  const { data: brandRecords, isError: brandingError } = useQuery({
    queryKey: ["public-branding"],
    queryFn: () => getPublishedContentRecords({ data: { module: "branding" } }),
  });
  const brand = brandingError ? undefined : brandRecords?.[0];
  const email = brand?.fields["email"]?.trim() || "";
  const phone = brand?.fields["phone"]?.trim() || "";
  const address = brand?.fields["address"]?.trim() || "";
  const socialLinks = (brand?.fields["social"] || "")
    .split("\n")
    .map((value) => value.trim())
    .filter((value) => value.startsWith("https://"));
  const footerItems = !navigationError
    ? data
        ?.filter(
          (item) => item.category.toLowerCase() === "footer" && item.fields["visible"] !== "false",
        )
        .map((item) => ({
          label: item.title,
          to: item.body.trim(),
          heading: item.fields["group"] || "Company",
        }))
        .filter((item) => item.to.startsWith("/") && !item.to.startsWith("//"))
    : undefined;
  const visibleFooterItems = footerItems
    ? filterCareersLinks(footerItems, siteSettings)
    : undefined;
  const columns = visibleFooterItems?.length
    ? Array.from(new Set(visibleFooterItems.map((item) => item.heading))).map((heading) => ({
        heading,
        links: visibleFooterItems
          .filter((item) => item.heading === heading)
          .map(({ label, to }) => ({ label, to })),
      }))
    : [];
  const navigationMessage = navigationError
    ? "Footer navigation could not be loaded."
    : data && columns.length === 0
      ? "No footer navigation links are published."
      : "";
  return (
    <footer className="border-t border-border bg-card/40">
      <div className="container-page py-14">
        <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-[1.4fr_repeat(4,1fr)]">
          <div className="space-y-4">
            <Logo />
            {brandingError && (
              <p role="status" className="text-sm text-muted-foreground">
                Contact details could not be loaded.
              </p>
            )}
            {email && (
              <p className="text-sm text-muted-foreground">
                <a href={"mailto:" + email} className="hover:text-foreground">
                  {email}
                </a>
              </p>
            )}
            {phone && (
              <p className="text-sm text-muted-foreground">
                <a href={"tel:" + phone.replace(/[^+0-9]/g, "")} className="hover:text-foreground">
                  {phone}
                </a>
              </p>
            )}
            {address && (
              <p className="max-w-xs whitespace-pre-wrap text-sm text-muted-foreground">
                {address}
              </p>
            )}
            {socialLinks.length > 0 && (
              <div className="flex flex-wrap gap-3">
                {socialLinks.map((url, index) => (
                  <a
                    key={url}
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-muted-foreground underline-offset-4 hover:underline"
                  >
                    Social link {index + 1}
                  </a>
                ))}
              </div>
            )}
          </div>
          {columns.map((col) => (
            <nav key={col.heading} aria-label={col.heading} className="space-y-3">
              <h3 className="eyebrow">{col.heading}</h3>
              <ul className="space-y-2.5">
                {col.links.map((link) => (
                  <li key={link.label}>
                    <Link
                      to={link.to as never}
                      className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
          {navigationMessage && (
            <p role="status" className="text-sm text-muted-foreground">
              {navigationMessage}
            </p>
          )}
        </div>
        <div className="mt-12 flex flex-col gap-3 border-t border-border pt-6 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} AETHER-TRADE. All rights reserved.</p>
          <p className="font-mono tracking-widest">GLOBAL TRADE TECHNOLOGY & AUTOMATION</p>
        </div>
      </div>
    </footer>
  );
}
