import { createFileRoute } from "@tanstack/react-router";
import { getPublishedCmsPage, mergeCmsHead, cmsHero, cmsCta } from "@/lib/public-cms.functions";
import { CmsPageSections } from "@/components/site/cms-page-renderer";
import { getPublishedContentRecords } from "@/lib/public-content-records.functions";
import { PageHero } from "@/components/site/section";
import { EmptyContentState, FaqList, meta } from "@/components/site/blocks";
import { CtaBand } from "@/components/site/cta-band";
import { resolvePublicFaqs } from "@/lib/public-faqs";

export const Route = createFileRoute("/faqs")({
  loader: async () => ({
    cmsPage: await getPublishedCmsPage({ data: { slug: "faqs" } }),
    items: await getPublishedContentRecords({ data: { module: "faqs" } }),
  }),
  head: ({ loaderData }) => {
    const faqs = resolvePublicFaqs(loaderData?.items);
    return mergeCmsHead(
      {
        ...meta(
          "FAQs",
          "Answers about AETHER-TRADE availability, AI and human review, document security and how engagements start.",
        ),
        scripts: [
          {
            type: "application/ld+json",
            children: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "FAQPage",
              mainEntity: faqs.map((item) => ({
                "@type": "Question",
                name: item.q,
                acceptedAnswer: { "@type": "Answer", text: item.a },
              })),
            }),
          },
        ],
      },
      loaderData?.cmsPage,
      { fallbackPath: "/faqs" },
    );
  },
  component: FaqsPage,
});
function FaqsPage() {
  const { items, cmsPage } = Route.useLoaderData();
  const faqs = resolvePublicFaqs(items);
  return (
    <>
      <PageHero
        {...cmsHero(cmsPage, {
          eyebrow: "FAQs",
          title: "Straight Answers.",
          description: "What we do, what we don't, and how working with us starts.",
        })}
      />
      <section className="container-page section-pad">
        {faqs.length ? (
          <FaqList items={faqs} />
        ) : (
          <EmptyContentState>No published FAQs are available.</EmptyContentState>
        )}
      </section>
      <CmsPageSections page={cmsPage} />
      <CtaBand
        {...cmsCta(cmsPage, {
          title: "Still have a question?",
          description: "Ask us directly — we'll give you a straight answer.",
        })}
      />
    </>
  );
}
