import { createFileRoute } from "@tanstack/react-router";
import { getPublishedCmsPage, mergeCmsHead } from "@/lib/public-cms.functions";
import { PageHero } from "@/components/site/section";
import { InquiryForm } from "@/components/site/inquiry-form";
import { CmsPageSections } from "@/components/site/cms-page-renderer";

export const Route = createFileRoute("/contact")({
  loader: async () => ({ cmsPage: await getPublishedCmsPage({ data: { slug: "contact" } }) }),
  head: ({ loaderData }) =>
    mergeCmsHead(
      (() => ({
        meta: [
          { title: "Contact — AETHER-TRADE" },
          {
            name: "description",
            content:
              "Contact AETHER-TRADE about trade operations automation, the platform or custom solutions.",
          },
          { property: "og:title", content: "Contact — AETHER-TRADE" },
          {
            property: "og:description",
            content: "Contact AETHER-TRADE about trade operations automation.",
          },
          { property: "og:type", content: "website" },
          { name: "twitter:card", content: "summary_large_image" },
        ],
      }))(),
      loaderData?.cmsPage,
    ),
  component: ContactPage,
});

function ContactPage() {
  const { cmsPage } = Route.useLoaderData();
  return (
    <>
      <PageHero
        eyebrow="Contact"
        title="Talk to AETHER-TRADE."
        description="Trade operations, automation and custom solutions — start a focused conversation."
      />
      <CmsPageSections page={cmsPage} />
      <InquiryForm kind="contact" />
    </>
  );
}
