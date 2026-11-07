import { createFileRoute, Link } from "@tanstack/react-router";
import { getPublishedCmsPage, mergeCmsHead } from "@/lib/public-cms.functions";
import { CmsPageSections } from "@/components/site/cms-page-renderer";
import { getPublishedContentRecords } from "@/lib/public-content-records.functions";
import { PageHero, SectionHeader } from "@/components/site/section";
import { CardGrid, EmptyContentState, meta } from "@/components/site/blocks";
import { CtaBand } from "@/components/site/cta-band";
import { Button } from "@/components/ui/button";
import { parseAvailabilityStatus } from "@/lib/availability-status";

export const Route = createFileRoute("/platform")({
  loader: async () => ({
    cmsPage: await getPublishedCmsPage({ data: { slug: "platform" } }),
    items: await getPublishedContentRecords({ data: { module: "platform" } }),
  }),
  head: ({ loaderData }) =>
    mergeCmsHead(
      meta(
        "Platform",
        "One intelligent platform for connected trade operations: case workspaces, document intelligence, cross-document checks and human-reviewed workflows.",
      ),
      loaderData?.cmsPage,
    ),
  component: PlatformPage,
});
function PlatformPage() {
  const { items, cmsPage } = Route.useLoaderData();
  const cards = items.map((item) => {
    const status =
      parseAvailabilityStatus(item.availability) ??
      (item.availability.trim() ? undefined : "Custom Build");
    return {
      title: item.title,
      body: item.body,
      ...(status ? { status } : {}),
      points: (item.fields["capabilities"] || "")
        .split("\n")
        .map((x) => x.trim())
        .filter(Boolean),
    };
  });
  return (
    <>
      <PageHero
        eyebrow="The platform"
        title="Automation Engineering for Connected Trade Operations."
        description="We design and implement document intelligence, controlled rule engines and connected workflows around your existing systems and approval processes."
      >
        <Button variant="outline" asChild>
          <Link to="/how-it-works">See how engagements work</Link>
        </Button>
      </PageHero>
      <section className="container-page section-pad">
        <SectionHeader
          eyebrow="Modules"
          title="What we can engineer with your team"
          description="Every engagement is scoped around your systems, operational constraints and measurable outcomes."
        />
        <div className="mt-12">
          {cards.length ? (
            <CardGrid items={cards} />
          ) : (
            <EmptyContentState>No published platform content is available.</EmptyContentState>
          )}
        </div>
      </section>
      <section className="border-t border-border">
        <div className="container-page section-pad grid gap-8 md:grid-cols-3">
          {[
            [
              "Human review by design",
              "AI identifies and compares; people approve. Every decision is attributable.",
            ],
            [
              "Evidence, not guesses",
              "Flags point to the exact document and field so reviewers can verify quickly.",
            ],
            [
              "Fits around your tools",
              "Built to work alongside email, spreadsheets and existing systems.",
            ],
          ].map(([title, body]) => (
            <div key={title}>
              <h3 className="font-semibold">{title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{body}</p>
            </div>
          ))}
        </div>
      </section>
      <CmsPageSections page={cmsPage} />
      <CtaBand
        title="Map the highest-friction workflow in your operation."
        description="We'll walk through the modules most relevant to your workflows."
      />
    </>
  );
}
