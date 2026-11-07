import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { getPublishedCmsPage, mergeCmsHead } from "@/lib/public-cms.functions";
import { CmsPageSections } from "@/components/site/cms-page-renderer";
import { getPublishedContentRecords } from "@/lib/public-content-records.functions";
import { PageHero } from "@/components/site/section";
import { EmptyContentState, meta } from "@/components/site/blocks";
import { CtaBand } from "@/components/site/cta-band";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/automations")({
  loader: async () => ({
    cmsPage: await getPublishedCmsPage({ data: { slug: "automations" } }),
    items: await getPublishedContentRecords({ data: { module: "automations" } }),
  }),
  head: ({ loaderData }) =>
    mergeCmsHead(
      meta(
        "Automation Catalogue",
        "Catalogue of trade-operations automations — inquiry triage, shipment follow-up, document intake, reconciliation, reporting and custom AI agents — each with its availability status.",
      ),
      loaderData?.cmsPage,
    ),
  component: AutomationsPage,
});
function AutomationsPage() {
  const { items: records, cmsPage } = Route.useLoaderData();
  const items = records.map((item) => ({
    slug: item.slug,
    name: item.title,
    category: item.category,
    problem: item.fields["problem"] || "",
    whatItDoes: item.body,
    exampleWorkflow: item.fields["workflow"] || "",
    deploymentModel: item.fields["deployment"] || "",
    integrations: (item.fields["integrations"] || "")
      .split("\n")
      .map((value) => value.trim())
      .filter(Boolean),
    availability: item.availability,
  }));
  const categories = ["All", ...new Set(items.map((item) => item.category).filter(Boolean))];
  const [cat, setCat] = useState("All");
  const filtered = cat === "All" ? items : items.filter((item) => item.category === cat);
  return (
    <>
      <PageHero
        eyebrow="Automation catalogue"
        title="Custom Automation for Real Trade Workflows."
        description="Explore example workflows. We adapt architecture, integrations and approval controls to your business during an operations audit."
      />
      <section className="container-page section-pad">
        <div className="mb-8 flex flex-wrap gap-2" role="group" aria-label="Filter by category">
          {categories.map((category) => (
            <Button
              key={category}
              size="sm"
              variant={category === cat ? "default" : "outline"}
              aria-pressed={category === cat}
              onClick={() => setCat(category)}
            >
              {category}
            </Button>
          ))}
        </div>
        {filtered.length ? (
          <div className="grid gap-5 md:grid-cols-2">
            {filtered.map((item) => (
              <article
                key={item.slug}
                className="flex flex-col rounded-xl border border-border bg-card p-6"
              >
                <p className="eyebrow mb-1">{item.category}</p>
                <h2 className="text-lg font-semibold">{item.name}</h2>
                <p className="mt-2 text-xs text-muted-foreground">
                  Availability: {item.availability}
                </p>
                <dl className="mt-4 space-y-3 text-sm">
                  {item.problem && (
                    <div>
                      <dt className="font-medium">Problem</dt>
                      <dd className="text-muted-foreground">{item.problem}</dd>
                    </div>
                  )}
                  <div>
                    <dt className="font-medium">What it does</dt>
                    <dd className="text-muted-foreground">{item.whatItDoes}</dd>
                  </div>
                  {item.exampleWorkflow && (
                    <div>
                      <dt className="font-medium">Example workflow</dt>
                      <dd className="text-muted-foreground">{item.exampleWorkflow}</dd>
                    </div>
                  )}
                  {item.deploymentModel && (
                    <div>
                      <dt className="font-medium">Deployment</dt>
                      <dd className="text-muted-foreground">{item.deploymentModel}</dd>
                    </div>
                  )}
                  {item.integrations.length > 0 && (
                    <div>
                      <dt className="font-medium">Integrations</dt>
                      <dd className="text-muted-foreground">{item.integrations.join(", ")}</dd>
                    </div>
                  )}
                </dl>
                <div className="mt-auto pt-5">
                  <Button size="sm" variant="outline" asChild>
                    <Link to="/request-demo" search={{ automation: item.slug }}>
                      Book an Operations Audit
                    </Link>
                  </Button>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <EmptyContentState>No published automations are available.</EmptyContentState>
        )}
      </section>
      <CmsPageSections page={cmsPage} />
      <CtaBand
        title="Need something not listed?"
        description="Custom automations and AI agents are built to your workflow."
      />
    </>
  );
}
