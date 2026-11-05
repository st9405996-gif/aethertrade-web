import { adminDemoEnabled } from "@/lib/site-mode";
import { Link } from "@tanstack/react-router";
import { Logo } from "@/components/site/logo";
import { useQuery } from "@tanstack/react-query";
import { getPublishedContentRecords } from "@/lib/public-content-records.functions";
import { getPublicWebsiteSettings } from "@/lib/public-website-settings.functions";

const COLUMNS: { heading: string; links: { label: string; to: string }[] }[] = [
  { heading: "Platform", links: [{ label: "Platform", to: "/platform" }, { label: "How It Works", to: "/how-it-works" }, { label: "Solutions", to: "/solutions" }, { label: "Industries", to: "/industries" }] },
  { heading: "Services", links: [{ label: "Automation Catalogue", to: "/automations" }, { label: "Custom Solutions", to: "/custom-solutions" }, { label: "Services", to: "/services" }, { label: "Insights", to: "/insights" }] },
  { heading: "Company", links: [{ label: "About", to: "/about" }, { label: "Partnerships", to: "/partnerships" }, { label: "Careers", to: "/careers" }, { label: "FAQs", to: "/faqs" }, { label: "Contact", to: "/contact" }, { label: "Book an Operations Audit", to: "/request-demo" }] },
  { heading: "Legal", links: [{ label: "Privacy Policy", to: "/privacy-policy" }, { label: "Terms of Use", to: "/terms" }, { label: "Cookie Policy", to: "/cookie-policy" }] },
];

export function Footer() {
  const { data } = useQuery({
    queryKey: ["public-footer-navigation"],
    queryFn: () => getPublishedContentRecords({ data: { module: "navigation" } }),
  });
  const { data: siteSettings } = useQuery({
    queryKey: ["public-website-settings"],
    queryFn: () => getPublicWebsiteSettings(),
  });
  const { data: brandRecords } = useQuery({
    queryKey: ["public-branding"],
    queryFn: () => getPublishedContentRecords({ data: { module: "branding" } }),
  });
  const brand = brandRecords?.[0];
  const email = brand?.fields.email?.trim() || "";
  const phone = brand?.fields.phone?.trim() || "";
  const address = brand?.fields.address?.trim() || "";
  const socialLinks = (brand?.fields.social || "").split("\n").map(value => value.trim()).filter(value => value.startsWith("https://"));
  const footerItems = data?.filter(item => item.category.toLowerCase() === "footer" && item.fields.visible !== "false" && (item.title !== "Careers" || siteSettings?.careersEnabled === true))
    .map(item => ({ label: item.title, to: item.body.trim(), heading: item.fields.group || "Company" }))
    .filter(item => item.to.startsWith("/") && !item.to.startsWith("//"));
  const columns = footerItems?.length
    ? Array.from(new Set(footerItems.map(item => item.heading))).map(heading => ({
        heading, links: footerItems.filter(item => item.heading === heading).map(({ label, to }) => ({ label, to })),
      }))
    : COLUMNS;
  return <footer className="border-t border-border bg-card/40">
    <div className="container-page py-14">
      <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-[1.4fr_repeat(4,1fr)]">
        <div className="space-y-4">
          <Logo />
          {email && <p className="text-sm text-muted-foreground"><a href={"mailto:" + email} className="hover:text-foreground">{email}</a></p>}
          {phone && <p className="text-sm text-muted-foreground"><a href={"tel:" + phone.replace(/[^+0-9]/g, "")} className="hover:text-foreground">{phone}</a></p>}
          {address && <p className="max-w-xs whitespace-pre-wrap text-sm text-muted-foreground">{address}</p>}
          {socialLinks.length > 0 && <div className="flex flex-wrap gap-3">{socialLinks.map((url, index) => <a key={url} href={url} target="_blank" rel="noopener noreferrer" className="text-xs text-muted-foreground underline-offset-4 hover:underline">Social link {index + 1}</a>)}</div>}
        </div>
        {columns.map(col => <nav key={col.heading} aria-label={col.heading} className="space-y-3"><h3 className="eyebrow">{col.heading}</h3><ul className="space-y-2.5">
          {col.links.map(link => <li key={link.label}><Link to={link.to as never} className="text-sm text-muted-foreground transition-colors hover:text-foreground">{link.label}</Link></li>)}
        </ul></nav>)}
      </div>
      <div className="mt-12 flex flex-col gap-3 border-t border-border pt-6 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
        <p>© {new Date().getFullYear()} AETHER-TRADE. All rights reserved.</p>
        {adminDemoEnabled && <Link to="/admin" className="text-primary hover:underline">Admin demo workspace</Link>}
        <p className="font-mono tracking-widest">GLOBAL TRADE TECHNOLOGY & AUTOMATION</p>
      </div>
    </div>
  </footer>;
}
