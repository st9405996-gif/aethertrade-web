import { createFileRoute } from "@tanstack/react-router";
import { MarketPage, type MarketPageContent } from "@/components/site/market-page";

const content: MarketPageContent = {
  market: "the United States",
  marketKey: "United States",
  eyebrow: "US freight forwarding and trade operations",
  title: "Workflow Automation for US Freight Forwarders and Import-Export Teams",
  description:
    "Reduce repetitive coordination across shipment documents, inbox follow-ups and operational hand-offs. AETHER-TRADE scopes custom workflows for US-connected freight forwarding, importing, exporting and logistics operations.",
  audience:
    "For freight forwarders, importers, exporters, 3PLs and trade operations teams coordinating shipments, suppliers, customers and logistics partners connected to the United States.",
  workflows: [
    {
      title: "Inbound shipment document coordination",
      description:
        "Organize document requests and status across commercial invoices, packing lists and transport records, with clear ownership for unresolved items.",
    },
    {
      title: "Freight-forwarder inbox workflows",
      description:
        "Match incoming messages to agreed shipment references, prepare follow-up drafts and keep a review step before external communication.",
    },
    {
      title: "Operational exception queues",
      description:
        "Surface missing fields, inconsistent references and incomplete document sets for authorized staff to investigate and resolve.",
    },
    {
      title: "Team hand-offs and reporting",
      description:
        "Create a clearer record of pending work, approvals and follow-up history across operations, customer service and documentation teams.",
    },
  ],
  considerations: [
    "This page describes workflows for businesses connected to the US market; it does not claim a US office or local legal representation.",
    "No customs brokerage, customs filing, ACE integration or regulatory compliance determination is included or implied.",
    "Connections to email, ERP, TMS, CRM or other systems require client authorization and a separately confirmed technical scope.",
    "Each engagement should begin with a bounded workflow, agreed success measures and a supervised pilot.",
  ],
  faq: [
    {
      question: "Can AETHER-TRADE replace our transportation management system?",
      answer:
        "No. The focus is on scoped document and workflow automation that may complement existing systems. It is not presented as a replacement TMS.",
    },
    {
      question: "Does it file customs entries or provide compliance advice?",
      answer:
        "No such service is claimed. Customs filing and regulatory decisions remain with the client's authorized professionals and providers.",
    },
    {
      question: "Can it work with our freight-forwarding software?",
      answer:
        "A connection can only be assessed after reviewing the system, available interfaces, permissions and project requirements. No integration should be assumed until tested and agreed.",
    },
  ],
};

export const Route = createFileRoute("/usa-freight-forwarding-automation")({
  head: () => ({
    links: [{ rel: "canonical", href: "https://aethertrade.cloud/usa-freight-forwarding-automation" }],
    meta: [
      { title: "US Freight Forwarding & Import-Export Workflow Automation | AETHER-TRADE" },
      {
        name: "description",
        content:
          "Explore shipment document coordination, inbox automation and exception workflows for US freight forwarders, importers and exporters.",
      },
      { property: "og:title", content: "US Freight Forwarding Workflow Automation | AETHER-TRADE" },
      {
        property: "og:description",
        content:
          "Scoped shipment-document and operational workflow automation for US-connected trade teams.",
      },
    ],
  }),
  component: UsaMarketPage,
});

function UsaMarketPage() {
  return <MarketPage content={content} />;
}
