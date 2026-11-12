import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowRight, CheckCircle2, FileText, ScanText, ShieldCheck, CircleAlert, ClipboardCheck, Eye } from "lucide-react";
import { PageHero, SectionHeader } from "@/components/site/section";
import { Button } from "@/components/ui/button";
import { CtaBand } from "@/components/site/cta-band";
import { meta } from "@/components/site/blocks";

const stages = [
  { title: "Choose sample", description: "A preloaded commercial invoice is selected.", icon: FileText },
  { title: "Identify document", description: "The sample is categorized as a commercial invoice.", icon: ScanText },
  { title: "Extract fields", description: "Values are shown as a structured record.", icon: ClipboardCheck },
  { title: "Check exceptions", description: "Missing or uncertain fields are flagged.", icon: CircleAlert },
  { title: "Human review", description: "An operator reviews the output before use.", icon: Eye },
];
const data = [["Invoice number","INV-2048","Matched"],["Invoice date","12 Nov 2026","Matched"],["Exporter","Northstar Components Ltd.","Matched"],["Importer","Harborline Trading FZE","Matched"],["Goods description","Industrial valve assemblies","Review"],["Quantity","240 units","Matched"],["Currency","USD","Matched"],["Invoice total","USD 18,720.00","Matched"],["HS code","Not stated in sample","Missing"]];

