import { createFileRoute } from "@tanstack/react-router";
import { getPublishedCmsPage, mergeCmsHead, cmsHero } from "@/lib/public-cms.functions";
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
      { fallbackPath: "/contact" },
    ),
  component: ContactPage,
});

function ContactPage() {
  const { cmsPage } = Route.useLoaderData();
  return (
    <>
      <PageHero
        {...cmsHero(cmsPage, {
          eyebrow: "Contact",
          title: "Start a Focused Workflow Conversation.",
          description:
            "Tell us about your trade operations, document review process or workflow challenge. We'll use that context to understand whether a focused assessment or pilot is appropriate.",
        })}
      />
      <CmsPageSections page={cmsPage} />
      <InquiryForm kind="contact" />
    </>
  );
}
