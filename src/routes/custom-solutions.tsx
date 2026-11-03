import { createFileRoute } from "@tanstack/react-router";
import { StubPage } from "@/components/site/stub-page";

export const Route = createFileRoute("/custom-solutions")({
  head: () => ({
    meta: [
      { title: "Custom Solutions — AETHER-TRADE" },
      {
        name: "description",
        content:
          "Have a complex workflow? We design, build and deploy the right automation system — from requirement intake to handover and training.",
      },
      { property: "og:title", content: "Custom Solutions — AETHER-TRADE" },
      {
        property: "og:description",
        content: "Have a complex workflow? Let's design the right system.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: CustomSolutionsPage,
});

function CustomSolutionsPage() {
  return (
    <StubPage
      eyebrow="Custom solutions"
      title="Have a Complex Workflow? Let's Design the Right System."
      description="Requirement intake, discovery, scope and proposal, approval, development and testing, deployment, handover and training — with clear responsibilities in a managed or client-owned environment."
      note="Full page in the next milestone"
    />
  );
}
