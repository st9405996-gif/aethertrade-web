import { createFileRoute } from "@tanstack/react-router";
import { PageHero } from "@/components/site/section";
import { InquiryForm } from "@/components/site/inquiry-form";
import { CmsPageSections } from "@/components/site/cms-page-renderer";

export const Route = createFileRoute("/contact")({
  head: () => ({
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
  }),
  component: ContactPage,
});

function ContactPage() {
  return (
    <><PageHero eyebrow="Contact" title="Talk to AETHER-TRADE." description="Trade operations, automation and custom solutions — start a focused conversation."/><CmsPageSections slug="contact"/><InquiryForm kind="contact"/></>
  );
}
