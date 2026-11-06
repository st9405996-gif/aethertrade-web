import { createFileRoute } from "@tanstack/react-router";
import { getPublishedCmsPage, mergeCmsHead } from "@/lib/public-cms.functions";
import { CmsPageSections } from "@/components/site/cms-page-renderer";
import { getPublishedContentRecords } from "@/lib/public-content-records.functions";
import { PageHero } from "@/components/site/section";
import { CardGrid, meta } from "@/components/site/blocks";
import { CtaBand } from "@/components/site/cta-band";
import { INDUSTRIES } from "@/content/site-content";

export const Route = createFileRoute("/industries")({
  loader: async () => ({
    cmsPage: await getPublishedCmsPage({ data: { slug: "industries" } }),
    items: await getPublishedContentRecords({ data: { module: "industries" } }),
  }),
  head: ({ loaderData }) => mergeCmsHead(meta("Industries", "Trade operations support across textiles, agriculture, machinery, consumer goods, chemicals and electronics."), loaderData?.cmsPage),
  component: IndustriesPage,
});
function IndustriesPage() {
  const { items, cmsPage } = Route.useLoaderData();
  const cards = items.length ? items.map(item => ({ title: item.title, body: item.body })) : INDUSTRIES;
  return <>
    <PageHero eyebrow="Industries" title="Every Sector Trades Differently." description="The documents and exceptions vary by industry. These are the patterns we design around." />
    <section className="container-page section-pad"><CardGrid items={cards} /></section>
    <CmsPageSections page={cmsPage} />
      <CtaBand title="Tell us about your sector." description="We'll map your document and exception patterns." />
  </>;
}
