import { compareTradeDocuments } from "./trade-intelligence";
export const SHIPMENT_READINESS_SCENARIOS = [
  { id: "quantity-mismatch", title: "Quantity mismatch", summary: "Compare the invoice quantity with the packing-list quantity." },
  { id: "missing-document", title: "Missing document", summary: "Check a sample document set against a team-defined checklist." },
  { id: "conflicting-details", title: "Conflicting shipment details", summary: "Compare package counts stated in two sample documents." },
] as const;
export type ShipmentReadinessScenarioId = (typeof SHIPMENT_READINESS_SCENARIOS)[number]["id"];
export type ShipmentReadinessFinding = {
  id: string; label: string; status: "mismatch" | "missing";
  evidence: { document: string; value: string }[]; detail: string;
};
export type ShipmentReadinessDemoResult = {
  scenarioId: ShipmentReadinessScenarioId; title: string; summary: string;
  documents: { name: string; content: string; received: boolean }[];
  findings: ShipmentReadinessFinding[]; riskNote: string; explanation: string;
  questions: string[]; aiStatus: "ai" | "fallback";
};
const lines = (...values: string[]) => values.join("\n");
const samples: Record<ShipmentReadinessScenarioId, Omit<ShipmentReadinessDemoResult, "scenarioId" | "aiStatus">> = {
  "quantity-mismatch": {
    title: "Quantity mismatch",
    summary: "The sample invoice and packing list state different quantities.",
    documents: [
      { name: "Commercial Invoice", received: true, content: lines("COMMERCIAL INVOICE", "Invoice No: DEMO-1001", "Exporter: Northstar Components Ltd.", "Importer: Harborline Trading FZE", "Goods Description: Industrial valve assemblies", "Quantity: 100 units") },
      { name: "Packing List", received: true, content: lines("PACKING LIST", "Invoice No: DEMO-1001", "Exporter: Northstar Components Ltd.", "Importer: Harborline Trading FZE", "Goods Description: Industrial valve assemblies", "Quantity: 98 units") },
    ],
    findings: [],
    riskNote: "If this difference is not resolved, it may prompt clarification or delay processing, depending on the shipment and the requirements that apply.",
    explanation: "The Commercial Invoice records 100 units, while the Packing List records 98 units. These sample values do not match. A coordinator should confirm the correct quantity and arrange for the relevant document to be corrected before the file moves forward.",
    questions: ["Which quantity is supported by the final order and physical packing record?", "Should the invoice or packing list be corrected after the responsible team confirms the quantity?"],
  },
  "missing-document": {
    title: "Missing document",
    summary: "One item in this fictional checklist is marked as not received.",
    documents: [
      { name: "Commercial Invoice", received: true, content: "Included in this fictional sample set." },
      { name: "Packing List", received: true, content: "Included in this fictional sample set." },
      { name: "Bill of Lading", received: true, content: "Included in this fictional sample set." },
      { name: "Certificate of Origin", received: false, content: "Not supplied in this sample." },
    ],
    findings: [{
      id: "certificate-of-origin", label: "Certificate of Origin", status: "missing",
      evidence: [{ document: "Sample document checklist", value: "Required in this sample; not received" }],
      detail: "The sample checklist marks the Certificate of Origin as required, but it is not included in the supplied sample set.",
    }],
    riskNote: "If this document is required for the particular shipment, its absence may lead to follow-up or delay, depending on the destination, transaction and applicable requirements.",
    explanation: "The sample checklist marks the Certificate of Origin as required, but the sample set does not include it. This is a checklist exception only; document requirements must be confirmed for the actual shipment and destination.",
    questions: ["Has the Certificate of Origin been issued, or is it still pending?", "Has the responsible trade team confirmed that this document is required for this shipment?"],
  },
  "conflicting-details": {
    title: "Conflicting shipment details",
    summary: "The sample documents show different package counts.",
    documents: [
      { name: "Commercial Invoice", received: true, content: lines("COMMERCIAL INVOICE", "Invoice No: DEMO-3003", "Goods Description: Household storage containers", "Packages: 120 cartons") },
      { name: "Packing List", received: true, content: lines("PACKING LIST", "Invoice No: DEMO-3003", "Goods Description: Household storage containers", "Packages: 118 cartons") },
    ],
    findings: [],
    riskNote: "Different package counts may require clarification or document rework, depending on the shipment and the requirements that apply.",
    explanation: "The Commercial Invoice states 120 cartons, while the Packing List states 118 cartons. The sample package counts conflict. A coordinator should verify the count against the packing record and confirm which document, if any, needs correction.",
    questions: ["What package count is confirmed by the final packing record?", "Do the shipping instructions and transport documents reflect the same confirmed count?"],
  },
};
export function buildShipmentReadinessScenario(scenarioId: ShipmentReadinessScenarioId): ShipmentReadinessDemoResult {
  const sample = samples[scenarioId];
  let findings = sample.findings;
  if (scenarioId === "quantity-mismatch" || scenarioId === "conflicting-details") {
    const invoice = sample.documents.find((document) => document.name === "Commercial Invoice");
    const packing = sample.documents.find((document) => document.name === "Packing List");
    if (!invoice || !packing) throw new Error("The fictional sample documents are incomplete.");
    const key = scenarioId === "quantity-mismatch" ? "quantity" : "packages";
    const row = compareTradeDocuments(invoice.content, packing.content).find((candidate) => candidate.key === key);
    if (!row || row.status !== "mismatch") throw new Error("The deterministic sample comparison did not find its expected mismatch.");
    findings = [{
      id: key, label: row.label, status: "mismatch",
      evidence: [{ document: invoice.name, value: row.invoiceValue }, { document: packing.name, value: row.packingValue }],
      detail: invoice.name + " and " + packing.name + " contain different " + row.label.toLowerCase() + " values.",
    }];
  }
  return { scenarioId, ...sample, findings, aiStatus: "fallback" };
}
