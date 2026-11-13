import { useEffect, useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowRight, CheckCircle2, CircleAlert, FileText, Loader2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { buildShipmentReadinessScenario, SHIPMENT_READINESS_SCENARIOS, type ShipmentReadinessDemoResult, type ShipmentReadinessScenarioId } from "@/lib/shipment-readiness-demo";
const stages = ["Reading sample documents", "Comparing key details", "Preparing findings"];
export function ShipmentReadinessDemo() {
  const [scenarioId, setScenarioId] = useState<ShipmentReadinessScenarioId>("quantity-mismatch");
  const [result, setResult] = useState<ShipmentReadinessDemoResult | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [stage, setStage] = useState(0);
  const [monthlyVolume, setMonthlyVolume] = useState("");
  const selectedScenario = useMemo(() => buildShipmentReadinessScenario(scenarioId), [scenarioId]);
  useEffect(() => {
    if (!analyzing) { setStage(0); return; }
    const timer = window.setInterval(() => setStage((current) => Math.min(current + 1, stages.length - 1)), 550);
    return () => window.clearInterval(timer);
  }, [analyzing]);
  async function analyze() {
    const deterministicResult = buildShipmentReadinessScenario(scenarioId);
    setResult(deterministicResult);
    setAnalyzing(true);
    try {
      const response = await fetch("/api/demo/shipment-readiness", {
        method: "POST", headers: { "content-type": "application/json" },
        body: JSON.stringify({ scenarioId }),
      });
      if (!response.ok) throw new Error("Demo explanation is unavailable.");
      const payload = (await response.json()) as ShipmentReadinessDemoResult;
      if (payload.scenarioId !== scenarioId || !Array.isArray(payload.findings) ||
          typeof payload.explanation !== "string" || !Array.isArray(payload.questions)) {
        throw new Error("Unexpected demo response.");
      }
      setResult(payload);
    } catch { setResult(deterministicResult); }
    finally { setAnalyzing(false); }
  }
  return (
    <section id="interactive-demo" className="container-page section-pad scroll-mt-24">
      <div className="mx-auto max-w-5xl">
        <div className="max-w-3xl">
          <p className="eyebrow">Try the interactive sample</p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight">See how shipment document checks can surface exceptions.</h2>
          <p className="mt-3 text-muted-foreground">Choose a fictional shipment scenario. Deterministic checks perform the comparison; an optional AI explanation makes the result easier to understand.</p>
        </div>
        <div className="mt-7 grid gap-3 md:grid-cols-3">
          {SHIPMENT_READINESS_SCENARIOS.map((scenario, index) => {
            const active = scenario.id === scenarioId;
            return (
              <button key={scenario.id} type="button" aria-pressed={active}
                onClick={() => { setScenarioId(scenario.id); setResult(null); }}
                className={"rounded-xl border p-4 text-left transition-colors " +
                  (active ? "border-primary bg-primary/5 ring-1 ring-primary/20" : "border-border bg-card hover:border-primary/50")}>
                <span className="eyebrow">Scenario 0{index + 1}</span>
                <span className="mt-2 block font-semibold">{scenario.title}</span>
                <span className="mt-2 block text-sm text-muted-foreground">{scenario.summary}</span>
              </button>
            );
          })}
        </div>
        <div className="mt-5 rounded-2xl border border-border bg-card p-5 sm:p-6">
          <div className="flex items-center gap-2"><FileText className="size-5 text-primary" /><h3 className="text-lg font-semibold">Fictional sample documents</h3></div>
          <p className="mt-1 text-sm text-muted-foreground">These examples are invented for demonstration and are not customer records.</p>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            {selectedScenario.documents.map((document) => (
              <article key={document.name} className="min-w-0 rounded-xl border border-border p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h4 className="text-sm font-semibold">{document.name}</h4>
                  <span className={"rounded-full px-2 py-1 text-xs " +
                    (document.received ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300" : "bg-amber-500/10 text-amber-700 dark:text-amber-300")}>
                    {document.received ? "Included" : "Missing"}
                  </span>
                </div>
                <pre className="mt-3 whitespace-pre-wrap break-words rounded-lg bg-muted/50 p-3 text-xs leading-5 text-muted-foreground">{document.content}</pre>
              </article>
            ))}
          </div>
          <Button className="mt-5" onClick={analyze} disabled={analyzing}>
            {analyzing ? <Loader2 className="animate-spin" /> : <Sparkles />}
            {analyzing ? "Reviewing sample…" : "Analyze this scenario"}
          </Button>
          <p className="mt-3 text-xs text-muted-foreground">Sample-only demonstration. This does not submit documents or make customs-clearance decisions.</p>
        </div>
        {analyzing && (
          <ol aria-live="polite" className="mt-5 grid gap-2 rounded-xl border border-border bg-card p-4 sm:grid-cols-3">
            {stages.map((label, index) => (
              <li key={label} className={"flex items-center gap-2 text-sm " +
                (index === stage ? "font-medium text-primary animate-pulse" : "text-muted-foreground")}>
                {index < stage ? <CheckCircle2 className="size-4" /> :
                  <span className="flex size-5 items-center justify-center rounded-full border text-[10px]">{index + 1}</span>}
                {label}
              </li>
            ))}
          </ol>
        )}
        {result && (
          <div className="mt-5 space-y-4" aria-live="polite">
            <div className="rounded-2xl border border-border bg-card p-5 sm:p-6">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div><p className="eyebrow">Review result</p><h3 className="mt-1 text-xl font-semibold">{result.title}</h3></div>
                <span className="rounded-full bg-amber-500/10 px-3 py-1 text-xs font-medium text-amber-700 dark:text-amber-300">Human review needed</span>
              </div>
              <div className="mt-4 space-y-3">
                {result.findings.map((finding) => (
                  <article key={finding.id} className="rounded-xl border border-border p-4">
                    <div className="flex items-start gap-2">
                      <CircleAlert className="mt-0.5 size-5 shrink-0 text-amber-600" />
                      <div className="min-w-0"><h4 className="font-semibold">{finding.label}: {finding.status}</h4><p className="mt-1 text-sm text-muted-foreground">{finding.detail}</p></div>
                    </div>
                    <div className="mt-3 grid gap-2 sm:grid-cols-2">
                      {finding.evidence.map((item) => (
                        <div key={item.document} className="rounded-lg bg-muted/50 p-3 text-sm">
                          <p className="text-xs text-muted-foreground">{item.document}</p><p className="mt-1 font-medium">{item.value}</p>
                        </div>
                      ))}
                    </div>
                  </article>
                ))}
              </div>
              <div className="mt-4 rounded-xl bg-muted/40 p-4">
                <div className="flex items-center gap-2"><Sparkles className="size-4 text-primary" /><h4 className="text-sm font-semibold">{result.aiStatus === "ai" ? "AI explanation" : "Rule-based explanation"}</h4></div>
                <p className="mt-2 text-sm leading-6">{result.explanation}</p>
                {result.aiStatus !== "ai" && <p className="mt-2 text-xs text-muted-foreground">Detailed AI explanation is temporarily unavailable. The deterministic finding above is still available.</p>}
                <h5 className="mt-4 text-sm font-semibold">Clarification questions</h5>
                <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-muted-foreground">{result.questions.map((question) => <li key={question}>{question}</li>)}</ul>
              </div>
              <div className="mt-4 border-l-2 border-amber-500/60 pl-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Possible operational impact</p>
                <p className="mt-1 text-sm text-muted-foreground">{result.riskNote}</p>
              </div>
            </div>
            <div className="rounded-2xl border border-primary/20 bg-primary/5 p-5 sm:p-6">
              <p className="eyebrow">Next step</p><h3 className="mt-2 text-xl font-semibold">Want this built for your shipments?</h3>
              <label className="mt-4 grid max-w-md gap-2 text-sm font-medium">
                How many shipments does your team handle a month?
                <select className="h-11 rounded-md border border-input bg-background px-3 font-normal" value={monthlyVolume} onChange={(event) => setMonthlyVolume(event.target.value)}>
                  <option value="">Select monthly volume</option><option value="1–10">1–10</option><option value="11–50">11–50</option><option value="50+">50+</option>
                </select>
              </label>
              <div className="mt-4">
                {monthlyVolume ? (
                  <Button asChild variant="hero"><Link to="/request-demo" search={{ automation: "shipment-readiness", shipmentVolume: monthlyVolume }}>Request a pilot discussion <ArrowRight /></Link></Button>
                ) : <Button variant="hero" disabled>Select your monthly shipment volume <ArrowRight /></Button>}
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
