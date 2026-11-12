import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowRight, CheckCircle2, FileText, ShieldCheck, Sparkles } from "lucide-react";
import { PageHero, SectionHeader } from "@/components/site/section";
import { Button } from "@/components/ui/button";
import { CtaBand } from "@/components/site/cta-band";
import { meta } from "@/components/site/blocks";

const samples = {
  invoice: {
    label: "Commercial invoice — INV-2048",
    source: "Illustrative commercial invoice",
    fields: [
      ["Invoice number", "INV-2048", "High"],
      ["Invoice date", "12 Nov 2026", "High"],
      ["Exporter", "Northstar Components Ltd.", "High"],
      ["Importer", "Harborline Trading FZE", "High"],
      ["Goods description", "Industrial valve assemblies", "Medium"],
      ["Quantity", "240 units", "High"],
      ["Currency", "USD", "High"],
      ["Invoice total", "USD 18,720.00", "High"],
      ["HS code", "Not stated in sample", "Needs review"],
    ],
  },
  packing: {
    label: "Packing list — PL-2048",
    source: "Illustrative packing list",
    fields: [
      ["Packing list number", "PL-2048", "High"],
      ["Invoice reference", "INV-2048", "High"],
      ["Exporter", "Northstar Components Ltd.", "High"],
      ["Importer", "Harborline Trading FZE", "High"],
      ["Goods description", "Industrial valve assemblies", "Medium"],
      ["Quantity", "240 units", "High"],
      ["Packages", "12 cartons", "High"],
      ["Gross weight", "1,080 kg", "Medium"],
      ["Net weight", "960 kg", "Medium"],
    ],
  },
};

export const Route = createFileRoute("/document-intake")({
  head: () => ({
    ...meta(
      "Trade Document Intake & Structuring Demo",
      "Explore an illustrative AETHER-TRADE document intake workflow: extract trade document fields, review exceptions and organize shipment data."
    ),
    links: [{ rel: "canonical", href: "https://aethertrade.cloud/document-intake" }],
  }),
  component: DocumentIntakePage,
});

function DocumentIntakePage() {
  const [sample, setSample] = useState<keyof typeof samples>("invoice");
  const [processed, setProcessed] = useState(false);
  const current = samples[sample];
  const reviewCount = current.fields.filter((field) => field[2] === "Needs review").length;

  return (
    <>
      <PageHero
        eyebrow="Product demo · Illustrative sample"
        title="Turn trade documents into structured shipment data."
        description="Walk through a sample intake flow for commercial invoices and packing lists. Review extracted fields and see how unclear information is surfaced for a person to check."
      >
        <Button variant="hero" asChild>
          <Link to="/request-demo" search={{ automation: "trade-document-intake" }}>
            Discuss a pilot <ArrowRight />
          </Link>
        </Button>
        <Button variant="outline" asChild>
          <Link to="/shipment-follow-up">Explore Shipment Follow-Up</Link>
        </Button>
      </PageHero>

      <section className="container-page section-pad">
        <div className="grid gap-8 lg:grid-cols-[0.85fr_1.15fr]">
          <div className="rounded-2xl border border-border bg-card p-6">
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-primary/10 p-3 text-primary"><FileText /></div>
              <div>
                <p className="eyebrow">Interactive walkthrough</p>
                <h2 className="text-xl font-semibold">Choose a sample document</h2>
              </div>
            </div>
            <p className="mt-3 text-sm text-muted-foreground">No files are uploaded. This demo uses preloaded illustrative sample data only.</p>
            <div className="mt-6 space-y-3">
              {Object.entries(samples).map(([key, value]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => { setSample(key as keyof typeof samples); setProcessed(false); }}
                  className={`flex w-full items-center justify-between rounded-xl border p-4 text-left transition-colors ${sample === key ? "border-primary bg-primary/5" : "border-border hover:bg-accent/50"}`}
                  aria-pressed={sample === key}
                >
                  <span>
                    <span className="block font-medium">{value.label}</span>
                    <span className="mt-1 block text-xs text-muted-foreground">{value.source}</span>
                  </span>
                  {sample === key && <CheckCircle2 className="text-primary" />}
                </button>
              ))}
            </div>
            <Button className="mt-6 w-full" onClick={() => setProcessed(true)}>
              <Sparkles /> {processed ? "Sample fields displayed" : "Run sample extraction"}
            </Button>
            <div className="mt-4 flex items-start gap-2 rounded-lg bg-muted/50 p-3 text-xs text-muted-foreground">
              <ShieldCheck className="mt-0.5 size-4 shrink-0" />
              <p>Demo simulation only. This page does not perform live OCR, AI extraction, customs checks or external integrations.</p>
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-card p-6">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="eyebrow">Structured output</p>
                <h2 className="text-xl font-semibold">{processed ? "Extracted sample fields" : "Preview the resulting record"}</h2>
                <p className="mt-1 text-sm text-muted-foreground">{current.label}</p>
              </div>
              <span className="rounded-full border border-border px-3 py-1 text-xs text-muted-foreground">Illustrative data</span>
            </div>
            <div className="mt-6 overflow-hidden rounded-xl border border-border">
              <div className="grid grid-cols-[1fr_1.25fr_auto] gap-3 border-b border-border bg-muted/40 px-4 py-3 text-xs font-medium text-muted-foreground">
                <span>Field</span><span>Sample value</span><span>Review</span>
              </div>
              {current.fields.map(([name, value, confidence]) => (
                <div key={name} className="grid grid-cols-[1fr_1.25fr_auto] items-start gap-3 border-b border-border/70 px-4 py-3 text-sm last:border-0">
                  <span className="text-muted-foreground">{name}</span>
                  <span className="font-medium">{value}</span>
                  <span className={`rounded-full px-2 py-1 text-[10px] ${confidence === "Needs review" ? "bg-amber-500/10 text-amber-700 dark:text-amber-300" : confidence === "Medium" ? "bg-muted text-muted-foreground" : "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"}`}>{confidence}</span>
                </div>
              ))}
            </div>
            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              <div className="rounded-lg bg-muted/40 p-3"><p className="text-xs text-muted-foreground">Fields shown</p><p className="text-2xl font-semibold">{current.fields.length}</p></div>
              <div className="rounded-lg bg-muted/40 p-3"><p className="text-xs text-muted-foreground">Needs review</p><p className="text-2xl font-semibold">{reviewCount || "—"}</p></div>
              <div className="rounded-lg bg-muted/40 p-3"><p className="text-xs text-muted-foreground">Human review</p><p className="text-2xl font-semibold">Included</p></div>
            </div>
          </div>
        </div>
      </section>

      <section className="container-page section-pad border-t border-border">
        <SectionHeader eyebrow="Workflow concept" title="From incoming documents to a reviewable shipment record" description="A proposed intake workflow can classify document types, structure available fields and flag uncertain or absent information for human review." />
        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {[
            ["01", "Receive & classify", "Identify the document type and associate it with a shipment or case."],
            ["02", "Extract & structure", "Organize available fields into a consistent record with source context."],
            ["03", "Review exceptions", "Surface missing or unclear fields so an operator can confirm before use."],
          ].map(([number, title, body]) => <article key={number} className="rounded-xl border border-border bg-card p-5"><p className="eyebrow">{number}</p><h3 className="mt-2 font-semibold">{title}</h3><p className="mt-2 text-sm text-muted-foreground">{body}</p></article>)}
        </div>
      </section>
      <CtaBand title="See how document intake could fit your operation." description="Discuss your document types, review rules and integration requirements with AETHER-TRADE." />
    </>
  );
}
