/**
 * Static catalogue preview used on the homepage before the CMS-backed
 * catalogue (Milestone 4) replaces it. Content mirrors the launch plan:
 * availability statuses are explicit and nothing planned is presented as live.
 */
import type { AvailabilityStatus } from "@/components/site/status-badge";

export interface CatalogueItem {
  slug: string;
  name: string;
  category: string;
  problem: string;
  whatItDoes: string;
  exampleWorkflow: string;
  integrations: string[];
  deploymentModel: string;
  availability: AvailabilityStatus;
}

export const CATALOGUE_CATEGORIES = [
  "Email & Inquiry Automation",
  "Shipment Follow-Up",
  "Document Processing",
  "Invoice Reconciliation",
  "CRM & Customer Coordination",
  "Supplier & Buyer Communication",
  "Business Reporting",
  "Custom AI Agents",
  "Custom Business Workflows",
] as const;

export const CATALOGUE_PREVIEW: CatalogueItem[] = [
  {
    slug: "inquiry-triage-automation",
    name: "Inquiry Triage & Routing",
    category: "Email & Inquiry Automation",
    problem:
      "Inquiries arrive across inboxes and forms, and response quality depends on whoever sees them first.",
    whatItDoes:
      "Captures new inquiries, classifies them by topic and business type, and routes them to the right team with a structured summary.",
    exampleWorkflow:
      "New inquiry → classification → internal routing with context → acknowledgement to the sender.",
    integrations: ["Email (IMAP/SMTP)", "CRM", "Team chat"],
    deploymentModel: "Managed environment",
    availability: "Custom Build",
  },
  {
    slug: "shipment-follow-up-automation",
    name: "Shipment Follow-Up Assistant",
    category: "Shipment Follow-Up",
    problem:
      "Chasing document and status updates from suppliers, forwarders and customers is repetitive and easy to miss.",
    whatItDoes:
      "Tracks open document and status requests and prepares polite, structured follow-up messages for your team to approve and send.",
    exampleWorkflow:
      "Open request detected → follow-up prepared → human approval → sent and logged on the case.",
    integrations: ["Email (IMAP/SMTP)", "Shared inbox", "Case tracker"],
    deploymentModel: "Managed environment",
    availability: "Custom Build",
  },
  {
    slug: "document-intake-workflow",
    name: "Trade Document Intake & Structuring",
    category: "Document Processing",
    problem:
      "Commercial invoices, packing lists and transport documents arrive as attachments that someone must read and re-key.",
    whatItDoes:
      "Identifies document types, extracts available fields and organizes shipment information into a structured case view.",
    exampleWorkflow:
      "Documents received → type detection → field extraction → structured case → exception flags for reviewers.",
    integrations: ["Email (IMAP/SMTP)", "Shared drives", "Custom API"],
    deploymentModel: "Managed or client-owned environment",
    availability: "Custom Build",
  },
  {
    slug: "invoice-packing-list-reconciliation",
    name: "Invoice & Packing List Reconciliation",
    category: "Invoice Reconciliation",
    problem:
      "Cross-checking invoices against packing lists and transport documents line by line is slow and error-prone.",
    whatItDoes:
      "Compares key values across document sets, highlights missing or conflicting entries and produces an evidence-backed review workpaper.",
    exampleWorkflow:
      "Document set linked → cross-document comparison → mismatches flagged with references → human review.",
    integrations: ["ERP", "Email (IMAP/SMTP)", "Custom API"],
    deploymentModel: "Managed or client-owned environment",
    availability: "Custom Build",
  },
  {
    slug: "reporting-automation",
    name: "Operations Reporting Automation",
    category: "Business Reporting",
    problem:
      "Operational reporting is assembled by hand from exports, so leadership sees stale numbers.",
    whatItDoes:
      "Compiles recurring operational reports from approved sources on a schedule your team defines.",
    exampleWorkflow:
      "Scheduled run → data compiled from approved sources → report prepared → distribution list notified.",
    integrations: ["ERP", "Spreadsheets", "Email (IMAP/SMTP)"],
    deploymentModel: "Managed environment",
    availability: "Custom Build",
  },
  {
    slug: "custom-ai-agent",
    name: "Custom AI Agent for Your Workflow",
    category: "Custom AI Agents",
    problem:
      "Some workflows are unique to your business and no off-the-shelf automation fits them.",
    whatItDoes:
      "A purpose-built agent designed with you around your documents, systems and approval rules — scoped, built and tested with your team.",
    exampleWorkflow:
      "Requirement intake → discovery and scope → build and test → deployment with human approval points.",
    integrations: ["Agreed during scoping"],
    deploymentModel: "Managed or client-owned environment",
    availability: "Custom Build",
  },
];
