import { useEffect, useMemo, useState } from "react";
import { CheckCircle2, CircleAlert, FileText, Loader2, Mail, ShieldCheck, Sparkles, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ProductDemoNextStep } from "@/components/site/product-demo-next-step";
import { buildShipmentReadinessScenario, SHIPMENT_READINESS_SCENARIOS, type ShipmentReadinessDemoResult, type ShipmentReadinessScenarioId } from "@/lib/shipment-readiness-demo";
import { analyzeTradeDocument, compareTradeDocuments, type ComparisonRow, type InternalValidation } from "@/lib/trade-intelligence";

const stages = ["Reading document text", "Comparing shipment details", "Preparing follow-up draft"];
const initialSupportingDocs = [
  { name: "Bill of lading", received: false },
  { name: "Certificate of origin", received: false },
];

type GroqReview = {
  status: "ai" | "fallback";
  model: string;
  summary: string;
  questions: string[];
  suggestions: { label: string; value: string; evidence: string }[];
  observations: { label: string; detail: string; document: "invoice" | "packing-list" | "both"; evidence: string }[];
};

type OwnResult = {
  aiReview: GroqReview;
  comparison: ComparisonRow[];
  missing: string[];
  subject: string;
  body: string;
  validations: { document: string; check: InternalValidation }[];
};

function renderEvidenceLine(line: string, values: string[]) {
  const candidates = values.filter(Boolean).sort((a, b) => b.length - a.length);
  if (!candidates.length) return line;
  const parts: { text: string; highlighted: boolean }[] = [];
  let remaining = line;
  while (remaining.length) {
    let matchIndex = -1;
    let matchValue = "";
    for (const value of candidates) {
      const index = remaining.indexOf(value);
      if (index !== -1 && (matchIndex === -1 || index < matchIndex)) {
        matchIndex = index;
        matchValue = value;
      }
    }
    if (matchIndex === -1) {
      parts.push({ text: remaining, highlighted: false });
      break;
    }
    if (matchIndex > 0) parts.push({ text: remaining.slice(0, matchIndex), highlighted: false });
    parts.push({ text: matchValue, highlighted: true });
    remaining = remaining.slice(matchIndex + matchValue.length);
  }
  return parts.map((part, index) => part.highlighted
    ? <mark key={index} className="rounded bg-amber-300/40 px-0.5 font-semibold text-foreground ring-1 ring-amber-500/40 dark:bg-amber-400/20">{part.text}</mark>
    : <span key={index}>{part.text}</span>);
}

function makeFindingDraft(reference: string, findings: string[]) {
  const subject = `Clarification required for shipment ${reference}`;
  const body = `Hello,\n\nWe are reviewing the document set for shipment ${reference}. Could you please help clarify the following item(s)?\n\n${findings.map((item) => `- ${item}`).join("\n")}\n\nPlease confirm the correct details and share any revised or outstanding documents, where applicable.\n\nThank you,\nLogistics coordination team`;
  return { subject, body };
}

