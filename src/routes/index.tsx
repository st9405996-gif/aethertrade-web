import { createFileRoute, Link } from "@tanstack/react-router";
import {
  getPublishedCmsPage,
  mergeCmsHead,
  cmsHero,
  cmsCta,
  cmsGroup,
  type PublishedCmsPage,
} from "@/lib/public-cms.functions";
import { CmsPageSections } from "@/components/site/cms-page-renderer";
import { getPublishedContentRecords } from "@/lib/public-content-records.functions";
import { resolvePublicFaqs } from "@/lib/public-faqs";
import { ArrowRight } from "lucide-react";
import { CmsIcon } from "@/components/site/cms-icon";
import heroImage from "@/assets/hero-global-trade.jpg";
import { SectionHeader } from "@/components/site/section";
import { WorkflowDemo } from "@/components/site/workflow-demo";
import { CtaBand } from "@/components/site/cta-band";
import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { CATALOGUE_PREVIEW } from "@/lib/catalogue-preview";
import { DetailCard } from "@/components/site/detail-card";

export const Route = createFileRoute("/")({
  loader: async () => ({
    cmsPage: await getPublishedCmsPage({ data: { slug: "home" } }),
    faqItems: await getPublishedContentRecords({ data: { module: "faqs" } }),
    workflowRecords: await getPublishedContentRecords({ data: { module: "workflow" } }).catch((error: unknown) => {
      console.error("Homepage workflow CMS unavailable; using the legacy illustrative workflow.", error);
      return [];
    }),
  }),
  head: ({ loaderData }) =>
    mergeCmsHead(
      (() => ({
        meta: [
          {
            title: "AETHER-TRADE | Freight Document Intelligence & Workflow Automation",
          },
          {
            name: "description",
            content:
              "AETHER-TRADE helps freight forwarders and trade operations teams organize shipment documents, compare key fields and coordinate review workflows with human oversight.",
          },
          { property: "og:title", content: "AETHER-TRADE" },
          {
            property: "og:description",
            content:
              "AI agents. Connected workflows. Human-controlled automation.",
          },
          { property: "og:type", content: "website" },
          { name: "twitter:card", content: "summary_large_image" },
        ],
      }))(),
      loaderData?.cmsPage,
      { fallbackPath: "/" },
    ),
  component: HomePage,
});

const CHALLENGES = [
  {
    icon: "FolderX",
    title: "Documents scattered across email and systems",
    body: "Invoices, packing lists and transport documents live in inboxes and drives instead of a connected case.",
  },
  {
    icon: "Repeat2",
    title: "Repetitive manual checking",
    body: "Skilled staff spend hours re-reading and cross-checking the same fields on every shipment.",
  },
  {
    icon: "Split",
    title: "Shipment details fragmented across teams",
    body: "Operations, finance and customer service each hold a different piece of the same story.",
  },
  {
    icon: "CircleAlert",
    title: "Missing or inconsistent information",
    body: "Conflicting values surface late — when they are most expensive to fix.",
  },
  {
    icon: "SearchX",
    title: "Exceptions difficult to track",
    body: "When something doesn't line up, there is no clear trail of what was checked and by whom.",
  },
];

const APPROACH = [
  {
    icon: "FolderTree",
    title: "Trade Operations",
    body: "Centralized Case Architecture — We structure your documents, communications, and data into a single operational workspace.",
  },
  {
    icon: "ScanSearch",
    title: "Document Intelligence",
    body: "Automated Data Ingestion — Custom trained models to extract fields from commercial invoices, packing lists, and BLs.",
  },
  {
    icon: "Workflow",
    title: "Workflow Automation",
    body: "Controlled Rule Engines — Tailor-made automation logic built around your team’s existing approval hierarchy.",
  },
  {
    icon: "LayoutDashboard",
    title: "Operational Visibility",
    body: "Live Performance Dashboards — Real-time tracking of workload distribution and recurring shipment exceptions.",
  },
];

