import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowRight, CheckCircle2, FileSearch, ShieldCheck, Sparkles, Upload } from "lucide-react";
import { PageHero } from "@/components/site/section";
import { Button } from "@/components/ui/button";
import { CtaBand } from "@/components/site/cta-band";
import { meta } from "@/components/site/blocks";
import { analyzeTradeDocument, type DocumentAnalysis } from "@/lib/trade-intelligence";

const sampleInvoice = `COMMERCIAL INVOICE
Invoice No: INV-2048
Invoice Date: 12 Nov 2026
Exporter: Northstar Components Ltd.
Importer: Harborline Trading FZE
Goods Description: Industrial stainless steel valve assemblies, model VA-240, for fluid control systems
Quantity: 240 units
Currency: USD
Invoice Total: USD 18,720.00
HS Code: Not stated`;

export const Route = createFileRoute("/document-intake")({
  head: () => ({
    ...meta(
      "Product Intelligence | AETHER-TRADE",
      "Review commercial invoice descriptions, extract stated product details and identify information gaps for human review."
    ),
    links: [{ rel: "canonical", href: "https://aethertrade.cloud/document-intake" }],
  }),
  component: ProductIntelligencePage,
});

function ProductIntelligencePage() {
  const [sourceText, setSourceText] = useState("");
  const [analysis, setAnalysis] = useState<DocumentAnalysis | null>(null);
  const [fileName, setFileName] = useState("");
  const [error, setError] = useState("");

  async function loadTextFile(file?: File) {
    if (!file) return;
    if (file.size > 1_000_000) {
      setError("Text file must be smaller than 1 MB.");
      return;
    }
    if (!/\.(txt|csv)$/i.test(file.name)) {
      setError("For this MVP, upload a .txt or .csv text export. PDF/OCR processing is not connected yet.");
      return;
    }
    setError("");
    setFileName(file.name);
    setSourceText(await file.text());
    setAnalysis(null);
  }

  function runAnalysis() {
    if (sourceText.trim().length < 20) {
      setError("Paste at least 20 characters of invoice text before analysis.");
      setAnalysis(null);
      return;
    }
    setError("");
    setAnalysis(analyzeTradeDocument(sourceText));
  }

  const missingFields = analysis?.fields.filter((field) => field.status === "missing") ?? [];
  const foundAttributes = analysis?.productAttributes.filter((item) => item.found) ?? [];
  const missingAttributes = analysis?.productAttributes.filter((item) => !item.found) ?? [];

  return (
    <>
      <PageHero
        eyebrow="Product 01 · Product Intelligence"
        title="Understand what the invoice actually says about the goods."
        description="Extract stated product details, review the commercial description and surface attributes that are not present in the supplied text. Uncertain details stay unknown instead of being guessed."
      >
        <Button variant="hero" asChild>
          <Link to="/request-demo" search={{ automation: "product-intelligence" }}>
            Request a private demo <ArrowRight />
          </Link>
        </Button>
        <Button variant="outline" asChild>
          <Link to="/shipment-follow-up">Explore Shipment Readiness</Link>
        </Button>
      </PageHero>

      <section className="container-page section-pad">
        <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="rounded-2xl border border-border bg-card p-6">
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-primary/10 p-3 text-primary"><FileSearch /></div>
              <div><p className="eyebrow">Invoice text review</p><h2 className="text-xl font-semibold">Add invoice content</h2></div>
            </div>
            <p className="mt-3 text-sm text-muted-foreground">Paste text copied from a commercial invoice, or upload a .txt/.csv text export. Processing runs in this browser tab; this page does not upload the text to a server.</p>
            <textarea
              value={sourceText}
              onChange={(event) => { setSourceText(event.target.value); setAnalysis(null); setError(""); }}
              rows={14}
              aria-label="Commercial invoice text"
              placeholder={"Invoice No: INV-1001\nExporter: Example Trading Ltd.\nGoods Description: Stainless steel pump assemblies\nQuantity: 20 units\nInvoice Total: USD 4,500"}
              className="mt-5 w-full rounded-xl border border-input bg-background p-4 text-sm leading-6 outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
            <div className="mt-3 flex flex-wrap items-center gap-3">
              <label className="inline-flex cursor-pointer items-center gap-2 rounded-md border border-input px-3 py-2 text-sm hover:bg-accent">
                <Upload className="size-4" /> Upload text file
                <input type="file" accept=".txt,.csv,text/plain,text/csv" className="sr-only" onChange={(event) => void loadTextFile(event.target.files?.[0])} />
              </label>
              {fileName && <span className="text-xs text-muted-foreground">{fileName}</span>}
              <button type="button" className="text-sm text-primary underline underline-offset-4" onClick={() => { setSourceText(sampleInvoice); setFileName("Illustrative sample"); setAnalysis(null); setError(""); }}>Load sample invoice</button>
            </div>
            {error && <p role="alert" className="mt-3 text-sm text-destructive">{error}</p>}
            <Button className="mt-5 w-full" onClick={runAnalysis}><Sparkles /> Analyse invoice text</Button>
            <div className="mt-4 flex items-start gap-2 rounded-lg bg-muted/50 p-3 text-xs text-muted-foreground">
              <ShieldCheck className="mt-0.5 size-4 shrink-0" />
              <p>Current MVP supports text-based extraction only. Scanned PDFs, OCR, live HS-code lookup and customs rulings are not connected. Do not enter confidential customer or shipment data in this public demo.</p>
            </div>
          </div>

          <div className="space-y-5">
            <div className="rounded-2xl border border-border bg-card p-6">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div><p className="eyebrow">Structured result</p><h2 className="text-xl font-semibold">Invoice field extraction</h2></div>
                <span className="rounded-full border border-border px-3 py-1 text-xs text-muted-foreground">{analysis ? "Analysis complete" : "Awaiting input"}</span>
              </div>
              {!analysis ? (
                <div className="mt-6 rounded-xl bg-muted/40 p-8 text-center text-sm text-muted-foreground">Add invoice text and run the analysis to see fields and evidence.</div>
              ) : (
                <div className="mt-5 overflow-hidden rounded-xl border border-border">
                  {analysis.fields.map((field) => (
                    <div key={field.key} className="grid gap-1 border-b border-border/70 px-4 py-3 last:border-0 sm:grid-cols-[0.8fr_1.2fr_auto] sm:items-start sm:gap-3">
                      <span className="text-sm text-muted-foreground">{field.label}</span>
                      <span className="break-words text-sm font-medium">{field.value || "Not found in supplied text"}</span>
                      <span className={`w-fit rounded-full px-2 py-1 text-[10px] ${field.value ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300" : "bg-amber-500/10 text-amber-700 dark:text-amber-300"}`}>{field.value ? "Found" : "Missing"}</span>
                      {field.evidence && <span className="sm:col-start-2 text-xs text-muted-foreground">Evidence: {field.evidence}</span>}
                    </div>
                  ))}
                </div>
              )}
            </div>
            {analysis && (
              <div className="rounded-2xl border border-border bg-card p-6">
                <p className="eyebrow">Product description review</p>
                <h2 className="mt-1 text-xl font-semibold">What is stated — and what is not</h2>
                <p className="mt-3 rounded-lg bg-muted/40 p-3 text-sm">{analysis.productDescription || "No clearly labelled goods description was found in the supplied text."}</p>
                <div className="mt-5 grid gap-3 sm:grid-cols-2">
                  <div className="rounded-xl border border-border p-4">
                    <p className="text-sm font-semibold">Attributes found ({foundAttributes.length})</p>
                    {foundAttributes.length ? foundAttributes.map((item) => <p key={item.label} className="mt-2 text-sm text-emerald-700 dark:text-emerald-300">✓ {item.label}: {item.evidence}</p>) : <p className="mt-2 text-sm text-muted-foreground">No listed attributes detected.</p>}
                  </div>
                  <div className="rounded-xl border border-border p-4">
                    <p className="text-sm font-semibold">Not detected ({missingAttributes.length})</p>
                    {missingAttributes.map((item) => <p key={item.label} className="mt-2 text-sm text-amber-700 dark:text-amber-300">• {item.label}</p>)}
                  </div>
                </div>
                <div className="mt-4 rounded-lg bg-muted/40 p-3 text-xs text-muted-foreground">
                  {missingFields.length} standard invoice field(s) were not detected. Attribute checks are prompts for further review, not a legal or customs classification decision.
                </div>
              </div>
            )}
          </div>
        </div>
      </section>
      <CtaBand title="Test Product Intelligence against your real workflow." description="Request a private walkthrough to discuss document formats, product data requirements and controlled pilot scope." />
    </>
  );
}
