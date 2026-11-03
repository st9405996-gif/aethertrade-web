import { createFileRoute } from "@tanstack/react-router";
import { PageHero } from "@/components/site/section";
import { CardGrid, meta, PlaceholderNote } from "@/components/site/blocks";
import { CtaBand } from "@/components/site/cta-band";
import { PARTNERSHIP_TYPES } from "@/content/site-content";

export const Route = createFileRoute("/partnerships")({
  head: () =>
    meta("Partnerships", "Partner with AETHER-TRADE as a technology provider, implementation partner or industry association."),
  component: PartnershipsPage,
});

function PartnershipsPage() {
  return (
    <>
      <PageHero
        eyebrow="Partnerships"
        title="Build Better Trade Operations Together."
        description="We're open to working with organizations that serve importers, exporters and logistics businesses."
      />
      <section className="container-page section-pad space-y-8">
        <CardGrid items={PARTNERSHIP_TYPES} />
        <PlaceholderNote>No partnerships are announced yet — we'll list partners here only once agreed</PlaceholderNote>
      </section>
      <CtaBand title="Interested in partnering?" description="Get in touch and tell us how you'd like to work together." />
    </>
  );
}
