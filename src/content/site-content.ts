/**
 * Default public-site content. Milestone 3 moves this into the CMS database;
 * until then pages read from here. Every capability carries an availability
 * status and engagement scope are explicit.
 */
import type { AvailabilityStatus } from "@/components/site/status-badge";

export interface Capability {
  title: string;
  body: string;
  status: AvailabilityStatus;
  points?: string[];
}

export const PLATFORM_MODULES: Capability[] = [
  {
    title: "Trade Case Architecture",
    body: "Each shipment or trade transaction becomes a structured case that holds its documents, extracted data, review notes and decisions.",
    status: "Custom Build",
    points: ["Case timeline", "Linked documents", "Reviewer notes"],
  },
  {
    title: "Document Intelligence",
    body: "Identifies common trade document types and extracts available fields for human review — invoices, packing lists, transport documents.",
    status: "Custom Build",
    points: ["Type identification", "Field extraction", "Confidence flags"],
  },
  {
    title: "Cross-Document Comparison",
    body: "Compares values across documents in a case and highlights mismatches such as quantities, weights, parties or totals.",
    status: "Custom Build",
    points: ["Mismatch highlighting", "Side-by-side evidence"],
  },
  {
    title: "Approval-Aware Workflow Engineering",
    body: "Routes flagged items to the right person and records who reviewed what, when and why — an evidence trail, not a black box.",
    status: "Custom Build",
    points: ["Assignments", "Audit trail", "Human sign-off"],
  },
  {
    title: "Workflow Automation",
    body: "Automates repetitive follow-ups, notifications and data hand-offs between your inbox, spreadsheets and business systems.",
    status: "Custom Build",
    points: ["Email triggers", "Scheduled follow-ups", "Hand-offs"],
  },
  {
    title: "Operational Dashboards & Reporting",
    body: "Summaries of case status, open exceptions and turnaround — built from your own operational data.",
    status: "Custom Build",
    points: ["Exception overview", "Turnaround views"],
  },
  {
    title: "Integrations",
    body: "Connections to email, spreadsheets, CRMs and accounting tools are scoped per engagement. No pre-built government or customs integrations are offered.",
    status: "Custom Build",
    points: ["Email", "Spreadsheets", "CRM / accounting (scoped)"],
  },
];

export const HOW_IT_WORKS_STEPS = [
  { title: "Discover", body: "We learn how your team handles shipments, documents and exceptions today, and where time is lost." },
  { title: "Scope", body: "Together we choose one or two high-value workflows and define what success looks like, in writing." },
  { title: "Configure", body: "We set up case structures, document types and checks for your operation — or build what's missing." },
  { title: "Pilot", body: "Your team uses it on real work with human review on every step. We measure against the agreed goals." },
  { title: "Expand", body: "Only after the pilot proves value do we extend to more workflows, teams or systems." },
];

export interface Solution {
  slug: string;
  title: string;
  audience: string;
  challenges: string[];
  helps: string[];
}

export const SOLUTIONS: Solution[] = [
  {
    slug: "importers",
    title: "Importers",
    audience: "Businesses receiving goods from international suppliers.",
    challenges: ["Supplier documents arrive in different formats", "Values that don't match the purchase order", "Chasing missing paperwork"],
    helps: ["Organize supplier documents per shipment", "Flag mismatches before goods arrive", "Automate document follow-ups"],
  },
  {
    slug: "exporters",
    title: "Exporters",
    audience: "Manufacturers and traders shipping to overseas buyers.",
    challenges: ["Preparing consistent document sets", "Buyer queries across email threads", "Manual re-keying of order data"],
    helps: ["Check document sets for consistency", "Structure buyer communication per order", "Reduce re-keying with extraction"],
  },
  {
    slug: "freight-forwarders",
    title: "Freight Forwarders",
    audience: "Forwarders coordinating many shipments for many clients.",
    challenges: ["High document volume per shipment", "Status requests from every client", "Exceptions buried in inboxes"],
    helps: ["Case-based shipment workspaces", "Automated status follow-ups", "Visible exception queues"],
  },
  {
    slug: "logistics-operators",
    title: "Logistics Operators",
    audience: "Warehousing, transport and 3PL teams.",
    challenges: ["Hand-offs between teams", "Inconsistent operational data", "Reporting assembled by hand"],
    helps: ["Structured hand-off workflows", "Data checks at intake", "Reporting from operational records"],
  },
  {
    slug: "trading-companies",
    title: "Trading Companies",
    audience: "Firms buying and selling across borders.",
    challenges: ["Many counterparties, many formats", "Invoice and packing list reconciliation", "Limited visibility across deals"],
    helps: ["Reconcile commercial documents", "Track counterparties per case", "One view of open exceptions"],
  },
];

