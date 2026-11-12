import { createFileRoute } from "@tanstack/react-router";
import { MarketPage, type MarketPageContent } from "@/components/site/market-page";

const content: MarketPageContent = {
  market: "China-related supply chains",
  marketKey: "China",
  eyebrow: "China sourcing and export workflows",
  title: "Trade Workflow Automation for Businesses Working with China",
  description:
    "Coordinate supplier document collection, purchase-order hand-offs and shipment preparation across China-related supply chains. AETHER-TRADE helps teams assess repeatable workflows and scope controlled automation around their existing systems.",
  audience:
    "For international importers, exporters, sourcing teams and freight forwarders coordinating with suppliers, manufacturers and logistics partners in China.",
  workflows: [
    {
      title: "Supplier document collection",
      description:
        "Organize requests for commercial invoices, packing lists and transport documents against a purchase order or shipment reference, with staff review for uncertain matches.",
    },
    {
      title: "Purchase-order to shipment hand-offs",
      description:
        "Structure key details as work moves from supplier confirmation to booking, shipment preparation and internal operations review.",
    },
    {
      title: "Cross-party follow-ups",
      description:
        "Prepare consistent requests for missing information and route them to an authorized coordinator before any external message is sent.",
    },
    {
      title: "Document exception handling",
      description:
        "Record missing, inconsistent or unclear information so the responsible team can review exceptions instead of relying on scattered email threads.",
    },
  ],
  considerations: [
    "This English-language page is aimed at international businesses working with China; it is not a claim of a China office or domestic-market presence.",
    "It does not provide customs brokerage, legal advice, product certification or government-system integration.",
    "Supplier and partner communications require client-approved access and human review before consequential actions.",
    "Chinese-language content and China-specific search distribution require a separately reviewed localization project; translation alone is not a complete China SEO strategy.",
  ],
  faq: [
    {
      question: "Is this designed for companies sourcing from Chinese suppliers?",
      answer:
        "The workflows described are relevant to international teams coordinating supplier documents, purchase orders and shipment hand-offs involving China. A pilot must be scoped to the actual process.",
    },
    {
      question: "Can it verify every supplier document automatically?",
      answer:
        "No blanket verification claim is made. Document extraction, matching rules and confidence thresholds must be tested against the client's real document samples, with uncertain results sent for human review.",
    },
    {
      question: "Is the page available in Simplified Chinese?",
      answer:
        "This initial page is in English. A Simplified Chinese version should be professionally localized and reviewed before publication, with matching language and regional signals configured correctly.",
    },
  ],
};

export const Route = createFileRoute("/china-trade-automation")({
  head: () => ({
    links: [{ rel: "canonical", href: "https://aethertrade.cloud/china-trade-automation" }],
    meta: [
      { title: "China Trade & Supplier Document Workflow Automation | AETHER-TRADE" },
      {
        name: "description",
        content:
          "Organize supplier documents, purchase-order hand-offs and shipment follow-ups for international businesses working with China.",
      },
      { property: "og:title", content: "China Trade Workflow Automation | AETHER-TRADE" },
      {
        property: "og:description",
        content:
          "Scoped document and workflow automation for international importers, exporters and logistics teams working with China.",
      },
    ],
  }),
  component: ChinaMarketPage,
});

function ChinaMarketPage() {
  return <MarketPage content={content} />;
}
