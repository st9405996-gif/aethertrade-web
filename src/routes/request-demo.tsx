import { createFileRoute } from "@tanstack/react-router";
import { PageHero } from "@/components/site/section";
import { InquiryForm } from "@/components/site/inquiry-form";

/** Preserves catalogue context ("Request This Solution" links carry the slug). */
const validateSearch = (search: Record<string, unknown>) => ({
  automation:
    typeof search["automation"] === "string" ? search["automation"] : undefined,
});

export const Route = createFileRoute("/request-demo")({
  validateSearch,
  head: () => ({
    meta: [
      { title: "Request a Demo — AETHER-TRADE" },
      {
        name: "description",
        content:
          "Request a demo of AETHER-TRADE. No account required — tell us about your trade operations and what you want to improve.",
      },
      { property: "og:title", content: "Request a Demo — AETHER-TRADE" },
      {
        property: "og:description",
        content: "See AETHER-TRADE applied to your trade operations.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: RequestDemoPage,
});

function RequestDemoPage() {
  const { automation } = Route.useSearch();
  return (
    <><PageHero eyebrow="Request a demo" title="AETHER-TRADE for your operations." description="Tell us about your business and the workflow you want to improve. No account required."/><InquiryForm kind="demo" automation={automation}/></>
  );
}
