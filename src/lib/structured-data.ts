const SITE_URL = "https://aethertrade.cloud";

type PageDefinition = {
  name: string;
  description: string;
  type?: "WebPage" | "ContactPage" | "CollectionPage" | "AboutPage";
  service?: boolean;
  softwareApplication?: boolean;
};

const PAGES: Record<string, PageDefinition> = {
  "/": { name: "AETHER-TRADE", description: "AETHER-TRADE provides document intelligence and workflow automation for freight forwarders and trade operations teams, with human review for consequential decisions." },
  "/about": { name: "About AETHER-TRADE", description: "Learn about AETHER-TRADE and its approach to trade operations technology.", type: "AboutPage" },
  "/platform": { name: "Platform", description: "Explore AETHER-TRADE's trade case workspace and document intelligence capabilities, plus custom workflow modules scoped around existing systems." },
  "/how-it-works": { name: "How It Works", description: "See how AETHER-TRADE assesses a trade workflow, agrees scope, builds and tests a pilot, and keeps human review in control." },
  "/solutions": { name: "Solutions", description: "Workflow automation and document intelligence for freight forwarders, importers, exporters, logistics operators and trading companies." },
  "/industries": { name: "Industries", description: "Explore document and workflow challenges across textiles, agriculture, machinery, consumer goods and other trade-related sectors." },
  "/services": { name: "Services", description: "Operations assessments, document workflow automation, custom AI agents, systems integration and pilot support for trade operations.", service: true },
  "/automations": { name: "Automations", description: "Explore example workflows for inquiry triage, shipment follow-up, document intake and invoice-to-packing-list reconciliation, with clear availability labels." },
  "/document-intake": { name: "Trade Document Intake & Structuring Demo", description: "Illustrative demo of trade document intake, field structuring and human review.", softwareApplication: true },
  "/shipment-follow-up": { name: "Shipment Follow-Up Assistant Demo", description: "Illustrative demo of shipment document tracking, missing-item follow-up drafting and human approval.", softwareApplication: true },
  "/insights": { name: "Insights", description: "Practical guidance on freight forwarding document review, shipment case management, trade documents and human-reviewed automation.", type: "CollectionPage" },
  "/partnerships": { name: "Partnerships", description: "Explore implementation, technology and industry partnership opportunities with AETHER-TRADE." },
  "/faqs": { name: "FAQs", description: "Answers about AETHER-TRADE's trade document intelligence, workflow automation, implementation approach and capability availability." },
  "/contact": { name: "Contact AETHER-TRADE", description: "Contact AETHER-TRADE about freight document intelligence, trade operations automation and a focused workflow assessment.", type: "ContactPage" },
  "/request-demo": { name: "Request a Demo", description: "Request a workflow demo for freight document intelligence and shipment operations automation from AETHER-TRADE.", type: "ContactPage" },
  "/privacy-policy": { name: "Privacy Policy", description: "Learn what information AETHER-TRADE collects through its website, how inquiries are handled and how privacy choices are respected." },
  "/terms": { name: "Terms", description: "Read the terms governing use of the AETHER-TRADE website and submission of business inquiries." },
  "/cookie-policy": { name: "Cookie Policy", description: "Learn how AETHER-TRADE uses essential browser storage, consent preferences and website analytics." },
  "/custom-solutions": { name: "Custom Solutions", description: "Custom workflow automation, document intelligence and system integration projects scoped around freight and trade operations.", service: true },
  "/uae-logistics-automation": { name: "UAE Freight Forwarding & Trade Workflow Automation", description: "Explore shipment document coordination and logistics workflow automation for freight forwarders and trade teams connected to the UAE." },
  "/china-trade-automation": { name: "China Trade & Supplier Document Workflow Automation", description: "Organize supplier documents, purchase-order hand-offs and shipment follow-ups for international businesses working with China." },
  "/usa-freight-forwarding-automation": { name: "US Freight Forwarding & Import-Export Workflow Automation", description: "Explore shipment document coordination, inbox automation and exception workflows for US-connected freight forwarders and trade teams." },
};

function safeJson(value: unknown): string {
  return JSON.stringify(value).replace(/</g, "\\u003c");
}

export function buildPageStructuredData(pathname: string) {
  const path = pathname === "/" ? "/" : pathname.replace(/\/+$/, "");
  const definition = PAGES[path] ?? (path.startsWith("/insights/") && path.length > "/insights/".length
    ? { name: "AETHER-TRADE Insight", description: "Practical guidance on freight forwarding documents, shipment operations and trade workflow automation." }
    : undefined);
  if (!definition) return null;

  const url = SITE_URL + path;
  const graph: Record<string, unknown>[] = [{
    "@type": definition.type ?? "WebPage",
    "@id": url + "#webpage",
    url,
    name: definition.name,
    description: definition.description,
    isPartOf: { "@id": SITE_URL + "/#website" },
    about: { "@id": SITE_URL + "/#organization" },
    ...(path === "/" ? {} : { breadcrumb: { "@id": url + "#breadcrumb" } }),
  }];

  if (path !== "/") {
    const segments = path.split("/").filter(Boolean);
    graph.push({
      "@type": "BreadcrumbList",
      "@id": url + "#breadcrumb",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL + "/" },
        ...segments.map((segment, index) => ({
          "@type": "ListItem",
          position: index + 2,
          name: index === segments.length - 1
            ? definition.name
            : segment.split("-").map((part) => part.charAt(0).toUpperCase() + part.slice(1)).join(" "),
          item: SITE_URL + "/" + segments.slice(0, index + 1).join("/"),
        })),
      ],
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
