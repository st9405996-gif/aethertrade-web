import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { PageHero } from "@/components/site/section";
import { meta } from "@/components/site/blocks";
import { CtaBand } from "@/components/site/cta-band";
import { Button } from "@/components/ui/button";
import { CATALOGUE_PREVIEW } from "@/lib/catalogue-preview";

export const Route = createFileRoute("/automations")({
  head: () =>
    meta(
      "Automation Catalogue",
      "Catalogue of trade-operations automations — inquiry triage, shipment follow-up, document intake, reconciliation, reporting and custom AI agents — each with its availability status.",
    ),
  component: AutomationsPage,
});

function AutomationsPage() {
  const categories = ["All", ...new Set(CATALOGUE_PREVIEW.map((i) => i.category))];
  const [cat, setCat] = useState("All");
  const items = cat === "All" ? CATALOGUE_PREVIEW : CATALOGUE_PREVIEW.filter((i) => i.category === cat);

  return (
    <>
      <PageHero
        eyebrow="Automation catalogue"
        title="Custom Automation for Real Trade Workflows."
        description="Explore example workflows. We adapt architecture, integrations and approval controls to your business during an operations audit."
      />
      <section className="container-page section-pad">
        <div className="mb-8 flex flex-wrap gap-2" role="group" aria-label="Filter by category">
          {categories.map((c) => (
            <Button key={c} size="sm" variant={c === cat ? "default" : "outline"} aria-pressed={c === cat} onClick={() => setCat(c)}>
              {c}
            </Button>
          ))}
        </div>
        <div className="grid gap-5 md:grid-cols-2">
          {items.map((i) => (
            <article key={i.slug} className="flex flex-col rounded-xl border border-border bg-card p-6">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="eyebrow mb-1">{i.category}</p>
                  <h2 className="text-lg font-semibold">{i.name}</h2>
                </div>

              </div>
              <dl className="mt-4 space-y-3 text-sm">
                <div><dt className="font-medium">Problem</dt><dd className="text-muted-foreground">{i.problem}</dd></div>
                <div><dt className="font-medium">What it does</dt><dd className="text-muted-foreground">{i.whatItDoes}</dd></div>
                <div><dt className="font-medium">Example workflow</dt><dd className="text-muted-foreground">{i.exampleWorkflow}</dd></div>
                <div><dt className="font-medium">Deployment</dt><dd className="text-muted-foreground">{i.deploymentModel}</dd></div>
              </dl>
              <div className="mt-auto pt-5">
                <Button size="sm" variant="outline" asChild>
                  <Link to="/request-demo" search={{ automation: i.slug }}>Book an Operations Audit</Link>
                </Button>
              </div>
            </article>
          ))}
        </div>
      </section>
      <CtaBand title="Need something not listed?" description="Custom automations and AI agents are built to your workflow." />
    </>
  );
}
