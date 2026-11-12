import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowRight, CheckCircle2, ClipboardList, Mail, ShieldCheck } from "lucide-react";
import { PageHero, SectionHeader } from "@/components/site/section";
import { Button } from "@/components/ui/button";
import { CtaBand } from "@/components/site/cta-band";
import { meta } from "@/components/site/blocks";

const shipment = {
  reference: "AE-2026-1048",
  customer: "Harborline Trading FZE",
  route: "Jebel Ali, UAE → Rotterdam, NL",
  eta: "18 Nov 2026 · Illustrative",
  checklist: [
    { name: "Commercial invoice", status: "Received", received: "12 Nov · Sample" },
    { name: "Packing list", status: "Received", received: "12 Nov · Sample" },
    { name: "Bill of lading", status: "Missing", received: "Awaiting customer" },
    { name: "Certificate of origin", status: "Missing", received: "Awaiting customer" },
  ],
};

export const Route = createFileRoute("/shipment-follow-up")({
  head: () => ({
    ...meta(
      "Shipment Follow-Up Assistant Demo",
      "Explore an illustrative shipment document checklist, missing-document identification and human-approved follow-up email drafting."
    ),
    links: [{ rel: "canonical", href: "https://aethertrade.cloud/shipment-follow-up" }],
  }),
  component: ShipmentFollowUpPage,
});

function ShipmentFollowUpPage() {
  const [draftReady, setDraftReady] = useState(false);
  const [approved, setApproved] = useState(false);
  const missing = shipment.checklist.filter((item) => item.status === "Missing");

  return (
    <>
      <PageHero
        eyebrow="Product demo · Illustrative sample"
        title="Keep shipment document follow-ups organized."
        description="Explore a sample shipment checklist, identify pending documents and review a follow-up email draft before a coordinator approves it."
      >
        <Button variant="hero" asChild>
          <Link to="/request-demo" search={{ automation: "shipment-follow-up-assistant" }}>
            Discuss a pilot <ArrowRight />
          </Link>
        </Button>
        <Button variant="outline" asChild>
          <Link to="/document-intake">Explore Document Intake</Link>
        </Button>
      </PageHero>

      <section className="container-page section-pad">
        <div className="grid gap-8 lg:grid-cols-[0.85fr_1.15fr]">
          <div className="rounded-2xl border border-border bg-card p-6">
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-primary/10 p-3 text-primary"><ClipboardList /></div>
              <div><p className="eyebrow">Shipment workspace</p><h2 className="text-xl font-semibold">{shipment.reference}</h2></div>
            </div>
            <dl className="mt-5 space-y-3 text-sm">
              <div><dt className="text-muted-foreground">Customer</dt><dd className="font-medium">{shipment.customer}</dd></div>
              <div><dt className="text-muted-foreground">Route</dt><dd className="font-medium">{shipment.route}</dd></div>
              <div><dt className="text-muted-foreground">ETA</dt><dd className="font-medium">{shipment.eta}</dd></div>
            </dl>
            <div className="mt-6 flex items-center justify-between rounded-lg bg-muted/40 p-3">
              <span className="text-sm text-muted-foreground">Document checklist</span>
              <span className="text-sm font-semibold">{shipment.checklist.length - missing.length}/{shipment.checklist.length} received</span>
            </div>
            <div className="mt-4 space-y-2">
              {shipment.checklist.map((item) => (
                <div key={item.name} className="flex items-start justify-between gap-3 rounded-lg border border-border p-3">
                  <div><p className="text-sm font-medium">{item.name}</p><p className="mt-1 text-xs text-muted-foreground">{item.received}</p></div>
                  <span className={`rounded-full px-2 py-1 text-xs ${item.status === "Missing" ? "bg-amber-500/10 text-amber-700 dark:text-amber-300" : "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"}`}>{item.status}</span>
                </div>
              ))}
            </div>
            <Button className="mt-6 w-full" onClick={() => { setDraftReady(true); setApproved(false); }}>
              <Mail /> {draftReady ? "Refresh sample follow-up draft" : "Draft follow-up email"}
            </Button>
            <div className="mt-4 flex items-start gap-2 rounded-lg bg-muted/50 p-3 text-xs text-muted-foreground">
              <ShieldCheck className="mt-0.5 size-4 shrink-0" />
              <p>Demo simulation only. No email is sent, no real shipment is accessed and no external systems are connected.</p>
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-card p-6">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div><p className="eyebrow">Human-reviewed communication</p><h2 className="text-xl font-semibold">Follow-up email preview</h2><p className="mt-1 text-sm text-muted-foreground">Draft status: {draftReady ? "Ready for review" : "Not generated yet"}</p></div>
              <span className="rounded-full border border-border px-3 py-1 text-xs text-muted-foreground">Illustrative draft</span>
            </div>
            <div className="mt-6 rounded-xl border border-border bg-background p-5">
              <p className="text-xs text-muted-foreground">To: customer contact (sample)</p>
              <p className="mt-2 text-sm font-semibold">Subject: Documents pending for shipment {shipment.reference}</p>
              <div className="mt-4 space-y-3 text-sm leading-6">
                <p>Hello Harborline team,</p>
                <p>We are preparing the document set for shipment {shipment.reference}. Could you please share the following outstanding items when convenient?</p>
                <ul className="list-disc pl-5">{missing.map((item) => <li key={item.name}>{item.name}</li>)}</ul>
                <p>Thank you,<br />Logistics coordination team</p>
              </div>
            </div>
            <div className="mt-5 flex flex-wrap items-center gap-3">
              <Button variant="hero" disabled={!draftReady || approved} onClick={() => setApproved(true)}>
                <CheckCircle2 /> {approved ? "Sample approved" : "Approve sample draft"}
              </Button>
              <Button variant="outline" disabled={!draftReady} onClick={() => { setDraftReady(false); setApproved(false); }}>
                Reset demo
              </Button>
              {approved && <span role="status" className="text-sm text-emerald-700 dark:text-emerald-300">Simulated approval recorded in this page only.</span>}
            </div>
            <div className="mt-4 rounded-lg bg-muted/40 p-3 text-xs text-muted-foreground">Approval is a visual simulation. It does not create an audit record or send the message.</div>
          </div>
        </div>
      </section>

      <section className="container-page section-pad border-t border-border">
        <SectionHeader eyebrow="Workflow concept" title="From missing documents to a reviewed follow-up" description="A proposed workflow can organize checklist status, draft customer messages and keep consequential communication behind a human approval step." />
        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {[
            ["01", "Track the checklist", "Show required, received and outstanding documents by shipment."],
            ["02", "Prepare a draft", "Compose a context-specific reminder based on the missing items."],
            ["03", "Review before sending", "A coordinator checks the draft and explicitly approves the next action."],
          ].map(([number, title, body]) => <article key={number} className="rounded-xl border border-border bg-card p-5"><p className="eyebrow">{number}</p><h3 className="mt-2 font-semibold">{title}</h3><p className="mt-2 text-sm text-muted-foreground">{body}</p></article>)}
        </div>
      </section>
      <CtaBand title="Discuss shipment follow-ups in your operation." description="Tell us about your document requirements, email workflows and approval process." />
    </>
  );
}
