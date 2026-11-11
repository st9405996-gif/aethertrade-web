import { createFileRoute } from "@tanstack/react-router";
import { getPublishedCmsPage, mergeCmsHead, cmsHero } from "@/lib/public-cms.functions";
import { PageHero } from "@/components/site/section";
import { InquiryForm } from "@/components/site/inquiry-form";
import { CmsPageSections } from "@/components/site/cms-page-renderer";

/** Preserves catalogue context ("Request This Solution" links carry the slug). */
const validateSearch = (search: Record<string, unknown>) => ({
  automation: typeof search["automation"] === "string" ? search["automation"] : undefined,
});

export const Route = createFileRoute("/request-demo")({
  validateSearch,
  loader: async () => ({ cmsPage: await getPublishedCmsPage({ data: { slug: "request-demo" } }) }),
  head: ({ loaderData }) =>
    mergeCmsHead(
      (() => ({
        meta: [
          { title: "Book an Operations Audit — AETHER-TRADE" },
          {
            name: "description",
            content:
              "Book an operations audit of AETHER-TRADE. No account required — tell us about your trade operations and what you want to improve.",
          },
          { property: "og:title", content: "Book an Operations Audit — AETHER-TRADE" },
          {
            property: "og:description",
            content: "See AETHER-TRADE applied to your trade operations.",
          },
          { property: "og:type", content: "website" },
          { name: "twitter:card", content: "summary_large_image" },
        ],
      }))(),
      loaderData?.cmsPage,
      { fallbackPath: "/request-demo" },
    ),
  component: RequestDemoPage,
});

function RequestDemoPage() {
  const { automation } = Route.useSearch();
  const { cmsPage } = Route.useLoaderData();
  return (
    <>
      <PageHero
        {...cmsHero(cmsPage, {
          eyebrow: "Book an operations audit",
          title: "AETHER-TRADE for your operations.",
          description: "Tell us about your business and the workflow you want to improve. No account required.",
        })}
      />
      <CmsPageSections page={cmsPage} />
      <InquiryForm kind="demo" automation={automation} />
    </>
  );
}
