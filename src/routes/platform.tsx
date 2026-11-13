import { createFileRoute, Link } from "@tanstack/react-router";
import {
  getPublishedCmsPage,
  mergeCmsHead,
  cmsHero,
  cmsCta,
  cmsGroup,
} from "@/lib/public-cms.functions";
import { CmsPageSections } from "@/components/site/cms-page-renderer";
import { getPublishedContentRecords } from "@/lib/public-content-records.functions";
import { PageHero, SectionHeader } from "@/components/site/section";
import { CardGrid, EmptyContentState, meta } from "@/components/site/blocks";
import { CtaBand } from "@/components/site/cta-band";
import { Button } from "@/components/ui/button";
import { parseAvailabilityStatus } from "@/lib/availability-status";
import { CompanyPositioning } from "@/components/site/company-positioning";

export const Route = createFileRoute("/platform")({
  loader: async () => ({
    cmsPage: await getPublishedCmsPage({ data: { slug: "platform" } }),
    items: await getPublishedContentRecords({ data: { module: "platform" } }),
  }),
  head: ({ loaderData }) =>
    mergeCmsHead(
      meta(
        "Platform",
        "Custom software and workflow automation for trade operations, including document intelligence, case workspaces and optional integrations.",
      ),
      loaderData?.cmsPage,
      { fallbackPath: "/platform", title: "Trade Document Intelligence & Workflow Automation | AETHER-TRADE", description: "Explore AETHER-TRADE's trade case workspace and document intelligence capabilities, plus custom workflow modules scoped around existing systems." },
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
        {...cmsHero(cmsPage, {
          eyebrow: "The platform",
          title: "Automation Engineering for Connected Trade Operations.",
          description:
            "We design and build software applications, document intelligence tools and controlled workflows for trade operations. Solutions can run as standalone applications, with integrations to existing systems scoped when needed.",
        })}
      >
        <Button variant="outline" asChild>
          <Link to="/how-it-works">See how engagements work</Link>
        </Button>
      </PageHero>
      <CompanyPositioning />
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
          {(cmsGroup(cmsPage, "platform-principles").length
            ? cmsGroup(cmsPage, "platform-principles")
            : [
                {
                  id: "fallback-1",
                  title: "Human review by design",
                  body: "AI identifies and compares; people approve. Every decision is attributable.",
                },
                {
                  id: "fallback-2",
                  title: "Evidence, not guesses",
                  body: "Flags point to the exact document and field so reviewers can verify quickly.",
                },
                {
                  id: "fallback-3",
                  title: "Standalone or connected",
                  body: "Purpose-built software can run independently or connect to existing tools when the project requires it.",
                },
              ]
          ).map((item) => (
            <div key={item.id}>
              <h3 className="font-semibold">{item.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{item.body}</p>
            </div>
          ))}
        </div>
      </section>
      <CmsPageSections page={cmsPage} />
      <CtaBand
        {...cmsCta(cmsPage, {
          title: "Map the highest-friction workflow in your operation.",
          description: "We'll walk through the modules most relevant to your workflows.",
        })}
      />
    </>
  );
}
