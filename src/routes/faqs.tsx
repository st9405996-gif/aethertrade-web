import { createFileRoute } from "@tanstack/react-router";
import { getPublishedCmsPage, mergeCmsHead } from "@/lib/public-cms.functions";
import { CmsPageSections } from "@/components/site/cms-page-renderer";
import { getPublishedContentRecords } from "@/lib/public-content-records.functions";
import { PageHero } from "@/components/site/section";
import { FaqList, meta } from "@/components/site/blocks";
import { CtaBand } from "@/components/site/cta-band";
import { FAQS } from "@/content/site-content";

export const Route = createFileRoute("/faqs")({
  loader: async () => ({
    cmsPage: await getPublishedCmsPage({ data: { slug: "faqs" } }),
    items: await getPublishedContentRecords({ data: { module: "faqs" } }),
  }),
  head: ({ loaderData }) => {
    const faqs = loaderData?.items?.map(item => ({ q: item.title, a: item.body })) || FAQS;
    return mergeCmsHead({
      ...meta("FAQs", "Answers about AETHER-TRADE availability, AI and human review, document security and how engagements start."),
      scripts: [{
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: faqs.map(item => ({ "@type": "Question", name: item.q, acceptedAnswer: { "@type": "Answer", text: item.a } })),
        }),
      }],
    }, loaderData?.cmsPage);
  },
  component: FaqsPage,
});
function FaqsPage() {
  const { items, cmsPage } = Route.useLoaderData();
  const faqs = items.length ? items.map(item => ({ q: item.title, a: item.body })) : FAQS;
  return <>
    <PageHero eyebrow="FAQs" title="Straight Answers." description="What we do, what we don't, and how working with us starts." />
    <section className="container-page section-pad"><FaqList items={faqs} /></section>
    <CmsPageSections page={cmsPage} />
      <CtaBand title="Still have a question?" description="Ask us directly — we'll give you a straight answer." />
  </>;
}
