import { createFileRoute } from "@tanstack/react-router";
import { getPublishedCmsPage, mergeCmsHead } from "@/lib/public-cms.functions";
import { PageHero } from "@/components/site/section";
import { FaqList, meta } from "@/components/site/blocks";
import { CtaBand } from "@/components/site/cta-band";
import { FAQS } from "@/content/site-content";

export const Route = createFileRoute("/faqs")({
  loader: async () => ({ cmsPage: await getPublishedCmsPage({ data: { slug: "faqs" } }) }),
  head:  ({ loaderData }) => mergeCmsHead((() => ({
    ...meta("FAQs", "Answers about AETHER-TRADE availability, AI and human review, document security and how engagements start."),
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: FAQS.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })),
        }),
      },
    ],
  }))(), loaderData?.cmsPage) ,
  component: FaqsPage,
});

function FaqsPage() {
  return (
    <>
      <PageHero eyebrow="FAQs" title="Straight Answers." description="What we do, what we don't, and how working with us starts." />
      <section className="container-page section-pad">
        <FaqList items={FAQS} />
      </section>
      <CtaBand title="Still have a question?" description="Ask us directly — we'll give you a straight answer." />
    </>
  );
}
