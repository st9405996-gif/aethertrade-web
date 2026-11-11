import { Link } from "@tanstack/react-router";
import { PageHero, SectionHeader } from "@/components/site/section";
import { Button } from "@/components/ui/button";

export type MarketWorkflow = {
  title: string;
  description: string;
};

export type MarketPageContent = {
  market: string;\n  marketKey: string;
  eyebrow: string;
  title: string;
  description: string;
  audience: string;
  workflows: MarketWorkflow[];
  considerations: string[];
  faq: { question: string; answer: string }[];
};

const MARKET_LINKS = [
  { label: "UAE", path: "/uae-logistics-automation", note: "Freight forwarding and trade operations" },
  { label: "China", path: "/china-trade-automation", note: "Supplier and export-document workflows" },
  { label: "United States", path: "/usa-freight-forwarding-automation", note: "Import, export and forwarding operations" },
] as const;

export function MarketPage({ content }: { content: MarketPageContent }) {
  return (
    <>
      <PageHero
        eyebrow={content.eyebrow}
        title={content.title}
        description={content.description}
      >
        <Button asChild>
          <Link to="/request-demo" search={{ automation: undefined }}>
            Discuss a workflow
          </Link>
        </Button>
        <Button asChild variant="outline">
          <Link to="/custom-solutions">Explore custom solutions</Link>
        </Button>
      </PageHero>

      <section className="container-page section-pad">
        <SectionHeader
          eyebrow={`Who this is for`}
          title={`Trade teams connected to ${content.market}`}
          description={content.audience}
        />
        <div className="mt-8 grid gap-5 md:grid-cols-2">
          {content.workflows.map((workflow) => (
            <article key={workflow.title} className="rounded-xl border border-border bg-card p-6">
              <h2 className="text-lg font-semibold">{workflow.title}</h2>
              <p className="mt-3 text-sm leading-6 text-muted-foreground">{workflow.description}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="border-y border-border bg-card/40">
        <div className="container-page section-pad">
          <SectionHeader
            eyebrow="Delivery approach"
            title="Start with one workflow, not a risky system-wide rollout."
            description="AETHER-TRADE scopes each engagement around the client's process, systems, permissions and review requirements."
          />
          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {[
              ["Map the process", "Document the current hand-offs, required information, exceptions and systems."],
              ["Agree controls", "Confirm approved data access, integration scope, human review points and success measures."],
              ["Pilot and assess", "Test one bounded workflow with sample or client-authorized data before considering expansion."],
            ].map(([title, description], index) => (
              <article key={title} className="rounded-xl border border-border bg-background p-6">
                <p className="eyebrow">Step 0{index + 1}</p>
                <h3 className="mt-2 font-semibold">{title}</h3>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">{description}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="container-page section-pad">
        <SectionHeader
          eyebrow="Scope and limitations"
          title="Clear claims. Client-approved access."
          description="The market context below does not imply a local office, local legal representation, customs clearance service, government-system integration or pre-built connection in this market. Availability and deliverables are confirmed for each project."
        />
        <ul className="mt-6 grid gap-3 md:grid-cols-2">
          {content.considerations.map((item) => (
            <li key={item} className="rounded-lg border border-border p-4 text-sm leading-6 text-muted-foreground">
              {item}
            </li>
          ))}
        </ul>
      </section>

      <section className="border-y border-border bg-card/40">
        <div className="container-page section-pad">
          <SectionHeader eyebrow="Common questions" title={`Questions about ${content.market} workflows`} />
          <div className="mt-8 grid gap-5 md:grid-cols-2">
            {content.faq.map((item) => (
              <article key={item.question}>
                <h3 className="font-semibold">{item.question}</h3>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">{item.answer}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="container-page section-pad">
        <SectionHeader
          eyebrow="Other markets"
          title="Explore trade workflows across markets"
          description="AETHER-TRADE uses the same scoped, human-reviewed delivery approach while adapting discovery to each market's operational context."
        />
        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {MARKET_LINKS.filter((item) => item.label !== content.marketKey).map((item) => (
            <Link
              key={item.path}
              to={item.path as never}
              className="rounded-xl border border-border p-5 transition-colors hover:border-primary"
            >
              <h3 className="font-semibold">{item.label}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{item.note}</p>
              <span className="mt-4 inline-block text-sm font-medium text-primary">Explore market</span>
            </Link>
          ))}
        </div>
      </section>
    </>
  );
}
