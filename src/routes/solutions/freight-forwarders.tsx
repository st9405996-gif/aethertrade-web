import { createFileRoute } from "@tanstack/react-router";
import { MarketPage, type MarketPageContent } from "@/components/site/market-page";

const content: MarketPageContent = {
  market: "freight forwarding operations",
  marketKey: "Freight Forwarders",
  eyebrow: "Freight forwarder workflow automation",
  title: "Document and Shipment Workflow Automation for Freight Forwarders",
  description:
    "Organize shipment document intake, compare key invoice and packing-list details, track missing information and prepare follow-ups for staff review. AETHER-TRADE scopes practical workflows around your team's existing process.",
  audience:
    "For freight forwarding companies, operations managers, documentation teams and customer-service teams handling recurring shipment files, customer requests and carrier or agent hand-offs.",
  workflows: [
    {
      title: "Shipment document intake",
      description:
        "Collect commercial invoices, packing lists and transport documents against an agreed shipment reference, then structure key fields for review.",
    },
    {
      title: "Missing-document follow-up",
      description:
        "Track which agreed documents or details are outstanding and prepare consistent follow-up drafts for an authorized coordinator to approve.",
    },
    {
      title: "Invoice and packing-list comparison",
      description:
        "Compare selected fields such as references, quantities, weights and party details, surfacing possible differences for human review.",
    },
    {
      title: "Operations hand-offs",
      description:
        "Keep case status, unresolved questions, ownership and follow-up history organized across documentation and customer-service teams.",
    },
  ],
  considerations: [
    "The page describes workflow use cases, not a claim that AETHER-TRADE replaces a freight-forwarding or transport-management system.",
    "Document checks identify possible gaps or inconsistencies; they do not certify documents or make customs or regulatory decisions.",
    "Email, ERP, TMS and CRM connections require client authorization, compatible interfaces and a separately agreed scope.",
    "Each engagement begins with a bounded workflow, sample or authorized test data, human review and agreed success measures.",
  ],
  faq: [
    {
      question: "What can freight-forwarding teams automate first?",
      answer:
        "A focused starting point is usually one repeatable task such as document intake, missing-item follow-up or selected invoice and packing-list comparisons. The best first workflow depends on its volume, exception rate and available data.",
    },
    {
      question: "Does AETHER-TRADE replace our freight-forwarding software?",
      answer:
        "No. The intended role is to assess and automate selected document or coordination tasks around existing systems where technically and commercially feasible.",
    },
    {
      question: "Can the system send customer emails automatically?",
      answer:
        "A pilot can prepare follow-up drafts and route them for staff approval. Any automated sending requires an explicitly agreed scope, permissions and safeguards.",
    },
    {
      question: "Does it perform customs clearance or submit declarations?",
      answer:
        "No. AETHER-TRADE does not claim to clear shipments, submit customs declarations or connect to government customs systems.",
    },
  ],
};

export const Route = createFileRoute("/solutions/freight-forwarders")({
  head: () => ({
    links: [{ rel: "canonical", href: "https://aethertrade.cloud/solutions/freight-forwarders" }],
    meta: [
      { title: "Freight Forwarder Workflow Automation | AETHER-TRADE" },
      {
        name: "description",
        content:
          "Freight forwarding document intake, shipment follow-ups and invoice checks with human review. Scope a practical workflow pilot.",
      },
      { property: "og:title", content: "Freight Forwarder Workflow Automation | AETHER-TRADE" },
      {
        property: "og:description",
        content:
          "Organize shipment documents, identify possible discrepancies and coordinate follow-ups with staff review.",
      },
    ],
  }),
  component: FreightForwardersPage,
});

function FreightForwardersPage() {
  return <MarketPage content={content} />;
}
