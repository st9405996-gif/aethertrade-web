import { createFileRoute, Link } from "@tanstack/react-router";
import { getPublishedCmsPage, mergeCmsHead } from "@/lib/public-cms.functions";
import { CmsPageSections } from "@/components/site/cms-page-renderer";
import { getPublishedContentRecords } from "@/lib/public-content-records.functions";
import { PageHero, SectionHeader } from "@/components/site/section";
import { CardGrid, EmptyContentState, meta } from "@/components/site/blocks";
import { CtaBand } from "@/components/site/cta-band";
import { Button } from "@/components/ui/button";
import { parseAvailabilityStatus } from "@/lib/availability-status";

export const Route = createFileRoute("/services")({
  loader: async () => ({
    cmsPage: await getPublishedCmsPage({ data: { slug: "services" } }),
    items: await getPublishedContentRecords({ data: { module: "services" } }),
  }),
  head: ({ loaderData }) =>
    mergeCmsHead(
      meta(
        "Services",
        "Operations assessments, workflow automation builds, custom AI agents, systems integration and pilot support for trade businesses.",
      ),
      loaderData?.cmsPage,
    ),
  component: ServicesPage,
});
function ServicesPage() {
  const { items, cmsPage } = Route.useLoaderData();
  const cards = items.map((item) => {
    const status =
      parseAvailabilityStatus(item.availability) ??
      (item.availability.trim() ? undefined : "Custom Build");
    return {
      title: item.title,
      body: item.body,
      ...(status ? { status } : {}),
      points: (item.fields["deliverables"] || "")
        .split("\n")
        .map((x) => x.trim())
        .filter(Boolean),
    };
  });
  return (
    <>
      <PageHero
        eyebrow="Services"
        title="Hands-On Help to Modernize Trade Operations."
        description="Alongside the platform, we work directly with your team to assess, build and pilot the workflows that matter most."
      >
        <Button variant="outline" asChild>
          <Link to="/custom-solutions">About custom solutions</Link>
        </Button>
      </PageHero>
      <section className="container-page section-pad">
        <SectionHeader eyebrow="What we offer" title="Services" />
        <div className="mt-12">
          {cards.length ? (
            <CardGrid items={cards} />
          ) : (
            <EmptyContentState>No published services are available.</EmptyContentState>
          )}
        </div>
      </section>
      <CmsPageSections page={cmsPage} />
      <CtaBand
        title="Start with an operations assessment."
        description="A clear picture of where automation will — and won't — help."
      />
    </>
  );
}