export const INDUSTRIES = [
  { title: "Textiles & Apparel", body: "Multi-supplier orders, size and quantity breakdowns, frequent packing list variations." },
  { title: "Agriculture & Food", body: "Perishable timelines, certificates tied to specific consignments, seasonal volume spikes." },
  { title: "Industrial & Machinery", body: "High-value shipments, detailed specifications and serial-numbered items." },
  { title: "Consumer Goods", body: "Large SKU counts, repeat shipments and frequent buyer communication." },
  { title: "Chemicals & Materials", body: "Specification-heavy documentation where consistency across documents matters." },
  { title: "Electronics & Components", body: "Part-number accuracy, multiple consignees and tight delivery windows." },
];

export interface Service {
  title: string;
  body: string;
  status: AvailabilityStatus;
  deliverables: string[];
}

export const SERVICES: Service[] = [
  {
    title: "Operations Assessment",
    body: "A structured review of how documents, data and decisions move through your trade operations today.",
    status: "Available",
    deliverables: ["Workflow map", "Bottleneck findings", "Prioritized opportunities"],
  },
  {
    title: "Workflow Automation Build",
    body: "Design and build of automations for follow-ups, notifications, intake and data hand-offs.",
    status: "Custom Build",
    deliverables: ["Scoped specification", "Built automation", "Handover documentation"],
  },
  {
    title: "Custom AI Agents",
    body: "Task-specific assistants that draft, classify or summarize — always with human review before anything is sent or approved.",
    status: "Custom Build",
    deliverables: ["Agent design", "Review controls", "Pilot evaluation"],
  },
  {
    title: "Systems Integration",
    body: "Connecting email, spreadsheets, CRM and accounting tools you already use, scoped per engagement.",
    status: "Custom Build",
    deliverables: ["Integration plan", "Connectors", "Monitoring guidance"],
  },
  {
    title: "Pilot & Ongoing Support",
    body: "A measured pilot on real work, followed by optional support and iteration as your operation changes.",
    status: "Available",
    deliverables: ["Pilot plan", "Success measures", "Support arrangement"],
  },
];

export const FAQS = [
  { q: "Is AETHER-TRADE available today?", a: "AETHER-TRADE works as an automation engineering agency. We begin with an operations assessment and scope custom document-intelligence, workflow and integration projects to each client’s requirements." },
  { q: "Do you handle customs clearance?", a: "No. AETHER-TRADE is operations software and automation. We do not provide customs clearance, brokerage or legal advice, and we do not integrate with government systems." },
  { q: "Does AI make decisions on our shipments?", a: "No. AI assists with identifying, extracting and comparing information. A person reviews and approves every outcome." },
  { q: "Can we upload documents through the website?", a: "No. For your security we never accept trade documents through public forms. Documents are only shared within an agreed engagement." },
  { q: "Do we need to replace our existing systems?", a: "No. We work around the email, spreadsheets and tools you already use and connect to them where it makes sense." },
  { q: "How does an engagement start?", a: "With a conversation and a short operations assessment. From there we scope one workflow and pilot it before anything larger." },
  { q: "What size of business do you work with?", a: "Importers, exporters, forwarders and logistics teams that handle enough shipments for manual work to become a real cost." },
];

export const INSIGHTS = [
  { slug: "why-trade-documents-dont-match", title: "Why trade documents so often don't match", category: "Operations", excerpt: "A look at where quantity, weight and value mismatches usually come from — and how to catch them earlier." },
  { slug: "case-based-shipment-management", title: "Thinking in cases, not inboxes", category: "Workflows", excerpt: "Why organizing each shipment as a structured case changes how teams review, hand off and resolve issues." },
  { slug: "human-review-in-ai-workflows", title: "Where human review belongs in AI workflows", category: "AI in practice", excerpt: "Practical patterns for keeping people in control when automation handles the repetitive parts." },
];

export const PARTNERSHIP_TYPES = [
  { title: "Technology partners", body: "Software providers whose tools trade teams already use, where a connection would save manual work." },
  { title: "Implementation partners", body: "Consultancies and integrators who support trade and logistics businesses." },
  { title: "Industry associations", body: "Organizations that help members modernize operations and could co-host education." },
];

/** Careers publishing state — flipped by the CMS in Milestone 4. */
export const CAREERS = {
  published: false,
  openings: [] as { title: string; location: string; type: string }[],
};
