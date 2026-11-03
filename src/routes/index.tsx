import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowRight,
  FolderX,
  Repeat2,
  Split,
  CircleAlert,
  SearchX,
  FolderTree,
  ScanSearch,
  GitCompareArrows,
  ClipboardCheck,
  UserCheck,
  BarChart3,
  PackageCheck,
  Ship,
  Building2,
  Users,
  Network,
  Landmark,
  Workflow,
  Bot,
  Plug,
  LayoutDashboard,
  ShieldCheck,
} from "lucide-react";
import heroImage from "@/assets/hero-global-trade.jpg";
import { SectionHeader } from "@/components/site/section";
import { WorkflowDemo } from "@/components/site/workflow-demo";
import { CtaBand } from "@/components/site/cta-band";
import { StatusBadge, type AvailabilityStatus } from "@/components/site/status-badge";
import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { CATALOGUE_PREVIEW } from "@/lib/catalogue-preview";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      {
        title: "AETHER-TRADE — Global Trade Operations. Connected by Intelligence.",
      },
      {
        name: "description",
        content:
          "AETHER-TRADE helps importers, exporters, freight forwarders and logistics businesses organize trade operations through intelligent software, AI-powered workflows and connected business systems.",
      },
      { property: "og:title", content: "AETHER-TRADE" },
      {
        property: "og:description",
        content: "Your AI-Powered Operations Partner for Global Trade.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: HomePage,
});

const CHALLENGES = [
  {
    icon: FolderX,
    title: "Documents scattered across email and systems",
    body: "Invoices, packing lists and transport documents live in inboxes and drives instead of a connected case.",
  },
  {
    icon: Repeat2,
    title: "Repetitive manual checking",
    body: "Skilled staff spend hours re-reading and cross-checking the same fields on every shipment.",
  },
  {
    icon: Split,
    title: "Shipment details fragmented across teams",
    body: "Operations, finance and customer service each hold a different piece of the same story.",
  },
  {
    icon: CircleAlert,
    title: "Missing or inconsistent information",
    body: "Conflicting values surface late — when they are most expensive to fix.",
  },
  {
    icon: SearchX,
    title: "Exceptions difficult to track",
    body: "When something doesn't line up, there is no clear trail of what was checked and by whom.",
  },
];

const APPROACH = [
  {
    icon: FolderTree,
    title: "Trade Operations",
    body: "Designed so each shipment lives as a structured case — documents, data and decisions in one place. In development.",
  },
  {
    icon: ScanSearch,
    title: "Document Intelligence",
    body: "Designed to identify document types and extract available information for review. In development.",
  },
  {
    icon: Workflow,
    title: "Workflow Automation",
    body: "Repetitive steps automated with approval points your team controls — built per engagement.",
  },
  {
    icon: LayoutDashboard,
    title: "Operational Visibility",
    body: "Planned: case status, findings and workload visible to the people who need them.",
  },
];

const CAPABILITIES = [
  {
    icon: FolderTree,
    title: "Shipment & case organization",
    body: "Group documents, data and communication around each shipment or case.",
    status: "In Development" as AvailabilityStatus,
  },
  {
    icon: ScanSearch,
    title: "Document intelligence",
    body: "Identify document types and extract available information automatically.",
    status: "In Development",
  },
  {
    icon: GitCompareArrows,
    title: "Cross-document reconciliation",
    body: "Compare key values across document sets and surface mismatches.",
    status: "In Development",
  },
  {
    icon: ClipboardCheck,
    title: "Evidence-backed findings",
    body: "Every finding carries references so reviewers can verify it.",
    status: "In Development",
  },
  {
    icon: UserCheck,
    title: "Human review workflows",
    body: "Findings route to your team — people make the consequential decisions.",
    status: "Planned",
  },
  {
    icon: BarChart3,
    title: "Operational reporting",
    body: "Case activity, recurring issues and workload, compiled for your team.",
    status: "Planned",
  },
];

const AUDIENCES = [
  {
    icon: PackageCheck,
    title: "Importers",
    body: "Organize incoming documents, spot inconsistencies early and improve visibility over each shipment.",
  },
  {
    icon: Ship,
    title: "Exporters",
    body: "Review shipment information before dispatch and retain structured review records.",
  },
  {
    icon: Landmark,
    title: "Customs brokers",
    body: "Reduce repetitive document review and prepare organized findings for authorized staff review.",
  },
  {
    icon: Network,
    title: "Freight forwarders",
    body: "Coordinate document sets, track exceptions and improve operational visibility.",
  },
  {
    icon: Users,
    title: "Trade operations teams",
    body: "Monitor cases, recurring issues and team workload from one workspace.",
  },
  {
    icon: Plug,
    title: "Logistics technology providers",
    body: "Explore approved integrations and workflow extensions with your platform.",
  },
];

