const SITE_URL = "https://aethertrade.cloud";

type PageDefinition = {
  name: string;
  description: string;
  type?: "WebPage" | "ContactPage" | "CollectionPage" | "AboutPage";
  service?: boolean;
  softwareApplication?: boolean;
};

const PAGES: Record<string, PageDefinition> = {
  "/": { name: "AETHER-TRADE", description: "Document intelligence and workflow automation for freight forwarders and trade operations teams.", type: "WebPage" },
  "/about": { name: "About AETHER-TRADE", description: "Learn about AETHER-TRADE and its approach to trade operations technology.", type: "AboutPage" },
  "/platform": { name: "Platform", description: "Trade operations workspace, document intelligence and scoped workflow automation." },
  "/how-it-works": { name: "How It Works", description: "How AETHER-TRADE assesses, scopes, tests and delivers workflow pilots." },
  "/solutions": { name: "Solutions", description: "Trade workflow solutions for importers, exporters, freight forwarders and logistics operators." },
  "/industries": { name: "Industries", description: "Trade document and workflow support across trade-related industries." },
  "/services": { name: "Services", description: "Operations assessments, workflow automation, custom AI agents, integrations and pilot support.", service: true },
  "/automations": { name: "Automations", description: "Examples of trade and logistics workflow automations." },
  "/custom-solutions": { name: "Custom Solutions", description: "Scoped workflow automation, document intelligence and system integration services.", service: true },
  "/document-intake": { name: "Document Intelligence Demo", description: "Interactive demonstration of invoice text extraction and human-reviewed information checks.", softwareApplication: true },
  "/shipment-follow-up": { name: "Shipment Follow-up Demo", description: "Interactive demonstration of shipment document comparison and human-reviewed follow-up drafting.", softwareApplication: true },
  "/insights": { name: "Insights", description: "Articles about freight forwarding documents, shipment operations and workflow automation.", type: "CollectionPage" },
  "/partnerships": { name: "Partnerships", description: "Technology, implementation and industry partnership information." },
  "/faqs": { name: "Frequently Asked Questions", description: "Answers about AETHER-TRADE capabilities, availability and implementation." },
  "/contact": { name: "Contact AETHER-TRADE", description: "Contact AETHER-TRADE about trade document intelligence and workflow automation.", type: "ContactPage" },
  "/request-demo": { name: "Request a Demo", description: "Request a workflow demonstration from AETHER-TRADE.", type: "ContactPage" },
  "/privacy-policy": { name: "Privacy Policy", description: "AETHER-TRADE website privacy information." },
  "/terms": { name: "Terms", description: "Terms governing use of the AETHER-TRADE website." },
  "/cookie-policy": { name: "Cookie Policy", description: "Information about cookies and website analytics." },
  "/uae-logistics-automation": { name: "UAE Logistics Automation", description: "Trade and logistics workflow automation information for UAE-connected operations." },
  "/china-trade-automation": { name: "China Trade Automation", description: "Supplier document and trade workflow automation information for China-connected operations." },
  "/usa-freight-forwarding-automation": { name: "US Freight Forwarding Automation", description: "Shipment document and operational workflow automation for US-connected trade teams." },
};

function safeJson(value: unknown): string {
  return JSON.stringify(value).replace(/</g, "\\u003c");
}

export function buildPageStructuredData(pathname: string) {
  const path = pathname === "/" ? "/" : pathname.replace(/\/+$/, "");
  const definition = PAGES[path];
  if (!definition) return null;

  const url = SITE_URL + path;
  const graph: Record<string, unknown>[] = [
    {
      "@type": definition.type ?? "WebPage",
      "@id": url + "#webpage",
      url,
      name: definition.name,
      description: definition.description,
      isPartOf: { "@id": SITE_URL + "/#website" },
      about: { "@id": SITE_URL + "/#organization" },
      breadcrumb: path === "/" ? undefined : { "@id": url + "#breadcrumb" },
    },
  ];

  if (path !== "/") {
    const segments = path.split("/").filter(Boolean);
    const items = [
      { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL + "/" },
      ...segments.map((segment, index) => ({
        "@type": "ListItem",
        position: index + 2,
        name: index === segments.length - 1
          ? definition.name
          : segment.split("-").map((part) => part.charAt(0).toUpperCase() + part.slice(1)).join(" "),
        item: SITE_URL + "/" + segments.slice(0, index + 1).join("/"),
      })),
    ];
    graph.push({
      "@type": "BreadcrumbList",
      "@id": url + "#breadcrumb",
      itemListElement: items,
    });
  }

  if (definition.service) {
    graph.push({
      "@type": "Service",
      "@id": url + "#service",
      name: definition.name,
      description: definition.description,
      provider: { "@id": SITE_URL + "/#organization" },
      url,
      areaServed: ["United Arab Emirates", "International"],
      serviceType: "Trade operations workflow automation and document intelligence",
    });
  }

  if (definition.softwareApplication) {
    graph.push({
      "@type": "SoftwareApplication",
      "@id": url + "#software",
      name: definition.name,
      description: definition.description,
      applicationCategory: "BusinessApplication",
      operatingSystem: "Web",
      url,
      publisher: { "@id": SITE_URL + "/#organization" },
    });
  }

  return { "@context": "https://schema.org", "@graph": graph };
}

export function serializePageStructuredData(pathname: string): string | null {
  const data = buildPageStructuredData(pathname);
  return data ? safeJson(data) : null;
}