const AUDIENCES = [
  {
    icon: "PackageCheck",
    title: "Importers",
    body: "Organize incoming documents, spot inconsistencies early and improve visibility over each shipment.",
  },
  {
    icon: "Ship",
    title: "Exporters",
    body: "Review shipment information before dispatch and retain structured review records.",
  },
  {
    icon: "Landmark",
    title: "Customs brokers",
    body: "Reduce repetitive document review and prepare organized findings for authorized staff review.",
  },
  {
    icon: "Network",
    title: "Freight forwarders",
    body: "Coordinate document sets, track exceptions and improve operational visibility.",
  },
  {
    icon: "Users",
    title: "Trade operations teams",
    body: "Monitor cases, recurring issues and team workload from one workspace.",
  },
  {
    icon: "Plug",
    title: "Logistics technology providers",
    body: "Explore approved integrations and workflow extensions with your platform.",
  },
];

const TRUST = [
  {
    icon: "ClipboardCheck",
    title: "Paid Operations Audit",
    body: "Every engagement starts with a paid Operations Audit to understand the workflow and define the scope.",
  },
  {
    icon: "Workflow",
    title: "One-workflow pilot",
    body: "We start with a pilot on one workflow before considering a wider rollout.",
  },
  {
    icon: "UserCheck",
    title: "Human approval points",
    body: "Every automation includes human approval points. People review and authorize consequential actions.",
  },
  {
    icon: "FileCheck",
    title: "Agreed scope before building",
    body: "Scope and deliverables are agreed before implementation begins.",
  },
];

const CUSTOM_SERVICES = [
  {
    icon: "Bot",
    title: "Custom AI agents",
    body: "Purpose-built agents for your documents, systems and approval rules.",
  },
  {
    icon: "Workflow",
    title: "Workflow automation",
    body: "End-to-end automation for recurring operational processes.",
  },
  {
    icon: "Plug",
    title: "System integrations",
    body: "ERP, TMS and CRM connections through approved APIs and webhooks.",
  },
  {
    icon: "Building2",
    title: "Process automation",
    body: "Business process automation across trade operations and back office.",
  },
];

function HomePage() {
  const { cmsPage, faqItems, workflowRecords } = Route.useLoaderData();
  return (
    <>
      <Hero cmsPage={cmsPage ?? null} />
      <Challenges cmsPage={cmsPage ?? null} />
      <Approach cmsPage={cmsPage ?? null} />
      <WorkflowSection workflowRecords={workflowRecords} />
      <Capabilities />
      <Audiences cmsPage={cmsPage ?? null} />
      <CataloguePreview />
      <CustomServices cmsPage={cmsPage ?? null} />
      <TrustGovernance cmsPage={cmsPage ?? null} />
      <FaqSection items={faqItems} />
      <CmsPageSections page={cmsPage ?? null} />
      <CtaBand
        {...cmsCta(cmsPage, {
          title: "Bring Your Trade Operations Into One Connected Workflow.",
          description:
            "Tell us about your business, your operational challenges and what you want to improve — we'll show you what a connected workflow could look like.",
        })}
      />
    </>
  );
}

