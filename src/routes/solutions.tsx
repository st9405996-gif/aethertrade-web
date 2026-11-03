import { createFileRoute, Link } from "@tanstack/react-router";
import { PageHero, SectionHeader } from "@/components/site/section";
import { meta } from "@/components/site/blocks";
import { CtaBand } from "@/components/site/cta-band";
import { Button } from "@/components/ui/button";
import { SOLUTIONS } from "@/content/site-content";

export const Route = createFileRoute("/solutions")({
  head: () =>
    meta(
      "Solutions",
      "Solutions for importers, exporters, freight forwarders, logistics operators and trading companies.",
    ),
  component: SolutionsPage,
});

function SolutionsPage() {
  return (
    <>
      <PageHero
        eyebrow="Solutions"
        title="Built Around How Your Business Trades."
        description="Different roles in global trade face different operational problems. Here is where we focus for each."
      >
        <Button variant="outline" asChild>
          <Link to="/industries">Browse by industry</Link>
        </Button>
      </PageHero>
      <section className="container-page section-pad space-y-6">
        <SectionHeader eyebrow="By business type" title="Who we help" />
        {SOLUTIONS.map((s) => (
          <article key={s.slug} id={s.slug} className="grid gap-6 rounded-xl border border-border bg-card p-6 md:grid-cols-3">
            <div>
              <h3 className="text-xl font-semibold">{s.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{s.audience}</p>
            </div>
            <div>
              <p className="eyebrow mb-2">Common challenges</p>
              <ul className="list-disc space-y-1 pl-5 text-sm">{s.challenges.map((c) => <li key={c}>{c}</li>)}</ul>
            </div>
            <div>
              <p className="eyebrow mb-2">How we help</p>
              <ul className="list-disc space-y-1 pl-5 text-sm">{s.helps.map((c) => <li key={c}>{c}</li>)}</ul>
            </div>
          </article>
        ))}
      </section>
      <CtaBand title="Don't see your exact situation?" description="Most operations are a mix. Tell us about yours." />
    </>
  );
}
