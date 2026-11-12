import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { ArrowRight, CheckCircle2, ClipboardList, FileCheck2, Mail, ShieldCheck } from "lucide-react";
import { PageHero, SectionHeader } from "@/components/site/section";
import { Button } from "@/components/ui/button";
import { CtaBand } from "@/components/site/cta-band";
import { meta } from "@/components/site/blocks";
import { buildMissingDocumentDraft, compareTradeDocuments } from "@/lib/trade-intelligence";

const sampleInvoice = `COMMERCIAL INVOICE
Invoice No: INV-2048
Exporter: Northstar Components Ltd.
Importer: Harborline Trading FZE
Goods Description: Industrial stainless steel valve assemblies
Quantity: 240 units
HS Code: 8481.80`;

const samplePackingList = `PACKING LIST
Invoice No: INV-2048
Exporter: Northstar Components Ltd.
Importer: Harborline Trading FZE
Goods Description: Industrial stainless steel valve assemblies
Quantity: 240 units
Packages: 12 cartons
Gross Weight: 1,080 kg
Net Weight: 960 kg`;

const initialDocuments = [
  { name: "Commercial invoice", received: true },
  { name: "Packing list", received: true },
  { name: "Bill of lading", received: false },
  { name: "Certificate of origin", received: false },
];

export const Route = createFileRoute("/shipment-follow-up")({
  head: () => ({
    ...meta(
      "Shipment Readiness | AETHER-TRADE",
      "Review shipment document status, compare invoice and packing list fields, and prepare human-reviewed follow-up drafts."
    ),
    links: [{ rel: "canonical", href: "https://aethertrade.cloud/shipment-follow-up" }],
  }),
  component: ShipmentReadinessPage,
});

