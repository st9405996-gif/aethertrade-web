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
            title: "AETHER-TRADE — Automate Your International Trade Infrastructure.",
          },
          {
            name: "description",
            content:
              "AETHER-TRADE engineers custom document intelligence and end-to-end workflow automation for mid-market importers, exporters and logistics enterprises.",
          },
          { property: "og:title", content: "AETHER-TRADE" },
          {
            property: "og:description",
            content:
              "Custom document intelligence. Connected workflows. Human-controlled automation.",
          },
          { property: "og:type", content: "website" },
          { name: "twitter:card", content: "summary_large_image" },
        ],
      }))(),
      loaderData?.cmsPage,
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

const CAPABILITIES = [
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
    icon: "UserCheck",
    title: "Human-controlled AI",
    body: "AI organizes, extracts and flags. People review, decide and act. Consequential decisions stay with authorized staff.",
  },
  {
    icon: "ClipboardCheck",
    title: "Evidence before conclusions",
    body: "Findings are presented with document references, so a discrepancy is a review finding — never an automatic verdict.",
  },
  {
    icon: "ShieldCheck",
    title: "Honest capability labelling",
    body: "We agree scope and deliverables up front, then test each workflow with your team before handover.",
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
      <Capabilities cmsPage={cmsPage ?? null} />
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
    title: "Global Trade Operations. Connected by Intelligence.",
    description:
      "We engineer custom document intelligence and end-to-end workflow automation for mid-market importers, exporters, and logistics enterprises. Eliminate manual data entry and customs friction.",
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
            Custom document intelligence and workflow automation for global trade.
          </p>
          <p className="mt-3 max-w-xl text-pretty text-base text-muted-foreground sm:text-lg">
            {hero.description}
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button variant="hero" size="xl" asChild>
              <Link to="/request-demo" search={{ automation: undefined }}>
                Book an Operations Audit <ArrowRight />
              </Link>
            </Button>
            <Button variant="outline-hero" size="xl" asChild>
              <Link to="/services">Explore Our Services</Link>
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
            <article
              key={i}
              className="card-elevated flex flex-col gap-3 p-5 transition-colors hover:border-primary/40"
            >
              <CmsIcon name={c.icon} className="size-5 text-primary" />
              <h3 className="text-sm font-semibold leading-snug">{c.title}</h3>
              <p className="text-xs leading-relaxed text-muted-foreground">{c.body}</p>
            </article>
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
            <article key={i} className="card-elevated flex flex-col gap-3 p-6">
              <span className="flex size-10 items-center justify-center rounded-lg bg-primary/10">
                <CmsIcon name={a.icon} className="size-5 text-primary" />
              </span>
              <h3 className="text-base font-semibold">{a.title}</h3>
              <p className="text-sm leading-relaxed text-muted-foreground">{a.body}</p>
            </article>
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

function Capabilities({ cmsPage }: { cmsPage: PublishedCmsPage | null }) {
  const items = cmsGroup(cmsPage, "capabilities").length
    ? cmsGroup(cmsPage, "capabilities")
    : CAPABILITIES;
  return (
    <section
      className="section-pad border-y border-border bg-secondary/30"
      aria-labelledby="capabilities-title"
    >
      <div className="container-page">
        <SectionHeader
          eyebrow="Engineering capabilities"
          title="Systems engineered around your operations."
        />
        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((c, i) => (
            <article
              key={i}
              className="card-elevated flex flex-col gap-3 p-6 transition-colors hover:border-primary/40"
            >
              <div className="flex items-center justify-between">
                <span className="flex size-10 items-center justify-center rounded-lg bg-primary/10">
                  <CmsIcon name={c.icon} className="size-5 text-primary" />
                </span>
              </div>
              <h3 className="text-base font-semibold">{c.title}</h3>
              <p className="text-sm leading-relaxed text-muted-foreground">{c.body}</p>
            </article>
          ))}
        </div>
        <div className="mt-8 text-center">
          <Button variant="outline-hero" asChild>
            <Link to="/platform">
              Explore the platform <ArrowRight />
            </Link>
          </Button>
        </div>
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
              <article key={i} className="card-elevated flex flex-col gap-3 p-5">
                <CmsIcon name={s.icon} className="size-5 text-primary" />
                <h3 className="text-sm font-semibold">{s.title}</h3>
                <p className="text-xs leading-relaxed text-muted-foreground">{s.body}</p>
              </article>
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
        <SectionHeader eyebrow="Trust & governance" title="Intelligence with people in control." />
        <div className="mt-12 grid gap-4 lg:grid-cols-3">
          {items.map((t, i) => (
            <article key={i} className="card-elevated flex flex-col gap-3 p-6">
              <span className="flex size-10 items-center justify-center rounded-lg bg-primary/10">
                <CmsIcon name={t.icon} className="size-5 text-primary" />
              </span>
              <h3 className="text-base font-semibold">{t.title}</h3>
              <p className="text-sm leading-relaxed text-muted-foreground">{t.body}</p>
            </article>
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
