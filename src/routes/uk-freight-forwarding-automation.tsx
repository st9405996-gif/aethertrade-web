import { createFileRoute } from "@tanstack/react-router";
import { MarketPage, type MarketPageContent } from "@/components/site/market-page";

const content: MarketPageContent = {
  market: "the United Kingdom",
  marketKey: "United Kingdom",
  eyebrow: "UK freight forwarding and trade operations",
  title: "Workflow Automation for UK Freight Forwarders and Import-Export Teams",
  description:
    "Organize shipment documents, customer follow-ups and operational hand-offs for teams coordinating freight and trade connected to the UK. AETHER-TRADE scopes workflow pilots around existing processes and approved systems.",
  audience:
    "For UK-connected freight forwarders, importers, exporters, 3PLs and logistics operations teams coordinating suppliers, customers, agents and carriers.",
  workflows: [
    {
      title: "Shipment document coordination",
      description:
        "Organize commercial invoices, packing lists and transport records around agreed shipment references, with missing information sent for staff review.",
    },
    {
      title: "Customer and agent follow-ups",
      description:
        "Track outstanding information and prepare consistent email drafts for an authorized coordinator to review before sending.",
    },
    {
      title: "Document discrepancy review",
      description:
        "Compare selected shipment and invoice fields, flag possible inconsistencies and keep the decision with the responsible operations professional.",
    },
    {
      title: "Operational case hand-offs",
      description:
        "Make pending work, ownership, approvals and follow-up history easier to review across documentation and customer-service teams.",
    },
  ],
  considerations: [
    "This page addresses businesses connected to the UK and does not claim a UK office, local staff or legal representation.",
    "AETHER-TRADE does not provide customs brokerage, customs declarations, HMRC services or regulatory determinations.",
    "Connections to email, ERP, TMS or CRM systems require client authorization, compatible interfaces and a separately agreed scope.",
    "Capabilities marked In Development, Custom Build or Planned are not represented as generally available.",
  ],
  faq: [
    {
      question: "Can UK freight forwarders use AETHER-TRADE with existing software?",
      answer:
        "Potential connections are assessed individually after reviewing the software, available interfaces, permissions and the proposed pilot. No integration is assumed until tested and agreed.",
    },
    {
      question: "Can it help with shipment document follow-ups?",
      answer:
        "A bounded workflow can track agreed document requirements and prepare follow-up drafts for staff approval. The exact scope must be confirmed against the team's process.",
    },
    {
      question: "Does it file customs declarations or connect to HMRC?",
      answer:
        "No. The service described here is document and workflow support, not customs filing, brokerage or an HMRC integration.",
    },
    {
      question: "How should a company start?",
      answer:
        "Start with one repeatable workflow, a small set of test cases, agreed success measures and a human review step before considering wider deployment.",
    },
  ],
};

export const Route = createFileRoute("/uk-freight-forwarding-automation")({
  head: () => ({
    links: [{ rel: "canonical", href: "https://aethertrade.cloud/uk-freight-forwarding-automation" }],
    meta: [
      { title: "UK Freight Workflow Automation | AETHER-TRADE" },
      {
        name: "description",
        content:
          "UK freight forwarding document workflows, shipment follow-ups and exception review. Scope a human-reviewed pilot with AETHER-TRADE.",
      },
      { property: "og:title", content: "UK Freight Workflow Automation | AETHER-TRADE" },
      {
        property: "og:description",
        content:
          "Document and shipment workflow support for UK-connected freight forwarders and trade teams.",
      },
    ],
  }),
  component: UkFreightPage,
});

function UkFreightPage() {
  return <MarketPage content={content} />;
}
