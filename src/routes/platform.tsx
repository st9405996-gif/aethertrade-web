import { createFileRoute, Link } from "@tanstack/react-router";
import { PageHero, SectionHeader } from "@/components/site/section";
import { CardGrid, meta } from "@/components/site/blocks";
import { CtaBand } from "@/components/site/cta-band";
import { Button } from "@/components/ui/button";
import { PLATFORM_MODULES } from "@/content/site-content";

export const Route = createFileRoute("/platform")({
  head: () =>
    meta(
      "Platform",
      "One intelligent platform for connected trade operations: case workspaces, document intelligence, cross-document checks and human-reviewed workflows.",
    ),
  component: PlatformPage,
});

function PlatformPage() {
  return (
    <>
      <PageHero
        eyebrow="The platform"
        title="One Intelligent Platform for Connected Trade Operations."
        description="Trade document intelligence, workflow automation and operational visibility — organized around your shipments and cases, with people in control of every decision."
      >
        <Button variant="outline" asChild>
          <Link to="/how-it-works">See how engagements work</Link>
        </Button>
      </PageHero>
      <section className="container-page section-pad">
        <SectionHeader
          eyebrow="Modules"
          title="What the platform is made of"
          description="Each module is labelled with its current status. Nothing marked In Development or Planned is presented as a live product."
        />
        <div className="mt-12">
          <CardGrid items={PLATFORM_MODULES.map((m) => ({ ...m }))} />
        </div>
      </section>
      <section className="border-t border-border">
        <div className="container-page section-pad grid gap-8 md:grid-cols-3">
          {[
            ["Human review by design", "AI identifies and compares; people approve. Every decision is attributable."],
            ["Evidence, not guesses", "Flags point to the exact document and field so reviewers can verify quickly."],
            ["Fits around your tools", "Built to work alongside email, spreadsheets and existing systems."],
          ].map(([t, b]) => (
            <div key={t}>
              <h3 className="font-semibold">{t}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{b}</p>
            </div>
          ))}
        </div>
      </section>
      <CtaBand title="See the platform applied to your operation." description="We'll walk through the modules most relevant to your workflows." />
    </>
  );
}
