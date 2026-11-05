import { createFileRoute, Link } from "@tanstack/react-router";
import { getPublishedCmsPage, mergeCmsHead } from "@/lib/public-cms.functions";
import { PageHero, SectionHeader } from "@/components/site/section";
import { CtaBand } from "@/components/site/cta-band";
import { Button } from "@/components/ui/button";

const WORKFLOW_AREAS = [
  {
    title: "Freight forwarding & shipment coordination",
    body: "Shipment milestone tracking, status-request handling, agent and carrier follow-ups, exception escalation, customer notifications and operational hand-offs.",
  },
  {
    title: "Import-export operations",
    body: "Supplier and buyer coordination, purchase-order hand-offs, booking workflows, shipment preparation, approvals and repeatable trade-process tasks.",
  },
  {
    title: "Document and data intelligence",
    body: "Document classification, field extraction, cross-document comparisons, missing-information checks and structured case records for human review.",
  },
  {
    title: "AI agents for business teams",
    body: "Task-specific agents for operations, customer support, sales coordination, internal knowledge, research and reporting—with scoped permissions and approval steps.",
  },
  {
    title: "Back-office and business process automation",
    body: "Email and CRM workflows, lead routing, customer onboarding, procurement coordination, invoice operations, reporting and internal task automation.",
  },
  {
    title: "Systems integration & dashboards",
    body: "Connect approved email, CRM, ERP, accounting, spreadsheets, shared drives and third-party APIs; build dashboards and recurring operational reports.",
  },
];

const DELIVERY_STEPS = [
  ["Discover", "Understand the current process, users, systems, pain points and constraints."],
  ["Scope", "Agree the workflow, integrations, permissions, human checkpoints, deliverables and success measures."],
  ["Build & test", "Develop against agreed requirements, test edge cases and review failures with your team."],
  ["Pilot & deploy", "Run a controlled pilot, measure results and deploy in an agreed managed or client-owned environment."],
  ["Handover & improve", "Document the solution, train users and optionally provide monitoring, maintenance and iteration."],
];

export const Route = createFileRoute("/custom-solutions")({
  loader: async () => ({ cmsPage: await getPublishedCmsPage({ data: { slug: "custom-solutions" } }) }),
  head:  ({ loaderData }) => mergeCmsHead((() => ({
    meta: [
      { title: "Custom Automation, Workflows & AI Agents — AETHER-TRADE" },
      {
        name: "description",
        content:
          "Custom automation, AI agents, freight forwarding and shipment workflows, import-export operations, integrations and document intelligence.",
      },
      { property: "og:title", content: "Custom Automation & AI Agents — AETHER-TRADE" },
      {
        property: "og:description",
        content: "Purpose-built workflows and agents for trade, logistics and business operations.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }))(), loaderData?.cmsPage) ,
  component: CustomSolutionsPage,
});

function CustomSolutionsPage() {
  return (
    <>
      <PageHero
        eyebrow="Custom solutions"
        title="Automation for the Way Your Business Actually Works."
        description="We design and build custom automations, connected workflows and AI agents for importers, exporters, freight forwarders, logistics operators and other businesses. Start with one process or scope a connected system across your team."
      >
        <Button asChild variant="hero">
          <Link to="/request-demo" search={{ automation: undefined }}>Discuss a workflow</Link>
        </Button>
        <Button asChild variant="outline">
          <Link to="/services">Explore all services</Link>
        </Button>
      </PageHero>

      <section className="container-page section-pad">
        <SectionHeader
          eyebrow="What we can build"
          title="More than document processing."
          description="Every engagement is scoped around the client's process, tools, access permissions and desired outcome."
        />
        <div className="mt-10 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {WORKFLOW_AREAS.map((item) => (
            <article key={item.title} className="rounded-xl border border-border bg-card p-6">
              <h2 className="text-lg font-semibold">{item.title}</h2>
              <p className="mt-3 text-sm leading-6 text-muted-foreground">{item.body}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="border-y border-border bg-card/40">
        <div className="container-page section-pad">
          <SectionHeader
            eyebrow="How engagements work"
            title="From process discovery to a working system."
          />
          <ol className="mt-10 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {DELIVERY_STEPS.map(([title, body], index) => (
              <li key={title} className="rounded-xl border border-border bg-background p-6">
                <p className="eyebrow">Step 0{index + 1}</p>
                <h2 className="mt-2 text-lg font-semibold">{title}</h2>
                <p className="mt-3 text-sm leading-6 text-muted-foreground">{body}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="container-page section-pad">
        <SectionHeader
          eyebrow="Built responsibly"
          title="Clear scope. Human control. Measurable outcomes."
          description="We agree data access, system permissions, review requirements and responsibilities before building. AI outputs and consequential operational actions remain subject to the client's approval rules."
        />
        <div className="mt-8 grid gap-4 md:grid-cols-3">
          <div className="rounded-lg border border-border p-5">
            <h3 className="font-semibold">Client-approved access</h3>
            <p className="mt-2 text-sm text-muted-foreground">Connections are made only to systems and data the client authorizes.</p>
          </div>
          <div className="rounded-lg border border-border p-5">
            <h3 className="font-semibold">Human approval points</h3>
            <p className="mt-2 text-sm text-muted-foreground">Agents can prepare and route work; approvals stay with designated people.</p>
          </div>
          <div className="rounded-lg border border-border p-5">
            <h3 className="font-semibold">Scoped delivery</h3>
            <p className="mt-2 text-sm text-muted-foreground">Integrations, timelines and outcomes are confirmed in a written project scope.</p>
          </div>
        </div>
      </section>

      <CtaBand
        title="Tell us which workflow is slowing your team down."
        description="We can assess one process, propose a focused pilot and define what a successful automation should achieve."
      />
    </>
  );
}
