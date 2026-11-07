import { createFileRoute } from "@tanstack/react-router";
import { getPublishedCmsPage, mergeCmsHead } from "@/lib/public-cms.functions";
import { CmsPageSections } from "@/components/site/cms-page-renderer";
import { StubPage } from "@/components/site/stub-page";

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
    <StubPage
      cmsPage={cmsPage}
      eyebrow="About"
      title="Building More Connected Operations for Global Trade."
      description="Our mission, product philosophy and long-term vision — human-controlled AI, evidence-first findings and operational clarity for trade businesses."
      note="Full page in the next milestone"
    />
  );
}