function Hero({ cmsPage }: { cmsPage: PublishedCmsPage | null }) {
  const hero = cmsHero(cmsPage, {
    eyebrow: "Global trade technology & automation company",
    title: "AI-Powered Document & Workflow Automation for Freight Forwarders.",
    description:
      "We help freight forwarders and trade operations teams organize shipment documents, identify discrepancies and coordinate routine work through structured, human-reviewed workflows.",
  });
  return (
    <section className="relative isolate overflow-hidden">
      <img
        src={heroImage}
        alt="Container ship and international logistics operations"
        width={1920}
        height={1080}
        className="absolute inset-0 -z-10 h-full w-full object-cover object-[70%_center] brightness-110 saturate-75"
      />
      <div
        className="absolute inset-0 -z-10"
        style={{ background: "var(--hero-veil)" }}
        aria-hidden="true"
      />
      <div className="container-page section-pad relative">
        <div className="max-w-2xl">
          <p className="eyebrow mb-4">{hero.eyebrow}</p>
          <h1 className="text-balance text-4xl font-semibold leading-[1.1] tracking-tight sm:text-5xl lg:text-6xl">
            {hero.title}
          </h1>
          <p className="mt-5 text-lg font-medium text-primary">
            Document intelligence and workflow automation for freight forwarders and trade operations teams.
          </p>
          <p className="mt-3 max-w-xl text-pretty text-base text-muted-foreground sm:text-lg">
            {hero.description}
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button variant="hero" size="xl" asChild>
              <Link to="/request-demo" search={{ automation: undefined }}>
                Request a Workflow Demo <ArrowRight />
              </Link>
            </Button>
            <Button variant="outline-hero" size="xl" asChild>
              <Link to="/automations">Explore Available Automations</Link>
            </Button>
          </div>
          <p className="mt-8 font-mono text-xs text-muted-foreground">Connect. Automate. Grow.</p>
        </div>
      </div>
    </section>
  );
}

function Challenges({ cmsPage }: { cmsPage: PublishedCmsPage | null }) {
  const items = cmsGroup(cmsPage, "challenges").length
    ? cmsGroup(cmsPage, "challenges")
    : CHALLENGES;
  return (
    <section className="section-pad" aria-labelledby="challenges-title">
      <div className="container-page">
        <SectionHeader
          eyebrow="The everyday reality"
          title="Trade operations run on documents — and documents don't run themselves."
          description="Before any automation, teams face the same five frictions on every shipment."
        />
        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-5 lg:gap-3">
          {items.map((c, i) => (
            <DetailCard
              key={i}
              icon={c.icon}
              title={c.title}
              body={c.body}
              details={
                c.title === "Documents scattered across email and systems"
                  ? [
                      "A scoped workflow can bring approved documents and related shipment information into one case record.",
                      "Data sources, access permissions and retention requirements are agreed before connecting systems.",
                    ]
                  : c.title === "Repetitive manual checking"
                    ? [
                        "Field extraction and cross-document comparisons can surface values that need attention.",
                        "Reviewers verify flagged information before consequential actions are approved.",
                      ]
                    : c.title === "Shipment details fragmented across teams"
                      ? [
                          "A shared case view can bring agreed shipment information and team hand-offs together.",
                          "Ownership, visibility and access are defined with the teams involved.",
                        ]
                      : c.title === "Missing or inconsistent information"
                        ? [
                            "Agreed rules can flag missing fields or conflicting values before the next hand-off.",
                            "Exceptions are routed for human review instead of being silently accepted.",
                          ]
                        : [
                            "Review records can capture what was checked and the evidence used.",
                            "Escalation steps and responsibility are agreed during project scoping.",
                          ]
              }
            />
          ))}
        </div>
      </div>
    </section>
  );
}

