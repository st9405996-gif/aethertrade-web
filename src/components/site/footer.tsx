import { adminDemoEnabled } from "@/lib/site-mode";
import { Link } from "@tanstack/react-router";
import { Logo } from "@/components/site/logo";

const COLUMNS: { heading: string; links: { label: string; to: string }[] }[] = [
  {
    heading: "Platform",
    links: [
      { label: "Platform", to: "/platform" },
      { label: "How It Works", to: "/how-it-works" },
      { label: "Solutions", to: "/solutions" },
      { label: "Industries", to: "/industries" },
    ],
  },
  {
    heading: "Services",
    links: [
      { label: "Automation Catalogue", to: "/automations" },
      { label: "Custom Solutions", to: "/custom-solutions" },
      { label: "Services", to: "/services" },
      { label: "Insights", to: "/insights" },
    ],
  },
  {
    heading: "Company",
    links: [
      { label: "About", to: "/about" },
      { label: "Partnerships", to: "/partnerships" },
      { label: "Careers", to: "/careers" },
      { label: "FAQs", to: "/faqs" },
      { label: "Contact", to: "/contact" },
      { label: "Book an Operations Audit", to: "/request-demo" },
    ],
  },
  {
    heading: "Legal",
    links: [
      { label: "Privacy Policy", to: "/privacy-policy" },
      { label: "Terms of Use", to: "/terms" },
      { label: "Cookie Policy", to: "/cookie-policy" },
    ],
  },
];

export function Footer() {
  return (
    <footer className="border-t border-border bg-card/40">
      <div className="container-page py-14">
        <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-[1.4fr_repeat(4,1fr)]">
          <div className="space-y-4">
            <Logo />
            <p className="max-w-xs text-sm text-muted-foreground">
              Your AI-Powered Operations Partner for Global Trade. We automate
              global trade operations.
            </p>
          </div>
          {COLUMNS.map((col) => (
            <nav key={col.heading} aria-label={col.heading} className="space-y-3">
              <h3 className="eyebrow">{col.heading}</h3>
              <ul className="space-y-2.5">
                {col.links.map((link) => (
                  <li key={link.label}>
                    <Link
                      to={link.to}
                      className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>
        <div className="mt-12 flex flex-col gap-3 border-t border-border pt-6 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} AETHER-TRADE. All rights reserved.</p>
          {adminDemoEnabled && <Link to="/admin" className="text-primary hover:underline">Admin demo workspace</Link>}
          <p className="font-mono tracking-widest">GLOBAL TRADE TECHNOLOGY & AUTOMATION</p>
        </div>
      </div>
    </footer>
  );
}
