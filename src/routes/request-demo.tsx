import { createFileRoute } from "@tanstack/react-router";
import { getPublishedCmsPage, mergeCmsHead, cmsHero } from "@/lib/public-cms.functions";
import { PageHero } from "@/components/site/section";
import { InquiryForm } from "@/components/site/inquiry-form";
import { CmsPageSections } from "@/components/site/cms-page-renderer";

/** Preserves catalogue context ("Request This Solution" links carry the slug). */
const validateSearch = (search: Record<string, unknown>) => ({
  automation: typeof search["automation"] === "string" ? search["automation"] : undefined,
  shipmentVolume: typeof search["shipmentVolume"] === "string" && ["1–10", "11–50", "50+"].includes(search["shipmentVolume"]) ? search["shipmentVolume"] : undefined,
});

export const Route = createFileRoute("/request-demo")({
  validateSearch,
  loader: async () => ({ cmsPage: await getPublishedCmsPage({ data: { slug: "request-demo" } }) }),
  head: ({ loaderData }) =>
    mergeCmsHead(
      (() => ({
        meta: [
          { title: "Request a Workflow Demo — AETHER-TRADE" },
          {
            name: "description",
            content:
              "Request a workflow demo for freight document intelligence and shipment operations automation. Tell us about your current process and the outcome you want to improve.",
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
      { fallbackPath: "/request-demo", title: "Request a Workflow Demo | AETHER-TRADE", description: "Request a workflow demo for freight document intelligence and shipment operations automation. Tell us about your current process and the outcome you want to improve." },
    ),
  component: RequestDemoPage,
});

function RequestDemoPage() {
  const { automation, shipmentVolume } = Route.useSearch();
  const { cmsPage } = Route.useLoaderData();
  return (
    <>
      <PageHero
        {...cmsHero(cmsPage, {
          eyebrow: "Request a workflow demo",
          title: "See a workflow built around your trade operations.",
          description: "Tell us about your business, the documents your team reviews and the workflow you want to improve.",
        })}
      />
      <CmsPageSections page={cmsPage} />
      <InquiryForm kind="demo" automation={automation} initialShipmentVolume={shipmentVolume} />
    </>
  );
}
