import { createFileRoute } from "@tanstack/react-router";
import { getPublishedCmsPage, mergeCmsHead } from "@/lib/public-cms.functions";
import { CmsPageSections } from "@/components/site/cms-page-renderer";
import { PageHero } from "@/components/site/section";
import { CtaBand } from "@/components/site/cta-band";

export const Route = createFileRoute("/about")({
  loader: async () => ({ cmsPage: await getPublishedCmsPage({ data: { slug: "about" } }) }),
  head: ({ loaderData }) =>
    mergeCmsHead(
      (() => ({
        meta: [
          { title: "About — AETHER-TRADE" },
          {
            name: "description",
            content:
              "AETHER-TRADE builds more connected operations for global trade — human-controlled AI, evidence and operational clarity.",
          },
          { property: "og:title", content: "About — AETHER-TRADE" },
          {
            property: "og:description",
            content: "Building more connected operations for global trade.",
          },
          { property: "og:type", content: "website" },
          { name: "twitter:card", content: "summary_large_image" },
          { name: "robots", content: "noindex" },
        ],
      }))(),
      loaderData?.cmsPage,
    ),
  component: AboutPage,
});

function AboutPage() {
  const { cmsPage } = Route.useLoaderData();
  return (
    <>
      <PageHero
        eyebrow="About"
        title="Building More Connected Operations for Global Trade."
        description="Our mission, product philosophy and long-term vision — human-controlled AI, evidence-first findings and operational clarity for trade businesses."
      />
      <CmsPageSections page={cmsPage ?? null} />
      <CtaBand
        title="Start the conversation."
        description="Tell us about your business, your operational challenges and what you want to improve."
      />
    </>
  );
}
