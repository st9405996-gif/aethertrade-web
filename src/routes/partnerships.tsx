import { createFileRoute } from "@tanstack/react-router";
import { getPublishedCmsPage, mergeCmsHead } from "@/lib/public-cms.functions";
import { CmsPageSections } from "@/components/site/cms-page-renderer";
import { getPublishedContentRecords } from "@/lib/public-content-records.functions";
import { PageHero } from "@/components/site/section";
import { CardGrid, meta, PlaceholderNote } from "@/components/site/blocks";
import { CtaBand } from "@/components/site/cta-band";
import { PARTNERSHIP_TYPES } from "@/content/site-content";

export const Route = createFileRoute("/partnerships")({
  loader: async () => ({
    cmsPage: await getPublishedCmsPage({ data: { slug: "partnerships" } }),
    items: await getPublishedContentRecords({ data: { module: "partnerships" } }),
  }),
  head: ({ loaderData }) => mergeCmsHead(meta("Partnerships", "Partner with AETHER-TRADE as a technology provider, implementation partner or industry association."), loaderData?.cmsPage),
  component: PartnershipsPage,
});
function PartnershipsPage() {
  const { items, cmsPage } = Route.useLoaderData();
  const cards = items.length ? items.map(item => ({ title: item.title, body: item.body })) : PARTNERSHIP_TYPES;
  return <>
    <PageHero eyebrow="Partnerships" title="Build Better Trade Operations Together." description="We're open to working with organizations that serve importers, exporters and logistics businesses." />
    <section className="container-page section-pad space-y-8">
      <CardGrid items={cards} />
      <PlaceholderNote>No partnerships are announced yet — we'll list partners here only once agreed</PlaceholderNote>
    </section>
    <CmsPageSections page={cmsPage} />
      <CtaBand title="Interested in partnering?" description="Get in touch and tell us how you'd like to work together." />
  </>;
}
