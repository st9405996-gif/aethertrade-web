import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { PageHero } from "@/components/site/section";
import { Button } from "@/components/ui/button";
import { CtaBand } from "@/components/site/cta-band";
import { meta } from "@/components/site/blocks";
import { ShipmentReadinessDemo } from "@/components/site/shipment-readiness-demo";

export const Route = createFileRoute("/shipment-follow-up")({
  head: () => ({
    ...meta(
      "Shipment Readiness | AETHER-TRADE",
      "Review shipment document status, compare invoice and packing-list fields, identify exceptions and prepare a human-reviewed follow-up draft in one workflow."
    ),
    links: [{ rel: "canonical", href: "https://aethertrade.cloud/shipment-follow-up" }],
  }),
  component: ShipmentReadinessPage,
});

function ShipmentReadinessPage() {
  return (
    <>
      <PageHero
        eyebrow="Product 02 · Shipment Readiness"
        title="Know what is missing before the shipment file moves forward."
        description="Bring invoice and packing-list text into one review flow. Compare key details, identify outstanding items and prepare a follow-up draft for a person to review."
      >
        <Button variant="hero" asChild>
          <Link to="/request-demo" search={{ automation: "shipment-readiness" }}>
            Request a private demo <ArrowRight />
          </Link>
        </Button>
        <Button variant="outline" asChild>
          <a href="#interactive-demo">Try Live Sample</a>
        </Button>
      </PageHero>
      <ShipmentReadinessDemo />
      <CtaBand title="Test Shipment Readiness against your operation." description="Request a private walkthrough to discuss your checklist, document formats and approval process." primaryLabel="Request a private demo" automation="shipment-readiness" />
    </>
  );
}
