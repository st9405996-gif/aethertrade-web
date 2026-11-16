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
      <section className="container-page section-pad">
        <div className="mx-auto grid max-w-6xl gap-4 md:grid-cols-2">
          <div className="rounded-2xl border border-border bg-card p-5 sm:p-6">
            <p className="eyebrow">Public interactive demo</p>
            <h2 className="mt-2 text-xl font-semibold">What you can test today</h2>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">Explore fictional shipment scenarios or submit invoice and packing-list text exports. The demo compares supported fields, runs available deterministic checks, highlights exceptions and prepares a follow-up draft for human review.</p>
          </div>
          <div className="rounded-2xl border border-primary/20 bg-primary/5 p-5 sm:p-6">
            <p className="eyebrow">Operational pilot</p>
            <h2 className="mt-2 text-xl font-semibold">Configured around your shipment process</h2>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">A private pilot can be scoped around your document formats, team checklist, exception-handling steps and approval process. Live email, shipment-system integrations, automated case tracking and other connections are subject to separate implementation, access and validation; they are not included in this public demo.</p>
          </div>
        </div>
      </section>
      <CtaBand title="Test Shipment Readiness against your operation." description="Request a private walkthrough to discuss your checklist, document formats and approval process." primaryLabel="Request a private demo" automation="shipment-readiness" />
    </>
  );
}