const TRUST = [
  {
    icon: UserCheck,
    title: "Human-controlled AI",
    body: "AI organizes, extracts and flags. People review, decide and act. Consequential decisions stay with authorized staff.",
  },
  {
    icon: ClipboardCheck,
    title: "Evidence before conclusions",
    body: "Findings are presented with document references, so a discrepancy is a review finding — never an automatic verdict.",
  },
  {
    icon: ShieldCheck,
    title: "Honest capability labelling",
    body: "Available, in-development and planned capabilities are labelled clearly. We don't present planned work as live.",
  },
];

const FAQS = [
  {
    q: "What does AETHER-TRADE do?",
    a: "We automate global trade operations. Our flagship platform organizes trade documentation, extracts structured shipment information, cross-checks documents and prepares evidence-backed findings for human review. Alongside the platform, we build custom automation — AI agents, workflow automation and business process automation — for trade and logistics businesses.",
  },
  {
    q: "Do you handle customs clearance or submit declarations?",
    a: "No. AETHER-TRADE does not clear shipments, submit customs declarations or interface with government systems. We help your team organize, review and automate the documentation work that surrounds trade operations.",
  },
  {
    q: "Does the AI replace our staff?",
    a: "No. The platform is built around human review: findings are presented with evidence and routed to your team, and people make the consequential decisions.",
  },
  {
    q: "Which systems can AETHER-TRADE connect to?",
    a: "Integrations are scoped per engagement — commonly email, shared drives, ERPs, TMSs and CRMs through approved APIs and webhooks. Every integration is agreed with you during scoping; we don't claim integrations we haven't built.",
  },
  {
    q: "How do you label what is ready today versus planned?",
    a: "Every capability and catalogue entry carries an availability status — Available, In Development, Custom Build or Planned — so you always know what you are buying.",
  },
  {
    q: "How do we get started?",
    a: "Request a demo. We walk through your current document workflow, identify the highest-friction steps and scope what a first phase would look like. No account is required.",
  },
];

function HomePage() {
  return (
    <>
      <Hero />
      <Challenges />
      <Approach />
      <WorkflowSection />
      <Capabilities />
      <Audiences />
      <CataloguePreview />
      <CustomServices />
      <TrustGovernance />
      <FaqSection />
      <CtaBand
        title="Bring Your Trade Operations Into One Connected Workflow."
        description="Tell us about your business, your operational challenges and what you want to improve — we'll show you what a connected workflow could look like."
      />
    </>
  );
}

function Hero() {
  return (
    <section className="relative isolate overflow-hidden">
      <img
        src={heroImage}
        alt="Container ship at night overlaid with a glowing global trade network"
        width={1920}
        height={1080}
        className="absolute inset-0 -z-10 h-full w-full object-cover object-[70%_center]"
      />
      <div
        className="absolute inset-0 -z-10"
        style={{ background: "var(--hero-veil)" }}
        aria-hidden="true"
      />
      <div className="container-page section-pad relative">
        <div className="max-w-2xl">
          <p className="eyebrow mb-4">Global trade technology & automation company</p>
          <h1 className="text-balance text-4xl font-semibold leading-[1.1] tracking-tight sm:text-5xl lg:text-6xl">
            Global Trade Operations. Connected by Intelligence.
          </h1>
          <p className="mt-5 text-lg font-medium text-primary">
            Your AI-Powered Operations Partner for Global Trade.
          </p>
          <p className="mt-3 max-w-xl text-pretty text-base text-muted-foreground sm:text-lg">
            AETHER-TRADE helps importers, exporters, freight forwarders and
            logistics businesses organize trade operations through intelligent
            software, AI-powered workflows and connected business systems.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button variant="hero" size="xl" asChild>
              <Link to="/request-demo" search={{ automation: undefined }}>
                Request a Demo <ArrowRight />
              </Link>
            </Button>
            <Button variant="outline-hero" size="xl" asChild>
              <Link to="/platform">Explore the Platform</Link>
            </Button>
          </div>
          <p className="mt-8 font-mono text-xs text-muted-foreground">
            Connect. Automate. Grow.
          </p>
        </div>
      </div>
    </section>
  );
}