function ShipmentReadinessPage() {
  const [reference, setReference] = useState("SHIPMENT-2048");
  const [invoiceText, setInvoiceText] = useState("");
  const [packingText, setPackingText] = useState("");
  const [documents, setDocuments] = useState(initialDocuments);
  const [comparisonVisible, setComparisonVisible] = useState(false);
  const [draftVisible, setDraftVisible] = useState(false);

  const missingDocuments = documents.filter((item) => !item.received).map((item) => item.name);
  const comparison = useMemo(
    () => comparisonVisible ? compareTradeDocuments(invoiceText, packingText) : [],
    [comparisonVisible, invoiceText, packingText],
  );
  const draft = buildMissingDocumentDraft(reference.trim() || "shipment", missingDocuments);
  const mismatchCount = comparison.filter((row) => row.status === "mismatch").length;
  const unableCount = comparison.filter((row) => row.status === "unable").length;

  function loadSamples() {
    setInvoiceText(sampleInvoice);
    setPackingText(samplePackingList);
    setComparisonVisible(true);
    setDraftVisible(false);
  }

  return (
    <>
      <PageHero
        eyebrow="Product 02 · Shipment Readiness"
        title="Know what is missing before the shipment file moves forward."
        description="Organize a shipment checklist, compare invoice and packing-list details, surface mismatches and prepare a customer follow-up draft for a person to review."
      >
        <Button variant="hero" asChild>
          <Link to="/request-demo" search={{ automation: "shipment-readiness" }}>
            Request a private demo <ArrowRight />
          </Link>
        </Button>
        <Button variant="outline" asChild>
          <Link to="/document-intake">Explore Product Intelligence</Link>
        </Button>
      </PageHero>

      <section className="container-page section-pad">
        <div className="grid gap-8 lg:grid-cols-[0.85fr_1.15fr]">
          <div className="rounded-2xl border border-border bg-card p-6">
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-primary/10 p-3 text-primary"><ClipboardList /></div>
              <div><p className="eyebrow">Shipment workspace</p><h2 className="text-xl font-semibold">Document checklist</h2></div>
            </div>
            <label className="mt-5 grid gap-2 text-sm">
              Shipment reference
              <input value={reference} onChange={(event) => setReference(event.target.value)} className="h-10 rounded-md border border-input bg-background px-3" />
            </label>
            <p className="mt-5 text-sm text-muted-foreground">Example checklist. Mark items received or missing according to the requirements agreed for this shipment.</p>
            <div className="mt-3 space-y-2">
              {documents.map((item, index) => (
                <label key={item.name} className="flex cursor-pointer items-center justify-between gap-3 rounded-lg border border-border p-3">
                  <span className="flex items-center gap-3 text-sm font-medium">
                    <input
                      type="checkbox"
                      checked={item.received}
                      onChange={(event) => {
                        setDocuments((current) => current.map((doc, i) => i === index ? { ...doc, received: event.target.checked } : doc));
                        setDraftVisible(false);
                      }}
                      className="size-4 accent-primary"
                    />
                    {item.name}
                  </span>
                  <span className={`rounded-full px-2 py-1 text-xs ${item.received ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300" : "bg-amber-500/10 text-amber-700 dark:text-amber-300"}`}>{item.received ? "Received" : "Missing"}</span>
                </label>
              ))}
            </div>
            <div className="mt-4 flex items-center justify-between rounded-lg bg-muted/40 p-3 text-sm">
              <span className="text-muted-foreground">Checklist status</span>
              <strong>{documents.length - missingDocuments.length}/{documents.length} received</strong>
            </div>
            <Button className="mt-5 w-full" onClick={() => setDraftVisible(true)}><Mail /> Prepare follow-up draft</Button>
            <div className="mt-4 flex items-start gap-2 rounded-lg bg-muted/50 p-3 text-xs text-muted-foreground">
              <ShieldCheck className="mt-0.5 size-4 shrink-0" />
              <p>The checklist is configurable by your team; this sample is not a universal legal document requirement. Drafts are not sent and no shipment system is connected.</p>
            </div>
          </div>

          <div className="space-y-5">
            <div className="rounded-2xl border border-border bg-card p-6">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div><p className="eyebrow">Cross-document review</p><h2 className="text-xl font-semibold">Invoice vs packing list</h2></div>
                <button type="button" onClick={loadSamples} className="text-sm text-primary underline underline-offset-4">Load sample documents</button>
              </div>
              <p className="mt-2 text-sm text-muted-foreground">Paste text copied from each document. The comparison checks only values that can be extracted from the supplied text.</p>
              <div className="mt-4 grid gap-4 md:grid-cols-2">
                <label className="grid gap-2 text-sm font-medium">Commercial invoice
                  <textarea value={invoiceText} onChange={(event) => { setInvoiceText(event.target.value); setComparisonVisible(false); }} rows={9} className="w-full rounded-xl border border-input bg-background p-3 text-sm font-normal leading-6" placeholder="Paste invoice text here..." />
                </label>
                <label className="grid gap-2 text-sm font-medium">Packing list
                  <textarea value={packingText} onChange={(event) => { setPackingText(event.target.value); setComparisonVisible(false); }} rows={9} className="w-full rounded-xl border border-input bg-background p-3 text-sm font-normal leading-6" placeholder="Paste packing list text here..." />
                </label>
              </div>
              <Button className="mt-4" variant="outline" onClick={() => setComparisonVisible(true)} disabled={!invoiceText.trim() || !packingText.trim()}><FileCheck2 /> Compare documents</Button>
              {comparisonVisible && (
                <div className="mt-5">
                  <div className="mb-3 flex flex-wrap gap-3 text-xs">
                    <span className="rounded-full bg-emerald-500/10 px-3 py-1 text-emerald-700 dark:text-emerald-300">{comparison.length - mismatchCount - unableCount} consistent</span>
                    <span className="rounded-full bg-amber-500/10 px-3 py-1 text-amber-700 dark:text-amber-300">{mismatchCount} mismatch</span>
                    <span className="rounded-full bg-muted px-3 py-1 text-muted-foreground">{unableCount} unable to determine</span>
                  </div>
                  <div className="overflow-hidden rounded-xl border border-border">
                    {comparison.map((row) => (
                      <div key={row.key} className="grid gap-2 border-b border-border/70 p-3 last:border-0 md:grid-cols-[0.7fr_1fr_1fr_auto] md:items-center">
                        <strong className="text-xs">{row.label}</strong>
                        <span className="break-words text-xs text-muted-foreground">Invoice: {row.invoiceValue || "Not found"}</span>
                        <span className="break-words text-xs text-muted-foreground">Packing: {row.packingValue || "Not found"}</span>
                        <span className={`w-fit rounded-full px-2 py-1 text-[10px] ${row.status === "consistent" ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300" : row.status === "mismatch" ? "bg-amber-500/10 text-amber-700 dark:text-amber-300" : "bg-muted text-muted-foreground"}`}>{row.status === "unable" ? "Unable to determine" : row.status}</span>
                      </div>
                    ))}
                  </div>
                  <p className="mt-3 text-xs text-muted-foreground">A match means the extracted text values match; it does not verify the source document's authenticity or establish customs compliance.</p>
                </div>
              )}
            </div>

            {draftVisible && (
              <div className="rounded-2xl border border-border bg-card p-6">
                <div className="flex items-center gap-2"><CheckCircle2 className="size-5 text-primary" /><div><p className="eyebrow">Human-reviewed communication</p><h2 className="text-xl font-semibold">Follow-up draft</h2></div></div>
                {missingDocuments.length ? (
                  <>
                    <p className="mt-4 text-xs text-muted-foreground">Subject</p>
                    <p className="mt-1 font-semibold">{draft.subject}</p>
                    <p className="mt-4 text-xs text-muted-foreground">Message</p>
                    <textarea readOnly value={draft.body} rows={10} className="mt-1 w-full rounded-xl border border-input bg-background p-3 text-sm leading-6" />
                  </>
                ) : <p className="mt-4 text-sm text-muted-foreground">No outstanding documents are marked missing. No follow-up draft is needed.</p>}
                <p className="mt-3 text-xs text-muted-foreground">Review and edit this draft before using it. This page does not send email.</p>
              </div>
            )}
          </div>
        </div>
      </section>

      <section className="container-page section-pad border-t border-border">
        <SectionHeader eyebrow="MVP workflow" title="A reviewable shipment file, not an automatic clearance decision" description="The current workflow organizes team-defined document status and compares selected fields. Exceptions remain visible for a person to investigate." />
        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {[
            ["01", "Track documents", "Maintain a clear view of received and outstanding items."],
            ["02", "Compare details", "Check extracted invoice and packing-list values for consistency."],
            ["03", "Prepare follow-up", "Create an editable reminder draft for coordinator review."],
          ].map(([number, title, body]) => <article key={number} className="rounded-xl border border-border bg-card p-5"><p className="eyebrow">{number}</p><h3 className="mt-2 font-semibold">{title}</h3><p className="mt-2 text-sm text-muted-foreground">{body}</p></article>)}
        </div>
      </section>
      <CtaBand title="Test Shipment Readiness against your operation." description="Request a private walkthrough to discuss your checklist, document formats and approval process." />
    </>
  );
}
