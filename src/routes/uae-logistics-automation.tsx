import { createFileRoute } from "@tanstack/react-router";
import { MarketPage, type MarketPageContent } from "@/components/site/market-page";

const content: MarketPageContent = {
  market: "the UAE",
  eyebrow: "UAE trade and logistics workflows",
  title: "Workflow Automation for UAE Freight Forwarders and Trade Teams",
  description:
    "Organize shipment-document follow-ups, operational hand-offs and exception reviews for businesses coordinating imports, exports and logistics through the UAE. AETHER-TRADE scopes custom workflows around your team's existing process and approved systems.",
  audience:
    "For freight forwarders, importers, exporters and logistics operations teams handling supplier, customer, agent and carrier coordination connected to the UAE.",
  workflows: [
    {
      title: "Shipment document follow-ups",
      description:
        "Track which agreed documents are outstanding, prepare consistent follow-up drafts and route messages for coordinator approval before sending.",
    },
    {
      title: "Import and export hand-offs",
      description:
        "Organize booking references, shipment details, document requests and internal ownership across recurring operational steps.",
    },
    {
      title: "Exception review",
      description:
        "Bring missing or inconsistent information into a review queue so authorized staff can investigate and decide what happens next.",
    },
    {
      title: "Operational reporting",
      description:
        "Summarize open cases, outstanding documents, pending approvals and recurring bottlenecks using the data made available for the agreed pilot.",
    },
  ],
  considerations: [
    "UAE-specific workflows are scoped with the client; this page does not claim a UAE office or local representation.",
    "No customs clearance, government-platform access or Dubai Customs integration is implied.",
    "ERP, TMS, CRM, email and other integrations depend on client authorization, available APIs and a separately agreed scope.",
    "Capabilities marked In Development, Custom Build or Planned on the website should not be treated as generally available.",
  ],
  faq: [
    {
      question: "Can AETHER-TRADE automate shipment-document follow-ups?",
      answer:
        "A bounded follow-up workflow can be assessed and piloted with agreed document lists, inbox access, approval controls and test cases. The live scope must be confirmed before use.",
    },
    {
      question: "Does this include customs clearance in the UAE?",
      answer:
        "No. AETHER-TRADE does not claim to act as a customs broker, clear shipments or connect to government customs systems through this page.",
    },
    {
      question: "Can our existing logistics systems be connected?",
      answer:
        "Potential integrations are assessed individually. They require client permission, compatible interfaces and a written scope; they are not assumed to be pre-built.",
    },
  ],
};

export const Route = createFileRoute("/uae-logistics-automation")({
  head: () => ({
    meta: [
      { title: "UAE Freight Forwarding & Trade Workflow Automation | AETHER-TRADE" },
      {
        name: "description",
        content:
          "Explore shipment document follow-ups, import-export hand-offs and logistics workflow automation for UAE-connected freight forwarders and trade teams.",
      },
      { property: "og:title", content: "UAE Trade & Logistics Workflow Automation | AETHER-TRADE" },
      {
        property: "og:description",
        content:
          "Scoped workflow automation for freight forwarders, importers, exporters and logistics teams connected to the UAE.",
      },
    ],
  }),
  component: UaeMarketPage,
});

function UaeMarketPage() {
  return <MarketPage content={content} />;
}