function Challenges() {
  return (
    <section className="section-pad" aria-labelledby="challenges-title">
      <div className="container-page">
        <SectionHeader
          eyebrow="The everyday reality"
          title="Trade operations run on documents — and documents don't run themselves."
          description="Before any automation, teams face the same five frictions on every shipment."
        />
        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-5 lg:gap-3">
          {CHALLENGES.map((c) => (
            <article
              key={c.title}
              className="card-elevated flex flex-col gap-3 p-5 transition-colors hover:border-primary/40"
            >
              <c.icon className="size-5 text-primary" />
              <h3 className="text-sm font-semibold leading-snug">{c.title}</h3>
              <p className="text-xs leading-relaxed text-muted-foreground">{c.body}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function Approach() {
  return (
    <section className="section-pad border-y border-border bg-secondary/30" aria-labelledby="approach-title">
      <div className="container-page">
        <SectionHeader
          eyebrow="The AETHER-TRADE approach"
          title="Four capabilities, one connected workflow."
        />
        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {APPROACH.map((a) => (
            <article key={a.title} className="card-elevated flex flex-col gap-3 p-6">
              <span className="flex size-10 items-center justify-center rounded-lg bg-primary/10">
                <a.icon className="size-5 text-primary" />
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

function WorkflowSection() {
  return (
    <section className="section-pad" aria-labelledby="workflow-title">
      <div className="container-page">
        <SectionHeader
          eyebrow="How a shipment moves through the platform"
          title="From scattered documents to evidence-backed review."
          description="Follow one shipment through the review workflow — including what happens when information is missing."
        />
        <div className="mt-12">
          <WorkflowDemo />
        </div>
      </div>
    </section>
  );
}

function Capabilities() {
  return (
    <section className="section-pad border-y border-border bg-secondary/30" aria-labelledby="capabilities-title">
      <div className="container-page">
        <SectionHeader
          eyebrow="Platform capabilities"
          title="What the platform does for your operations."
        />
        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {CAPABILITIES.map((c) => (
            <article
              key={c.title}
              className="card-elevated flex flex-col gap-3 p-6 transition-colors hover:border-primary/40"
            >
              <div className="flex items-center justify-between">
                <span className="flex size-10 items-center justify-center rounded-lg bg-primary/10">
                  <c.icon className="size-5 text-primary" />
                </span>
                <StatusBadge status={c.status as AvailabilityStatus} />
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

function Audiences() {
  return (
    <section className="section-pad" aria-labelledby="solutions-title">
      <div className="container-page">
        <SectionHeader
          eyebrow="Solutions by business type"
          title="Built for the businesses that move global trade."
        />
        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {AUDIENCES.map((s) => (
            <Link
              key={s.title}
              to="/solutions"
              className="card-elevated group flex flex-col gap-3 p-6 transition-colors hover:border-primary/40"
            >
              <span className="flex size-10 items-center justify-center rounded-lg bg-primary/10">
                <s.icon className="size-5 text-primary" />
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
    <section className="section-pad border-y border-border bg-secondary/30" aria-labelledby="catalogue-title">
      <div className="container-page">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <SectionHeader
            align="left"
            eyebrow="Automation catalogue"
            title="Pre-built automations for recurring trade work."
            description="Each entry states the problem it solves, how it works and its availability — so you always know what is live today."
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
                <StatusBadge status={item.availability as AvailabilityStatus} />
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
                  <Link
                    to="/request-demo"
                    search={{ automation: item.slug }}
                  >
                    Request This Solution
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

function CustomServices() {
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
            {[
              {
                icon: Bot,
                title: "Custom AI agents",
                body: "Purpose-built agents for your documents, systems and approval rules.",
              },
              {
                icon: Workflow,
                title: "Workflow automation",
                body: "End-to-end automation for recurring operational processes.",
              },
              {
                icon: Plug,
                title: "System integrations",
                body: "ERP, TMS and CRM connections through approved APIs and webhooks.",
              },
              {
                icon: Building2,
                title: "Process automation",
                body: "Business process automation across trade operations and back office.",
              },
            ].map((s) => (
              <article key={s.title} className="card-elevated flex flex-col gap-3 p-5">
                <s.icon className="size-5 text-primary" />
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

function TrustGovernance() {
  return (
    <section className="section-pad border-y border-border bg-secondary/30" aria-labelledby="trust-title">
      <div className="container-page">
        <SectionHeader
          eyebrow="Trust & governance"
          title="Intelligence with people in control."
        />
        <div className="mt-12 grid gap-4 lg:grid-cols-3">
          {TRUST.map((t) => (
            <article key={t.title} className="card-elevated flex flex-col gap-3 p-6">
              <span className="flex size-10 items-center justify-center rounded-lg bg-primary/10">
                <t.icon className="size-5 text-primary" />
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

function FaqSection() {
  return (
    <section className="section-pad" aria-labelledby="faq-title">
      <div className="container-page">
        <SectionHeader eyebrow="FAQ" title="Frequently asked questions." />
        <div className="mx-auto mt-10 max-w-3xl">
          <Accordion type="single" collapsible className="w-full">
            {FAQS.map((f, i) => (
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