export function ShipmentReadinessDemo() {
  const [mode, setMode] = useState<"sample" | "own">("sample");
  const [scenarioId, setScenarioId] = useState<ShipmentReadinessScenarioId>("quantity-mismatch");
  const [result, setResult] = useState<ShipmentReadinessDemoResult | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [stage, setStage] = useState(0);
  const [monthlyVolume, setMonthlyVolume] = useState("");
  const [reference, setReference] = useState("SHIPMENT-2048");
  const [invoiceText, setInvoiceText] = useState("");
  const [packingText, setPackingText] = useState("");
  const [invoiceFile, setInvoiceFile] = useState("");
  const [packingFile, setPackingFile] = useState("");
  const [supportingDocs, setSupportingDocs] = useState(initialSupportingDocs);
  const [ownResult, setOwnResult] = useState<OwnResult | null>(null);
  const [error, setError] = useState("");

  const selectedScenario = useMemo(() => buildShipmentReadinessScenario(scenarioId), [scenarioId]);
  useEffect(() => {
    if (!analyzing) { setStage(0); return; }
    const timer = window.setInterval(() => setStage((current) => Math.min(current + 1, stages.length - 1)), 550);
    return () => window.clearInterval(timer);
  }, [analyzing]);

  async function analyzeSample() {
    const deterministicResult = buildShipmentReadinessScenario(scenarioId);
    setResult(null);
    setAnalyzing(true);
    try {
      const response = await fetch("/api/demo/shipment-readiness", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ scenarioId }),
      });
      if (!response.ok) throw new Error("Demo explanation is unavailable.");
      const payload = (await response.json()) as ShipmentReadinessDemoResult;
      if (payload.scenarioId !== scenarioId || !Array.isArray(payload.findings) ||
          typeof payload.explanation !== "string" || !Array.isArray(payload.questions)) {
        throw new Error("Unexpected demo response.");
      }
      setResult(payload);
    } catch {
      setResult(deterministicResult);
    } finally {
      setAnalyzing(false);
    }
  }

  async function loadTextFile(file: File | undefined, kind: "invoice" | "packing") {
    if (!file) return;
    if (file.size > 1_000_000) {
      setError("Each text file must be smaller than 1 MB.");
      return;
    }
    if (!/\.(txt|csv)$/i.test(file.name)) {
      setError("This MVP accepts .txt or .csv text exports only. PDF/OCR processing is not connected yet.");
      return;
    }
    const text = await file.text();
    if (kind === "invoice") {
      setInvoiceText(text);
      setInvoiceFile(file.name);
    } else {
      setPackingText(text);
      setPackingFile(file.name);
    }
    setError("");
    setOwnResult(null);
  }

  async function analyzeOwnShipment() {
    if (invoiceText.trim().length < 20 || packingText.trim().length < 20) {
      setError("Add at least 20 characters of invoice text and packing-list text before analysis.");
      setOwnResult(null);
      return;
    }
    const invoiceAnalysis = analyzeTradeDocument(invoiceText);
    const packingAnalysis = analyzeTradeDocument(packingText);
    const comparison = compareTradeDocuments(invoiceText, packingText);
    const validations = [
      ...invoiceAnalysis.validations.map((check) => ({ document: "Commercial invoice", check })),
      ...packingAnalysis.validations.map((check) => ({ document: "Packing list", check })),
    ];
    const missing = supportingDocs.filter((item) => !item.received).map((item) => item.name);
    const mismatches = comparison.filter((item) => item.status === "mismatch");
    const calculationMismatches = validations.filter((item) => item.check.status === "mismatch");
    const unable = comparison.filter((item) => item.status === "unable");
    const requests = [
      ...missing.map((item) => `Please share the outstanding ${item}, if it is required for this shipment.`),
      ...mismatches.map((item) => `${item.label} differs between the invoice ("${item.invoiceValue}") and packing list ("${item.packingValue}"). Please confirm the correct value and provide a revised document if needed.`),
      ...calculationMismatches.map(({ document, check }) => `${document}: ${check.label} does not match (calculated ${check.expected}; stated ${check.actual}). Please verify the source figures.`),
    ];
    const draft = requests.length
      ? makeFindingDraft(reference.trim() || "shipment", requests)
      : { subject: `Shipment ${reference.trim() || "review"} — no follow-up flagged`, body: `The supplied invoice and packing-list text show no detected mismatch in the fields checked, and no supporting documents are marked missing in this sample checklist. ${unable.length ? "Some fields could not be compared because they were not present in both texts; please review those fields manually. " : ""}Please complete the normal human review before proceeding.` };
    const fallbackResult: OwnResult = {
      comparison, missing, validations, ...draft,
      aiReview: {
        status: "fallback",
        model: "Deterministic rules only",
        summary: "Groq AI could not be reached. Document matching, calculations and the follow-up draft are based on the rules engine.",
        questions: [],
        suggestions: [],
        observations: [],
      },
    };
    setError("");
    setOwnResult(null);
    setAnalyzing(true);
    try {
      const response = await fetch("/api/demo/shipment-readiness-analysis", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ reference, invoiceText, packingText, supportingDocs }),
      });
      if (!response.ok) throw new Error("Groq shipment review unavailable");
      const payload = await response.json() as OwnResult;
      if (!Array.isArray(payload.comparison) || !Array.isArray(payload.validations) ||
          !Array.isArray(payload.missing) || !payload.aiReview || typeof payload.subject !== "string" ||
          typeof payload.body !== "string") {
        throw new Error("Unexpected shipment review response");
      }
      setOwnResult(payload);
    } catch {
      setOwnResult(fallbackResult);
    } finally {
      setAnalyzing(false);
    }
  }

  const sampleDraftItems = result
    ? result.findings.map((finding) => `${finding.label}: ${finding.detail}`)
    : [];
  const sampleDraft = sampleDraftItems.length
    ? makeFindingDraft("SAMPLE-" + (result?.scenarioId ?? "shipment"), sampleDraftItems)
    : null;

  return (
    <section id="interactive-demo" className="container-page section-pad scroll-mt-24">
      <div className="mx-auto max-w-6xl">
        <div className="max-w-3xl">
          <p className="eyebrow">Shipment follow-up workbench</p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight">One shipment review. One connected workflow.</h2>
          <p className="mt-3 text-muted-foreground">Add document text, review the extracted comparison and missing items, then inspect a follow-up draft in the same workspace. A person remains responsible for the final review and communication.</p>
        </div>

        <div className="mt-6 flex flex-wrap gap-2" role="tablist" aria-label="Shipment workflow mode">
          <button type="button" role="tab" aria-selected={mode === "sample"} onClick={() => { setMode("sample"); setError(""); setOwnResult(null); }}
            className={`rounded-full border px-4 py-2 text-sm font-medium ${mode === "sample" ? "border-primary bg-primary/10 text-primary" : "border-border bg-card text-muted-foreground"}`}>
            Explore guided sample
          </button>
          <button type="button" role="tab" aria-selected={mode === "own"} onClick={() => { setMode("own"); setError(""); setResult(null); }}
            className={`rounded-full border px-4 py-2 text-sm font-medium ${mode === "own" ? "border-primary bg-primary/10 text-primary" : "border-border bg-card text-muted-foreground"}`}>
            Review my document text
          </button>
        </div>

        {mode === "sample" ? (
          <div className="mt-4 rounded-2xl border border-border bg-card p-4 sm:p-6">
            <div className="flex flex-wrap gap-2">
              {SHIPMENT_READINESS_SCENARIOS.map((scenario, index) => (
                <button key={scenario.id} type="button" aria-pressed={scenario.id === scenarioId} disabled={analyzing}
                  onClick={() => { setScenarioId(scenario.id); setResult(null); }}
                  className={`rounded-lg border px-3 py-2 text-left text-sm ${scenario.id === scenarioId ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"}`}>
                  <span className="block text-[10px] uppercase tracking-wide text-muted-foreground">Scenario 0{index + 1}</span>
                  <span className="font-medium">{scenario.title}</span>
                </button>
              ))}
            </div>
            <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
              <div><h3 className="font-semibold">Sample document set</h3><p className="text-sm text-muted-foreground">Fictional documents for demonstration only.</p></div>
              <Button onClick={analyzeSample} disabled={analyzing}>
                {analyzing ? <Loader2 className="animate-spin" /> : <Sparkles />}
                {analyzing ? "Reviewing shipment…" : "Analyze shipment"}
              </Button>
            </div>
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              {selectedScenario.documents.map((document) => (
                <div key={document.name} className="flex items-center justify-between gap-3 rounded-lg border border-border px-3 py-2 text-sm">
                  <span className="flex min-w-0 items-center gap-2"><FileText className="size-4 shrink-0 text-primary" /><span className="truncate">{document.name}</span></span>
                  <span className={`shrink-0 rounded-full px-2 py-1 text-xs ${document.received ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300" : "bg-amber-500/10 text-amber-700 dark:text-amber-300"}`}>{document.received ? "Included" : "Missing"}</span>
                </div>
              ))}
            </div>
            <details className="mt-3 rounded-lg border border-border px-3 py-2">
              <summary className="cursor-pointer text-sm font-medium">View sample documents line by line</summary>
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                {selectedScenario.documents.map((document) => (
                  <div key={document.name} className="min-w-0">
                    <p className="text-xs font-semibold">{document.name}</p>
                    <div className="mt-2 overflow-hidden rounded-lg bg-muted/50 p-3 font-mono text-xs leading-6">
                      {document.content.split("\n").map((line, lineIndex) => {
                        const evidenceValues = result?.findings.flatMap((finding) =>
                          finding.evidence.filter((item) => item.document === document.name).map((item) => item.value)
                        ) ?? [];
                        return <div key={lineIndex} className="grid grid-cols-[2rem_minmax(0,1fr)] gap-2 break-words">
                          <span className="select-none text-right text-muted-foreground/60">{lineIndex + 1}</span>
                          <span>{renderEvidenceLine(line, evidenceValues)}</span>
                        </div>;
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </details>
            {result && (
              <div className="mt-5 space-y-4" aria-live="polite">
                <div className="rounded-xl border border-border p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2"><div><p className="eyebrow">Shipment findings</p><h3 className="text-lg font-semibold">{result.title}</h3></div><span className="rounded-full bg-amber-500/10 px-3 py-1 text-xs text-amber-700 dark:text-amber-300">Human review needed</span></div>
                  {result.findings.map((finding) => (
                    <article key={finding.id} className="mt-3 rounded-lg bg-muted/30 p-3">
                      <div className="flex items-start gap-2"><CircleAlert className="mt-0.5 size-4 shrink-0 text-amber-600" /><div><p className="text-sm font-semibold">{finding.label}: {finding.status}</p><p className="mt-1 text-sm text-muted-foreground">{finding.detail}</p></div></div>
                      <div className="mt-2 grid gap-2 sm:grid-cols-2">{finding.evidence.map((item) => <div key={item.document} className="rounded-md bg-background p-2 text-xs"><span className="text-muted-foreground">{item.document}</span><p className="mt-1 font-medium">{item.value}</p></div>)}</div>
                    </article>
                  ))}
                  <div className="mt-3 rounded-lg bg-muted/40 p-3"><p className="text-sm font-semibold">{result.aiStatus === "ai" ? "AI explanation" : "Rule-based explanation"}</p><p className="mt-1 text-sm leading-6 text-muted-foreground">{result.explanation}</p><p className="mt-3 text-sm font-semibold">Clarification questions</p><ul className="mt-1 list-disc space-y-1 pl-5 text-sm text-muted-foreground">{result.questions.map((question) => <li key={question}>{question}</li>)}</ul><p className="mt-3 text-xs text-muted-foreground">Potential operational impact: {result.riskNote}</p></div>
                </div>
                <div className="rounded-xl border border-primary/20 bg-primary/5 p-4">
                  <div className="flex items-center gap-2"><Mail className="size-4 text-primary" /><h3 className="font-semibold">Follow-up email draft</h3></div>
                  {sampleDraft ? <><p className="mt-3 text-xs text-muted-foreground">Subject</p><p className="text-sm font-medium">{sampleDraft.subject}</p><textarea readOnly value={sampleDraft.body} rows={7} className="mt-2 w-full rounded-lg border border-input bg-background p-3 text-sm leading-6" /></> : <p className="mt-2 text-sm text-muted-foreground">No exception was returned that requires a follow-up draft in this sample.</p>}
                  <p className="mt-2 flex items-start gap-2 text-xs text-muted-foreground"><ShieldCheck className="size-4 shrink-0" />Draft only. Review and approve it before using it; this demo does not send email.</p>
                </div>
                <div className="rounded-xl border border-border p-4">
                  <label className="grid max-w-sm gap-2 text-sm font-medium">Monthly shipment volume
                    <select className="h-10 rounded-md border border-input bg-background px-3 font-normal" value={monthlyVolume} onChange={(event) => setMonthlyVolume(event.target.value)}>
                      <option value="">Select monthly volume</option><option value="1–10">1–10</option><option value="11–50">11–50</option><option value="51–100">51–100</option><option value="101+">100+ (101 or more)</option>
                    </select>
                  </label>
                  <p className="mt-2 text-xs text-muted-foreground">You can include this estimate when you continue to the demo request.</p>
                </div>
                <div className="mt-4">
                  <ProductDemoNextStep automation="shipment-readiness" shipmentVolume={monthlyVolume || undefined} requireShipmentVolume />
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="mt-4 grid gap-4 lg:grid-cols-[1.05fr_0.95fr]">
            <div className="rounded-2xl border border-border bg-card p-4 sm:p-6">
              <div><p className="eyebrow">Your shipment</p><h3 className="text-lg font-semibold">Add invoice and packing-list text</h3></div>
              <label className="mt-4 grid gap-2 text-sm font-medium">Shipment reference
                <input value={reference} onChange={(event) => { setReference(event.target.value); setOwnResult(null); }} className="h-10 rounded-md border border-input bg-background px-3" />
              </label>
              <div className="mt-4 grid gap-4">
                <div className="grid gap-2 text-sm font-medium">
                  <label htmlFor="shipment-invoice-text">Commercial invoice</label>
                  <textarea id="shipment-invoice-text" value={invoiceText} onChange={(event) => { setInvoiceText(event.target.value); setOwnResult(null); }} rows={7} className="w-full rounded-lg border border-input bg-background p-3 text-sm font-normal leading-6" placeholder="Paste invoice text here…" />
                  <div className="flex flex-wrap items-center gap-2 text-xs font-normal text-muted-foreground"><Upload className="size-3" /><label className="cursor-pointer underline underline-offset-2">Upload .txt or .csv text export
                    <input type="file" accept=".txt,.csv,text/plain,text/csv" className="sr-only" onChange={(event) => void loadTextFile(event.target.files?.[0], "invoice")} />
                  </label>{invoiceFile && <span>{invoiceFile}</span>}</div>
                </div>
                <div className="grid gap-2 text-sm font-medium">
                  <label htmlFor="shipment-packing-text">Packing list</label>
                  <textarea id="shipment-packing-text" value={packingText} onChange={(event) => { setPackingText(event.target.value); setOwnResult(null); }} rows={7} className="w-full rounded-lg border border-input bg-background p-3 text-sm font-normal leading-6" placeholder="Paste packing-list text here…" />
                  <div className="flex flex-wrap items-center gap-2 text-xs font-normal text-muted-foreground"><Upload className="size-3" /><label className="cursor-pointer underline underline-offset-2">Upload .txt or .csv text export
                    <input type="file" accept=".txt,.csv,text/plain,text/csv" className="sr-only" onChange={(event) => void loadTextFile(event.target.files?.[0], "packing")} />
                  </label>{packingFile && <span>{packingFile}</span>}</div>
                </div>
              </div>
              <div className="mt-4 rounded-lg border border-border p-3">
                <p className="text-sm font-semibold">Supporting document checklist</p>
                <p className="mt-1 text-xs text-muted-foreground">Example team-defined checklist. Confirm which items apply to the actual shipment.</p>
                {supportingDocs.map((item, index) => <label key={item.name} className="mt-2 flex items-center justify-between gap-3 text-sm"><span className="flex items-center gap-2"><input type="checkbox" checked={item.received} onChange={(event) => { setSupportingDocs((current) => current.map((doc, i) => i === index ? { ...doc, received: event.target.checked } : doc)); setOwnResult(null); }} />{item.name}</span><span className="text-xs text-muted-foreground">{item.received ? "Received" : "Marked missing"}</span></label>)}
              </div>
              {error && <p role="alert" className="mt-3 text-sm text-destructive">{error}</p>}
              <Button className="mt-4 w-full" onClick={analyzeOwnShipment} disabled={analyzing}><Sparkles /> {analyzing ? "Groq is reviewing shipment…" : "Analyze shipment with Groq AI"}</Button>
              <p className="mt-3 flex items-start gap-2 text-xs text-muted-foreground"><ShieldCheck className="size-4 shrink-0" />Text-only MVP: .txt/.csv supported; scanned PDFs and OCR are not connected. When you run AI review, invoice and packing-list text are sent securely from our server to Groq API. The API key stays server-side. Do not submit confidential shipment data.</p>
            </div>
            <div className="rounded-2xl border border-border bg-card p-4 sm:p-6">
              <p className="eyebrow">Review and approval</p><h3 className="text-lg font-semibold">Shipment result</h3>
              {!ownResult ? <div className="mt-5 rounded-lg bg-muted/40 p-6 text-center text-sm text-muted-foreground">Add both document texts and run the workflow. Findings and a draft will appear here together.</div> : (
                <>
                <div className="mt-4 space-y-4" aria-live="polite">
                  <div className="flex flex-wrap gap-2 text-xs"><span className="rounded-full bg-emerald-500/10 px-2 py-1 text-emerald-700 dark:text-emerald-300">{ownResult.comparison.filter((item) => item.status === "consistent").length} consistent</span><span className="rounded-full bg-amber-500/10 px-2 py-1 text-amber-700 dark:text-amber-300">{ownResult.comparison.filter((item) => item.status === "mismatch").length} mismatches</span><span className="rounded-full bg-muted px-2 py-1 text-muted-foreground">{ownResult.comparison.filter((item) => item.status === "unable").length} not found in either</span><span className="rounded-full bg-muted px-2 py-1 text-muted-foreground">{ownResult.comparison.filter((item) => item.status === "invoice-only").length} invoice only</span><span className="rounded-full bg-muted px-2 py-1 text-muted-foreground">{ownResult.comparison.filter((item) => item.status === "packing-only").length} packing-list only</span></div>
                  <div className="overflow-hidden rounded-lg border border-border">{ownResult.comparison.map((row) => <div key={row.key} className="grid gap-1 border-b border-border/70 p-3 last:border-0"><div className="flex items-center justify-between gap-2"><span className="text-sm font-medium">{row.label}</span><span className={`rounded-full px-2 py-1 text-[10px] ${row.status === "consistent" ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300" : row.status === "mismatch" ? "bg-amber-500/10 text-amber-700 dark:text-amber-300" : "bg-muted text-muted-foreground"}`}>{row.status === "invoice-only" ? "Present in invoice only" : row.status === "packing-only" ? "Present in packing list only" : row.status === "unable" ? "Not found in either" : row.status}</span></div><p className="break-words text-xs text-muted-foreground">Invoice: {row.invoiceValue || "Not found"} · Packing list: {row.packingValue || "Not found"}</p></div>)}</div>
                  <div className="rounded-xl border border-primary/20 bg-primary/5 p-4">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div><p className="eyebrow">AI shipment review</p><p className="text-sm font-semibold">Groq cross-document reasoning</p></div>
                      <span className={`rounded-full px-2 py-1 text-[10px] ${ownResult.aiReview.status === "ai" ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300" : "bg-amber-500/10 text-amber-700 dark:text-amber-300"}`}>{ownResult.aiReview.status === "ai" ? "Groq AI active" : "Rules-only fallback"}</span>
                    </div>
                    <p className="mt-2 text-sm leading-6">{ownResult.aiReview.summary}</p>
                    <p className="mt-2 text-xs text-muted-foreground">Model: {ownResult.aiReview.model}. Deterministic field comparisons and calculations remain the source of truth for numeric outcomes.</p>
                    {ownResult.aiReview.observations.length > 0 && <div className="mt-3"><p className="text-xs font-semibold">Additional observations</p>{ownResult.aiReview.observations.map((item, index) => <div key={index} className="mt-2 rounded-lg border border-border bg-background p-3"><p className="text-sm font-medium">{item.label}</p><p className="mt-1 text-sm">{item.detail}</p><p className="mt-1 text-xs text-muted-foreground">{item.document} evidence: {item.evidence}</p></div>)}</div>}
                    {ownResult.aiReview.questions.length > 0 && <div className="mt-3"><p className="text-xs font-semibold">AI clarification questions</p><ul className="mt-1 list-disc space-y-1 pl-5 text-sm text-muted-foreground">{ownResult.aiReview.questions.map((question, index) => <li key={index}>{question}</li>)}</ul></div>}
                  </div>
                  <div className="rounded-lg border border-border p-3">
                    <p className="text-sm font-semibold">Internal document calculations</p>
                    {ownResult.validations.map(({ document, check }) => (
                      <div key={document + check.key} className="mt-2 rounded-md bg-muted/40 p-2">
                        <div className="flex flex-wrap items-center justify-between gap-2"><span className="text-xs font-medium">{document}: {check.label}</span><span className="text-[10px] uppercase text-muted-foreground">{check.status}</span></div>
                        <p className="mt-1 text-xs text-muted-foreground">{check.status === "unable" ? check.evidence : `Calculated: ${check.expected} · Stated: ${check.actual}`}</p>
                      </div>
                    ))}
                  </div>
                  <div className="rounded-lg border border-primary/20 bg-primary/5 p-3">
                    <div className="flex items-center gap-2"><Mail className="size-4 text-primary" /><p className="text-sm font-semibold">Prepared follow-up draft</p></div>
                    <p className="mt-3 text-xs text-muted-foreground">Subject</p><p className="text-sm font-medium">{ownResult.subject}</p>
                    <p className="mt-3 text-xs text-muted-foreground">Message</p><textarea readOnly value={ownResult.body} rows={9} className="mt-1 w-full rounded-lg border border-input bg-background p-3 text-sm leading-6" />
                    <p className="mt-2 flex items-start gap-2 text-xs text-muted-foreground"><ShieldCheck className="size-4 shrink-0" />Human approval required. This page prepares a draft; it does not send email.</p>
                  </div>
                </div>
                <div className="mt-4 rounded-xl border border-border p-4">
                  <label className="grid max-w-sm gap-2 text-sm font-medium">Monthly shipment volume
                    <select className="h-10 rounded-md border border-input bg-background px-3 font-normal" value={monthlyVolume} onChange={(event) => setMonthlyVolume(event.target.value)}>
                      <option value="">Select monthly volume</option>
                      <option value="1–10">1–10 shipments</option>
                      <option value="11–50">11–50 shipments</option>
                      <option value="51–100">51–100 shipments</option>
                      <option value="101+">101+ shipments</option>
                    </select>
                  </label>
                </div>
                <div className="mt-4">
                  <ProductDemoNextStep automation="shipment-readiness" shipmentVolume={monthlyVolume || undefined} requireShipmentVolume />
                </div>
                </>
              )}
            </div>
          </div>
        )}

        {analyzing && (
          <ol aria-live="polite" className="mt-4 grid gap-2 rounded-xl border border-border bg-card p-4 sm:grid-cols-3">
            {stages.map((label, index) => <li key={label} className={`flex items-center gap-2 text-sm ${index === stage ? "font-medium text-primary animate-pulse" : "text-muted-foreground"}`}>{index < stage ? <CheckCircle2 className="size-4" /> : <span className="flex size-5 items-center justify-center rounded-full border text-[10px]">{index + 1}</span>}{label}</li>)}
          </ol>
        )}
        <p className="mt-4 text-xs text-muted-foreground">This is a review-support demonstration, not a customs-clearance decision. Comparisons cover only values extracted from supplied text. Checklist requirements must be confirmed by the responsible team.</p>
      </div>
    </section>
  );
}
