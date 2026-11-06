/**
 * Static public-site fallback content and seed data for the demo workspace.
 * Public routes use published CMS records when available and retain intentional
 * route-specific static content.
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
    title: "Trade Operations & Workflow Assessment",
    body: "Map how shipments, customer requests, data and approvals move through your import-export or logistics operation, then identify the best automation opportunities.",
    status: "Available",
    deliverables: ["Current-state workflow map", "Bottleneck and risk review", "Prioritized automation roadmap"],
  },
  {
    title: "Freight Forwarding & Shipment Operations Automation",
    body: "Custom workflows for shipment milestones, status enquiries, agent coordination, exception handling, hand-offs and customer updates.",
    status: "Custom Build",
    deliverables: ["Shipment milestone workflows", "Exception and escalation routing", "Customer update automation"],
  },
  {
    title: "Import-Export & Trade Workflow Automation",
    body: "Automate repeatable work across purchase orders, suppliers, buyers, bookings, shipment coordination, approvals and operational hand-offs.",
    status: "Custom Build",
    deliverables: ["Process-specific workflow design", "System and inbox integrations", "Tested automation with handover"],
  },
  {
    title: "Document Intelligence & Processing",
    body: "Classify trade documents, extract structured fields, compare related records and flag missing or inconsistent information for human review.",
    status: "Custom Build",
    deliverables: ["Document intake and classification", "Field extraction and validation", "Exception queues and review workpapers"],
  },
  {
    title: "Custom AI Agents & Assistants",
    body: "Purpose-built agents for operations, customer support, sales coordination, research, reporting and internal knowledge workflows, with clear approval boundaries.",
    status: "Custom Build",
    deliverables: ["Agent and tool design", "Human approval and access controls", "Evaluation, monitoring and handover"],
  },
  {
    title: "Business Process & Back-Office Automation",
    body: "Automate repetitive tasks across email, CRM, spreadsheets, finance operations, procurement, customer onboarding and internal service processes.",
    status: "Custom Build",
    deliverables: ["Process mapping", "Automated triggers and actions", "Exception handling and audit trail"],
  },
  {
    title: "Systems Integration & Data Workflows",
    body: "Connect approved email, CRM, ERP, accounting, spreadsheets, shared drives and third-party APIs where access and documentation permit.",
    status: "Custom Build",
    deliverables: ["Integration plan", "Configured API or application connections", "Monitoring and failure handling"],
  },
  {
    title: "Dashboards, Reporting & Operational Analytics",
    body: "Turn approved operational data into recurring reports, workload visibility, shipment summaries and exception dashboards.",
    status: "Custom Build",
    deliverables: ["KPI and reporting specification", "Automated reporting workflow", "Dashboard and data-quality checks"],
  },
  {
    title: "Pilot, Deployment & Ongoing Support",
    body: "Validate a scoped workflow with your team, deploy it in an agreed environment and improve it based on measured results.",
    status: "Available",
    deliverables: ["Pilot plan and success measures", "Deployment and team handover", "Optional maintenance and iteration"],
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
