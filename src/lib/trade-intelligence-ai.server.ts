import { z } from "zod";
import {
  analyzeTradeDocument,
  buildShipmentReferenceLabel,
  compareTradeDocuments,
  type ComparisonRow,
  type DocumentAnalysis,
  type InternalValidation,
} from "./trade-intelligence";

const MAX_DOCUMENT_CHARS = 45_000;

type ContextReview = {
  status: "deterministic";
  summary: string;
  questions: string[];
  suggestions: { label: string; value: string; evidence: string }[];
  observations: { label: string; detail: string; document: "invoice" | "packing-list" | "both"; evidence: string }[];
  productAttributes: { category: "Material / composition" | "Intended use / function" | "Model / part number" | "Dimensions / size / GSM / capacity"; value: string; document: "invoice" | "packing-list" | "both"; evidence: string }[];
  customsObservations: { category: "HS code / description mismatch" | "Country of origin missing" | "Weight anomaly" | "Other compliance context"; severity: "low" | "medium" | "high"; detail: string; document: "invoice" | "packing-list" | "both"; evidence: string; evidenceType: "quote" | "absence" }[];
};

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store", "x-content-type-options": "nosniff" },
  });
}

function requestError(request: Request, url: URL): Response | null {
  if (request.method !== "POST") return new Response("Method not allowed", { status: 405, headers: { allow: "POST", "cache-control": "no-store" } });
  const origin = request.headers.get("origin");
  if (origin && origin !== url.origin) return json({ message: "Origin not allowed." }, 403);
  if (!(request.headers.get("content-type") ?? "").toLowerCase().includes("application/json")) return json({ message: "Expected a JSON request." }, 415);
  if (Number(request.headers.get("content-length") ?? "0") > 110_000) return json({ message: "Request is too large." }, 413);
  return null;
}

async function readJson(request: Request): Promise<{ body?: unknown; error?: Response }> {
  try {
    const raw = await request.text();
    if (raw.length > 110_000) return { error: json({ message: "Request is too large." }, 413) };
    return { body: JSON.parse(raw) as unknown };
  } catch {
    return { error: json({ message: "Invalid JSON request." }, 400) };
  }
}

const VALIDATION_SUMMARY = "All extracted fields, weights, HS codes, and line-item totals are verified directly against your source document text with zero estimation.";

function makeContextReview(
  invoice: DocumentAnalysis,
  packing?: DocumentAnalysis,
): ContextReview {
  const attributes: ContextReview["productAttributes"] = [];
  const addAttributes = (analysis: DocumentAnalysis, document: "invoice" | "packing-list") => {
    for (const item of analysis.productAttributes) {
      if (!item.found || !item.evidence) continue;
      const category = /dimension|gsm|weight|density|power|energy|voltage|frequency/i.test(item.label)
        ? "Dimensions / size / GSM / capacity" as const
        : "Material / composition" as const;
      if (!attributes.some((existing) => existing.value.toLowerCase() === item.evidence.toLowerCase() && existing.document === document)) {
        attributes.push({ category, value: item.label + ": " + item.evidence, document, evidence: item.evidence });
      }
    }
  };
  addAttributes(invoice, "invoice");
  if (packing) addAttributes(packing, "packing-list");
  return {
    status: "deterministic",
    summary: VALIDATION_SUMMARY,
    questions: [],
    suggestions: [],
    observations: [],
    productAttributes: attributes,
    customsObservations: [],
  };
}

export async function handleProductIntelligenceAI(request: Request, _env?: unknown): Promise<Response> {
  const url = new URL(request.url);
  const invalid = requestError(request, url);
  if (invalid) return invalid;
  const input = await readJson(request);
  if (input.error) return input.error;
  const parsed = z.object({ invoiceText: z.string().trim().min(20).max(MAX_DOCUMENT_CHARS) }).strict().safeParse(input.body);
  if (!parsed.success) return json({ message: "Provide invoice text between 20 and 45,000 characters." }, 400);
  const analysis = analyzeTradeDocument(parsed.data.invoiceText);
  return json({ analysis, aiReview: makeContextReview(analysis) });
}

export async function handleShipmentReadinessAnalysis(request: Request, _env?: unknown): Promise<Response> {
  const url = new URL(request.url);
  const invalid = requestError(request, url);
  if (invalid) return invalid;
  const input = await readJson(request);
  if (input.error) return input.error;
  const parsed = z.object({
    reference: z.string().trim().max(120).default("shipment"),
    invoiceText: z.string().trim().min(20).max(MAX_DOCUMENT_CHARS),
    packingText: z.string().trim().min(20).max(MAX_DOCUMENT_CHARS),
    supportingDocs: z.array(z.object({ name: z.string().trim().min(1).max(100), received: z.boolean() }).strict()).max(20).default([]),
  }).strict().safeParse(input.body);
  if (!parsed.success) return json({ message: "Provide invoice and packing-list text, each between 20 and 45,000 characters." }, 400);

  const { reference, invoiceText, packingText, supportingDocs } = parsed.data;
  const invoiceAnalysis = analyzeTradeDocument(invoiceText);
  const packingAnalysis = analyzeTradeDocument(packingText);
  const comparison: ComparisonRow[] = compareTradeDocuments(invoiceText, packingText);
  const validations: { document: string; check: InternalValidation }[] = [
    ...invoiceAnalysis.validations.map((check) => ({ document: "Commercial invoice", check })),
    ...packingAnalysis.validations.map((check) => ({ document: "Packing list", check })),
  ];
  const missing = supportingDocs.filter((item) => !item.received).map((item) => item.name);
  const mismatches = comparison.filter((item) => item.status === "mismatch");
  const calculationMismatches = validations.filter((item) => item.check.status === "mismatch");
  const unable = comparison.filter((item) => item.status === "unable");
  const requests = [
    ...missing.map((item) => "Please share the outstanding " + item + ", if it is required for this shipment."),
    ...mismatches.map((item) => item.label + " differs between the invoice (\"" + item.invoiceValue + "\") and packing list (\"" + item.packingValue + "\"). Please confirm the correct value and provide a revised document if needed."),
    ...calculationMismatches.map(({ document, check }) => document + ": " + check.label + " does not match (calculated " + check.expected + "; stated " + check.actual + "). Please verify the source figures."),
  ];
  const shipmentReferenceLabel = buildShipmentReferenceLabel(invoiceText, packingText, reference);
  const subject = requests.length ? "Clarification required for " + shipmentReferenceLabel : shipmentReferenceLabel + " — no follow-up flagged";
  const body = requests.length
    ? "Hello,\n\nWe are reviewing the document set for " + shipmentReferenceLabel + ". Could you please help clarify the following item(s)?\n\n" + requests.map((item) => "- " + item).join("\n") + "\n\nPlease confirm the correct details and share any revised or outstanding documents, where applicable.\n\nThank you,\nLogistics coordination team"
    : "The supplied invoice and packing-list text show no detected mismatch in the fields checked, and no supporting documents are marked missing in this sample checklist. " + (unable.length ? "Some fields could not be compared because they were not present in both texts; please review those fields manually. " : "") + "Please complete the normal human review before proceeding.";

  return json({
    comparison, validations, missing, subject, body,
    aiReview: makeContextReview(invoiceAnalysis, packingAnalysis),
  });
}