export const Route = createFileRoute("/document-intake")({
 head: () => ({ ...meta("Trade Document Intake Demo","Guided illustrative document intake workflow."), links:[{rel:"canonical",href:"https://aethertrade.cloud/document-intake"}] }),
 component: Page,
});
function Page() {
 const [stage,setStage] = useState(0);
 const done = stage === stages.length - 1;
 const Icon = stages[stage].icon;
 return <>
  <PageHero eyebrow="Product demo · sample simulation" title="Watch a trade document move through a workflow." description="Step through document selection, classification, structured extraction, exception checks and human review. Each stage explains what the workflow is doing and what an operator receives.">
   <Button variant="hero" onClick={()=>setStage(1)}>Start walkthrough <ArrowRight /></Button>
   <Button variant="outline" asChild><Link to="/shipment-follow-up">Explore Shipment Follow-Up</Link></Button>
  </PageHero>
  <section className="container-page section-pad">
   <div className="mb-5 flex flex-wrap justify-between gap-3 rounded-xl border border-amber-500/30 bg-amber-500/5 p-4 text-sm"><span className="font-semibold"><ShieldCheck className="mr-2 inline size-4"/>DEMO ENVIRONMENT — SAMPLE DATA ONLY</span><span className="text-muted-foreground">No live OCR, customs checks, upload or integration.</span></div>
   <div className="grid gap-6 xl:grid-cols-[0.75fr_1.25fr]">
    <aside className="rounded-2xl border border-border bg-card p-5">
     <p className="eyebrow">Workflow run · DEMO-2048</p><h2 className="mt-2 text-xl font-semibold">Commercial invoice</h2><p className="text-sm text-muted-foreground">INV-2048 · sample document</p>
     <div className="mt-5 space-y-2">{stages.map((s,i)=>{const I=s.icon;return <button key={s.title} onClick={()=>setStage(i)} className={i===stage?"flex w-full gap-3 rounded-xl border border-primary bg-primary/5 p-3 text-left":"flex w-full gap-3 rounded-xl border border-border p-3 text-left hover:bg-muted/40"}><span className="mt-1">{i<stage?<CheckCircle2 className="size-4 text-emerald-600"/>:<I className="size-4"/>}</span><span><span className="flex flex-wrap justify-between gap-2 font-medium">{i+1}. {s.title}<span className="text-[10px] uppercase text-muted-foreground">{i<stage?"Complete":i===stage?"Active":"Waiting"}</span></span><span className="mt-1 block text-xs text-muted-foreground">{s.description}</span></span></button>})}</div>
     <div className="mt-5 flex gap-2"><Button variant="outline" className="flex-1" disabled={stage===0} onClick={()=>setStage(s=>Math.max(0,s-1))}>Previous</Button><Button className="flex-1" onClick={()=>setStage(done?0:stage+1)}>{done?"Restart":"Next stage"} <ArrowRight/></Button></div><p className="mt-3 text-center text-xs text-muted-foreground">Stage {stage+1} of {stages.length} · Click any stage</p>
    </aside>
    <main className="min-h-[500px] rounded-2xl border border-border bg-card p-6 sm:p-8">
     <p className="eyebrow">Stage {String(stage+1).padStart(2,"0")} / 05</p><h2 className="mt-2 text-2xl font-semibold">{stages[stage].title}</h2><p className="mt-2 text-sm text-muted-foreground">{stages[stage].description}</p>
     {stage===0&&<div className="mt-6 grid gap-4 md:grid-cols-2"><div className="flex min-h-60 flex-col items-center justify-center rounded-xl border-2 border-dashed border-primary/30 bg-primary/5 p-5 text-center"><FileText className="size-12 text-primary"/><p className="mt-3 font-semibold">INV-2048.pdf</p><p className="text-sm text-muted-foreground">2 pages · sample file</p><span className="mt-3 rounded-full bg-emerald-500/10 px-3 py-1 text-xs text-emerald-700">Preloaded</span></div><div className="rounded-xl bg-muted/40 p-5"><h3 className="font-semibold">Source panel</h3><p className="mt-2 text-sm text-muted-foreground">Shows document name, reference and case association. Nothing is uploaded or connected to a customer system.</p><Button className="mt-5" onClick={()=>setStage(1)}>Identify document <ArrowRight/></Button></div></div>}
     {stage===1&&<div className="mt-6 grid gap-4 sm:grid-cols-2"><div className="rounded-xl border p-5"><ScanText className="size-8 text-primary"/><p className="mt-4 text-lg font-semibold">Commercial Invoice</p><p className="text-sm text-muted-foreground">Illustrative document category</p><div className="mt-4 h-2 rounded-full bg-muted"><div className="h-full w-[92%] rounded-full bg-primary"/></div><p className="mt-2 text-xs text-muted-foreground">92% sample confidence indicator (static)</p></div><div className="rounded-xl bg-muted/40 p-5"><h3 className="font-semibold">Routing decision</h3><p className="mt-2 text-sm text-muted-foreground">Sample is routed to an invoice template. Real classifier quality would need testing against client documents.</p><Button className="mt-5" onClick={()=>setStage(2)}>Extract fields <ArrowRight/></Button></div></div>}
     {stage===2&&<div className="mt-6"><div className="mb-3 flex justify-between"><span className="font-semibold">Structured output preview</span><span className="text-xs text-muted-foreground">9 sample fields</span></div><div className="overflow-hidden rounded-xl border"><div className="grid grid-cols-[1fr_1.2fr_auto] gap-2 bg-muted/50 p-3 text-xs font-medium"><span>Field</span><span>Sample value</span><span>Status</span></div>{data.map(([n,v,status])=><div key={n} className="grid grid-cols-[1fr_1.2fr_auto] gap-2 border-t p-3 text-sm"><span className="text-muted-foreground">{n}</span><span className="font-medium">{v}</span><span className={status==="Missing"?"text-amber-700":"text-muted-foreground"}>{status}</span></div>)}</div><Button className="mt-4" onClick={()=>setStage(3)}>Run checks <ArrowRight/></Button></div>}
     {stage===3&&<div className="mt-6"><div className="grid gap-3 sm:grid-cols-3"><div className="rounded-xl bg-emerald-500/10 p-4"><CheckCircle2 className="text-emerald-600"/><p className="mt-2 text-2xl font-semibold">7</p><p className="text-xs text-muted-foreground">Matched fields</p></div><div className="rounded-xl bg-amber-500/10 p-4"><CircleAlert className="text-amber-600"/><p className="mt-2 text-2xl font-semibold">2</p><p className="text-xs text-muted-foreground">Flagged for review</p></div><div className="rounded-xl bg-muted/50 p-4"><ClipboardCheck/><p className="mt-2 text-2xl font-semibold">1</p><p className="text-xs text-muted-foreground">Sample check set</p></div></div><div className="mt-5 rounded-xl border border-amber-500/30 bg-amber-500/5 p-4"><p className="font-semibold">Exception queue</p><p className="mt-2 text-sm">HS code is absent and goods description needs verification. This is a completeness illustration, not customs classification or compliance advice.</p></div><Button className="mt-5" onClick={()=>setStage(4)}>Review output <ArrowRight/></Button></div>}
     {stage===4&&<div className="mt-6"><div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-5"><p className="font-semibold"><Eye className="mr-2 inline size-5 text-amber-600"/>Human review required</p><p className="mt-2 text-sm text-muted-foreground">An operator checks missing or uncertain fields. The demo does not approve, submit or clear a customs declaration.</p></div><div className="mt-4 grid gap-3 sm:grid-cols-2"><div className="rounded-xl border p-4"><p className="text-xs text-muted-foreground">Output</p><p className="mt-1 font-semibold">INV-2048 · Structured preview</p><p className="text-sm text-muted-foreground">9 fields organized</p></div><div className="rounded-xl border p-4"><p className="text-xs text-muted-foreground">Next operator action</p><p className="mt-1 font-semibold">Confirm flagged fields</p><p className="text-sm text-muted-foreground">Review remains pending</p></div></div><Button variant="outline" className="mt-5" onClick={()=>setStage(0)}>Restart walkthrough</Button></div>}
     <div className="mt-6 flex items-center gap-2 border-t pt-4 text-xs text-muted-foreground"><Icon className="size-4"/> Visible run state · current stage and output panel</div>
    </main>
   </div>
  </section>
  <section className="container-page section-pad border-t border-border"><SectionHeader eyebrow="What the client sees" title="A visible path from input to reviewed output." description="This guided demo makes stages, intermediate results, exceptions and human control explicit. Production capabilities would be scoped and validated separately."/><div className="mt-8 grid gap-4 md:grid-cols-3">{[["01","Traceable workflow","Current stage, finished steps and pending tasks are visible."],["02","Exceptions surfaced","Missing and unclear values appear in a review queue."],["03","Operator remains in control","The workflow ends at review, not an implied customs approval."]].map(([n,t,d])=><article key={n} className="rounded-xl border border-border bg-card p-5"><p className="eyebrow">{n}</p><h3 className="mt-2 font-semibold">{t}</h3><p className="mt-2 text-sm text-muted-foreground">{d}</p></article>)}</div></section>
  <CtaBand title="Scope a real document-intake pilot." description="Discuss sample documents, validation rules, reviewer controls and integrations."/>
 </>;
}