function Approach({ cmsPage }: { cmsPage: PublishedCmsPage | null }) {
  const items = cmsGroup(cmsPage, "approach").length ? cmsGroup(cmsPage, "approach") : APPROACH;
  return (
    <section
      className="section-pad border-y border-border bg-secondary/30"
      aria-labelledby="approach-title"
    >
      <div className="container-page">
        <SectionHeader
          eyebrow="The AETHER-TRADE approach"
          title="Four capabilities, one connected workflow."
        />
        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {items.map((a, i) => (
            <Link
              key={i}
              to={
                a.title === "Workflow Automation"
                  ? "/services"
                  : "/platform"
              }
              className="card-elevated group flex h-full flex-col gap-3 p-6 transition-colors hover:border-primary/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <span className="flex size-10 items-center justify-center rounded-lg bg-primary/10">
                <CmsIcon name={a.icon} className="size-5 text-primary" />
              </span>
              <h3 className="text-base font-semibold">{a.title}</h3>
              <p className="text-sm leading-relaxed text-muted-foreground">{a.body}</p>
              <span className="mt-auto inline-flex items-center gap-1 pt-2 text-sm text-primary">
                Explore details <ArrowRight className="size-4" />
              </span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

function WorkflowSection({ workflowRecords }: { workflowRecords: Awaited<ReturnType<typeof getPublishedContentRecords>> }) {
  return (
    <section className="section-pad" aria-labelledby="workflow-title">
      <div className="container-page">
        <SectionHeader
          eyebrow="Illustrative workflow"
          title="From fragmented inputs to controlled operational workflows."
          description="An illustrative eight-step example of a tailored document workflow. Sample data only; not a live integration."
        />
        <div className="mt-12">
          <WorkflowDemo workflowRecords={workflowRecords} />
        </div>
      </div>
    </section>
  );
}

function Capabilities() {
  return (
    <section className="border-y border-border bg-secondary/30 py-6" aria-label="Platform">
      <div className="container-page flex flex-wrap items-center justify-between gap-4">
        <p className="eyebrow">Platform</p>
        <Button variant="outline-hero" asChild>
          <Link to="/platform">
            Explore the platform <ArrowRight />
          </Link>
        </Button>
      </div>
    </section>
  );
}

function Audiences({ cmsPage }: { cmsPage: PublishedCmsPage | null }) {
  const items = cmsGroup(cmsPage, "audiences").length ? cmsGroup(cmsPage, "audiences") : AUDIENCES;
  return (
    <section className="section-pad" aria-labelledby="solutions-title">
      <div className="container-page">
        <SectionHeader
          eyebrow="Solutions by business type"
          title="Built for the businesses that move global trade."
        />
        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((s, i) => (
            <Link
              key={i}
              to="/solutions"
              className="card-elevated group flex flex-col gap-3 p-6 transition-colors hover:border-primary/40"
            >
              <span className="flex size-10 items-center justify-center rounded-lg bg-primary/10">
                <CmsIcon name={s.icon} className="size-5 text-primary" />
              </span>
              <h3 className="text-base font-semibold">{s.title}</h3>
              <p className="text-sm leading-relaxed text-muted-foreground">{s.body}</p>
              <span className="mt-auto inline-flex items-center gap-1.5 pt-2 text-sm text-primary opacity-0 transition-opacity group-hover:opacity-100">
                Learn more <ArrowRight className="size-4" />
              </span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

function CataloguePreview() {
  return (
    <section
      className="section-pad border-y border-border bg-secondary/30"
      aria-labelledby="catalogue-title"
    >
      <div className="container-page">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <SectionHeader
            align="left"
            eyebrow="Automation catalogue"
            title="Custom automations engineered around your operation."
            description="Example workflows we can scope and engineer around your systems, controls and operational requirements."
          />
          <Button variant="outline-hero" asChild>
            <Link to="/automations">
              View the full catalogue <ArrowRight />
            </Link>
          </Button>
        </div>
        <div className="mt-12 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {CATALOGUE_PREVIEW.map((item) => (
            <article key={item.slug} className="card-elevated flex flex-col gap-3 p-6">
              <div className="flex items-start justify-between gap-3">
                <p className="eyebrow">{item.category}</p>
              </div>
              <h3 className="text-base font-semibold">{item.name}</h3>
              <p className="text-sm leading-relaxed text-muted-foreground">
                <span className="font-medium text-foreground">Problem: </span>
                {item.problem}
              </p>
              <p className="text-sm leading-relaxed text-muted-foreground">
                <span className="font-medium text-foreground">What it does: </span>
                {item.whatItDoes}
              </p>
              <div className="mt-auto pt-2">
                <Button variant="outline" size="sm" asChild>
                  <Link to="/request-demo" search={{ automation: item.slug }}>
                    Discuss This Workflow
                  </Link>
                </Button>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function CustomServices({ cmsPage }: { cmsPage: PublishedCmsPage | null }) {
  const items = cmsGroup(cmsPage, "custom-services").length
    ? cmsGroup(cmsPage, "custom-services")
    : CUSTOM_SERVICES;
  return (
    <section className="section-pad" aria-labelledby="services-title">
      <div className="container-page">
        <div className="grid items-center gap-10 lg:grid-cols-2">
          <div>
            <SectionHeader
              align="left"
              eyebrow="Custom automation services"
              title="Have a workflow nobody else has? We build it with you."
              description="Beyond the platform, we design and build custom AI agents, workflow automation and business process automation — scoped, built and tested with your team, with approval points you control."
            />
            <div className="mt-8 flex flex-wrap gap-3">
              <Button variant="hero" asChild>
                <Link to="/custom-solutions">
                  Custom Solutions <ArrowRight />
                </Link>
              </Button>
              <Button variant="outline" asChild>
                <Link to="/services">View Services</Link>
              </Button>
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {items.map((s, i) => (
              <DetailCard
                key={i}
                icon={s.icon}
                title={s.title}
                body={s.body}
                details={
                  s.title === "Custom AI agents"
                    ? [
                        "Agents are scoped for specific tasks, approved information sources and permitted actions.",
                        "Consequential actions remain subject to the client's human approval rules.",
                      ]
                    : s.title === "Workflow automation"
                      ? [
                          "Recurring process steps can be mapped and automated around agreed business rules.",
                          "Exceptions and approval hand-offs remain visible to the responsible team.",
                        ]
                      : s.title === "System integrations"
                        ? [
                            "Connections are scoped around approved APIs and webhooks.",
                            "System access, permissions and data responsibilities are agreed before implementation.",
                          ]
                        : [
                            "Repeatable operational and back-office tasks can be assessed for automation.",
                            "A focused one-workflow pilot can be used before considering a wider rollout.",
                          ]
                }
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function TrustGovernance({ cmsPage }: { cmsPage: PublishedCmsPage | null }) {
  const items = cmsGroup(cmsPage, "trust").length ? cmsGroup(cmsPage, "trust") : TRUST;
  return (
    <section
      className="section-pad border-y border-border bg-secondary/30"
      aria-labelledby="trust-title"
    >
      <div className="container-page">
        <SectionHeader eyebrow="How we work" title="Intelligence with people in control." />
        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {items.map((t, i) => (
            <Link
              key={i}
              to="/how-it-works"
              className="card-elevated group flex h-full flex-col gap-3 p-6 transition-colors hover:border-primary/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <span className="flex size-10 items-center justify-center rounded-lg bg-primary/10">
                <CmsIcon name={t.icon} className="size-5 text-primary" />
              </span>
              <h3 className="text-base font-semibold">{t.title}</h3>
              <p className="text-sm leading-relaxed text-muted-foreground">{t.body}</p>
              <span className="mt-auto inline-flex items-center gap-1 pt-2 text-sm text-primary">
                How it works <ArrowRight className="size-4" />
              </span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

function FaqSection({ items }: { items: Awaited<ReturnType<typeof getPublishedContentRecords>> }) {
  const faqs = resolvePublicFaqs(items);
  if (!faqs.length) return null;
  return (
    <section className="section-pad" aria-labelledby="faq-title">
      <div className="container-page">
        <SectionHeader eyebrow="FAQ" title="Frequently asked questions." />
        <div className="mx-auto mt-10 max-w-3xl">
          <Accordion type="single" collapsible className="w-full">
            {faqs.map((f, i) => (
              <AccordionItem key={f.q} value={`faq-${i}`}>
                <AccordionTrigger className="text-left text-base hover:no-underline">
                  {f.q}
                </AccordionTrigger>
                <AccordionContent className="text-sm leading-relaxed text-muted-foreground">
                  {f.a}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </div>
    </section>
  );
}
