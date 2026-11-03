import { createFileRoute } from "@tanstack/react-router";
import { PageHero } from "@/components/site/section";
import { meta, PlaceholderNote } from "@/components/site/blocks";
import { CtaBand } from "@/components/site/cta-band";
import { INSIGHTS } from "@/content/site-content";

export const Route = createFileRoute("/insights")({
  head: () =>
    meta("Insights", "Practical writing on trade operations, document workflows and responsible AI in logistics."),
  component: InsightsPage,
});

function InsightsPage() {
  return (
    <>
      <PageHero
        eyebrow="Insights"
        title="Notes on Running Better Trade Operations."
        description="Practical perspectives on documents, workflows and where AI genuinely helps."
      />
      <section className="container-page section-pad space-y-8">
        <PlaceholderNote>Articles coming soon — full posts publish through the CMS</PlaceholderNote>
        <div className="grid gap-5 md:grid-cols-3">
          {INSIGHTS.map((p) => (
            <article key={p.slug} className="rounded-xl border border-border bg-card p-6">
              <p className="eyebrow mb-2">{p.category}</p>
              <h2 className="text-lg font-semibold">{p.title}</h2>
              <p className="mt-2 text-sm text-muted-foreground">{p.excerpt}</p>
            </article>
          ))}
        </div>
      </section>
      <CtaBand title="Have a question we should write about?" description="Tell us what your team is wrestling with." />
    </>
  );
}
