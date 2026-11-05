import { createFileRoute } from "@tanstack/react-router";
import { getPublishedCmsPage } from "@/lib/public-cms.functions";
import { PageHero } from "@/components/site/section";
import { CardGrid, meta } from "@/components/site/blocks";
import { CtaBand } from "@/components/site/cta-band";
import { INDUSTRIES } from "@/content/site-content";

export const Route = createFileRoute("/industries")({
  loader: async () => ({ cmsPage: await getPublishedCmsPage({ data: { slug: "industries" } }) }),
  head: () =>
    meta("Industries", "Trade operations support across textiles, agriculture, machinery, consumer goods, chemicals and electronics."),
  component: IndustriesPage,
});

function IndustriesPage() {
  return (
    <>
      <PageHero
        eyebrow="Industries"
        title="Every Sector Trades Differently."
        description="The documents and exceptions vary by industry. These are the patterns we design around."
      />
      <section className="container-page section-pad">
        <CardGrid items={INDUSTRIES} />
      </section>
      <CtaBand title="Tell us about your sector." description="We'll map your document and exception patterns." />
    </>
  );
}
