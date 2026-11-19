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
      { fallbackPath: "/faqs", title: "AETHER-TRADE FAQs | Freight Document Automation", description: "Answers about AETHER-TRADE's trade document intelligence, workflow automation, implementation approach and capability availability." },
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
        <div className="mb-8 max-w-3xl space-y-4 text-sm leading-7 text-muted-foreground">
          <p>
            AETHER-TRADE focuses on trade-document intake and selected workflow tasks for freight
            forwarders, importers, exporters and logistics operations teams. The aim is to organize
            information that staff already handle across shipment files, email and business systems.
          </p>
          <p>
            Document workflows can help structure supported fields, compare agreed details across
            documents and highlight possible gaps for a person to review. Results are not legal,
            customs or regulatory decisions, and the system does not replace the judgment of an
            authorized operations professional.
          </p>
          <p>
            Engagements are scoped around one practical process first. Data access, integrations,
            permissions, human approval points, test cases and success measures are agreed before
            a pilot. Features labelled In Development, Custom Build or Planned are not represented
            as generally available.
          </p>
        </div>
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
