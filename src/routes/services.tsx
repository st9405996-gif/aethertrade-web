import { createFileRoute, Link } from "@tanstack/react-router";
import { getPublishedCmsPage, mergeCmsHead, cmsHero, cmsCta } from "@/lib/public-cms.functions";
import { CmsPageSections } from "@/components/site/cms-page-renderer";
import { getPublishedContentRecords } from "@/lib/public-content-records.functions";
import { PageHero, SectionHeader } from "@/components/site/section";
import { CardGrid, EmptyContentState, meta } from "@/components/site/blocks";
import { CtaBand } from "@/components/site/cta-band";
import { Button } from "@/components/ui/button";
import { parseAvailabilityStatus } from "@/lib/availability-status";
import { CompanyPositioning } from "@/components/site/company-positioning";

const SERVICE_DELIVERABLES: Record<string, string[]> = {
  "operations-assessment": [
    "Current-state workflow map and key hand-offs",
    "Prioritized automation opportunities and process risks",
    "One scoped pilot recommendation with measurable acceptance criteria",
  ],
  "workflow-automation-build": [
    "Agreed workflow specification and exception rules",
    "Configured automation with representative test cases",
    "Human review points and handover notes",
  ],
  "custom-ai-agents": [
    "Defined task boundaries, allowed actions and escalation rules",
    "Test scenarios for normal, uncertain and failed inputs",
    "Human approval points for consequential actions",
  ],
  "systems-integration": [
    "Integration feasibility and access requirements",
    "Field mapping and error-handling specification",
    "Tested connection within the agreed project scope",
  ],
  "pilot-ongoing-support": [
    "Pilot success measures and agreed review cadence",
    "Issue triage and prioritized improvement list",
    "Handover notes and agreed post-pilot support scope",
  ],
};

export const Route = createFileRoute("/services")({
  loader: async () => ({
    cmsPage: await getPublishedCmsPage({ data: { slug: "services" } }),
    items: await getPublishedContentRecords({ data: { module: "services" } }),
  }),
  head: ({ loaderData }) =>
    mergeCmsHead(
      meta(
        "Services",
        "Operations assessments, workflow automation builds, custom AI agents, systems integration and pilot support for trade businesses.",
      ),
      loaderData?.cmsPage,
      { fallbackPath: "/services", title: "Custom Freight Automation Services | AETHER-TRADE", description: "Operations assessments, document workflow automation, custom AI agents, systems integration and pilot support for trade operations." },
    ),
  component: ServicesPage,
});
function ServicesPage() {
  const { items, cmsPage } = Route.useLoaderData();
  const cards = items.map((item) => {
    const status =
      parseAvailabilityStatus(item.availability) ??
      (item.availability.trim() ? undefined : "Custom Build");
    const configuredDeliverables = (item.fields["deliverables"] || "")
      .split("\n")
      .map((value) => value.trim())
      .filter(Boolean);
    return {
      title: item.title,
      body: item.body,
      ...(status ? { status } : {}),
      points: configuredDeliverables.length
        ? configuredDeliverables
        : SERVICE_DELIVERABLES[item.slug] || [],
    };
  });
  return (
    <>
      <PageHero
        {...cmsHero(cmsPage, {
          eyebrow: "Services",
          title: "Custom Projects and Consulting for Freight Automation.",
          description:
            "We assess your operation, then design and build a custom software or automation solution for an agreed workflow. It can be delivered as a standalone application; integrations with existing systems are optional and separately scoped.",
        })}
      >
        <Button variant="outline" asChild>
          <Link to="/custom-solutions">About custom solutions</Link>
        </Button>
      </PageHero>
      <CompanyPositioning />
      <section className="container-page section-pad">
        <SectionHeader eyebrow="What we offer" title="Services and typical deliverables" description="Each engagement is scoped around one workflow, the systems involved and the review controls your team needs." />
        <div className="mt-12">
          {cards.length ? (
            <CardGrid items={cards} />
          ) : (
            <EmptyContentState>No published services are available.</EmptyContentState>
          )}
        </div>
        <p className="mt-8 max-w-3xl text-sm leading-6 text-muted-foreground">
          Delivery timelines and project fees are confirmed after reviewing workflow complexity,
          data access, integration requirements and the agreed pilot scope.
        </p>
      </section>
      <CmsPageSections page={cmsPage} />
      <CtaBand
        {...cmsCta(cmsPage, {
          title: "Start with a focused operations assessment.",
          description: "A clear picture of where automation will — and won't — help.",
        })}
      />
    </>
  );
}
