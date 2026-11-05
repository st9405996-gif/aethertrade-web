import { createFileRoute, Link } from "@tanstack/react-router";
import { getPublishedCmsPage } from "@/lib/public-cms.functions";
import { PageHero, SectionHeader } from "@/components/site/section";
import { CardGrid, meta } from "@/components/site/blocks";
import { CtaBand } from "@/components/site/cta-band";
import { Button } from "@/components/ui/button";
import { SERVICES } from "@/content/site-content";

export const Route = createFileRoute("/services")({
  loader: async () => ({ cmsPage: await getPublishedCmsPage({ data: { slug: "services" } }) }),
  head: () =>
    meta(
      "Services",
      "Operations assessments, workflow automation builds, custom AI agents, systems integration and pilot support for trade businesses.",
    ),
  component: ServicesPage,
});

function ServicesPage() {
  return (
    <>
      <PageHero
        eyebrow="Services"
        title="Hands-On Help to Modernize Trade Operations."
        description="Alongside the platform, we work directly with your team to assess, build and pilot the workflows that matter most."
      >
        <Button variant="outline" asChild>
          <Link to="/custom-solutions">About custom solutions</Link>
        </Button>
      </PageHero>
      <section className="container-page section-pad">
        <SectionHeader eyebrow="What we offer" title="Services" />
        <div className="mt-12">
          <CardGrid items={SERVICES.map((s) => ({ title: s.title, body: s.body, status: s.status, points: s.deliverables }))} />
        </div>
      </section>
      <CtaBand title="Start with an operations assessment." description="A clear picture of where automation will — and won't — help." />
    </>
  );
}
