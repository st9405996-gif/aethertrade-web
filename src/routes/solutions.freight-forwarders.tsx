import { createFileRoute, Link } from "@tanstack/react-router";
import { PageHero, SectionHeader } from "@/components/site/section";
import { Button } from "@/components/ui/button";

const SITE_URL = "https://aethertrade.cloud";
const PAGE_TITLE = "Freight Forwarding Workflow Automation | AETHER-TRADE";
const PAGE_DESCRIPTION =
  "Organize freight documents, shipment follow-ups and exception reviews with human-reviewed workflows for freight forwarding operations.";

export const Route = createFileRoute("/solutions/freight-forwarders")({
  head: () => ({
    links: [{ rel: "canonical", href: SITE_URL + "/solutions/freight-forwarders" }],
    meta: [
      { title: PAGE_TITLE },
      { name: "description", content: PAGE_DESCRIPTION },
      { property: "og:title", content: PAGE_TITLE },
      { property: "og:description", content: PAGE_DESCRIPTION },
      { property: "og:type", content: "website" },
    ],
  }),
  component: FreightForwardersPage,
});

const workflows = [
  {
    title: "Trade document intake",
    description:
      "Bring commercial invoices, packing lists and agreed shipment documents into a consistent review process. Extracted fields and potential inconsistencies should be checked by an authorized team member.",
  },
  {
    title: "Shipment follow-up",
    description:
      "Track which agreed documents or details are outstanding, prepare follow-up drafts and route them for approval before a message is sent.",
  },
  {
    title: "Exception and hand-off tracking",
    description:
      "Give operations staff a clearer view of open cases, missing information, ownership and the next action instead of relying on scattered inbox threads.",
  },
];

function FreightForwardersPage() {
  return (
    <>
      <PageHero
        eyebrow="For freight forwarders"
        title="Make document-heavy freight workflows easier to manage."
        description="AETHER-TRADE helps freight forwarding teams organize shipment documents, review key details and coordinate repeatable follow-ups. Start with one workflow and keep people in control of consequential decisions."
      >
        <Button asChild>
          <Link to="/request-demo" search={{ automation: undefined }}>
            Discuss your workflow
          </Link>
        </Button>
        <Button asChild variant="outline">
          <Link to="/shipment-follow-up">View shipment follow-up demo</Link>
        </Button>
      </PageHero>

      <section className="container-page section-pad">
        <SectionHeader
          eyebrow="Where teams lose time"
          title="The work between receiving a shipment file and closing the case"
          description="Freight operations often coordinate information across customers, suppliers, carriers and internal teams. The exact process varies by company, but common friction points include:"
        />
        <ul className="mt-7 grid gap-4 md:grid-cols-2">
          {[
            "Invoices, packing lists and transport documents arrive through different channels.",
            "Staff repeatedly compare shipment references, quantities, dates and party details.",
            "Outstanding documents are followed up manually across long email threads.",
            "Exceptions and ownership are difficult to see when updates sit in separate systems.",
          ].map((item) => (
            <li key={item} className="rounded-xl border border-border bg-card p-5 text-sm leading-7 text-muted-foreground">
              {item}
            </li>
          ))}
        </ul>
      </section>

      <section className="border-y border-border bg-card/40">
        <div className="container-page section-pad">
          <SectionHeader
            eyebrow="Workflow areas"
            title="Start with a specific operational bottleneck"
            description="These are workflow areas to assess, not a promise that every integration or automation is already available as a standard product."
          />
          <div className="mt-8 grid gap-5 md:grid-cols-3">
            {workflows.map((workflow) => (
              <article key={workflow.title} className="rounded-xl border border-border bg-background p-6">
                <h2 className="text-lg font-semibold">{workflow.title}</h2>
                <p className="mt-3 text-sm leading-7 text-muted-foreground">{workflow.description}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="container-page section-pad">
        <SectionHeader
          eyebrow="A bounded pilot"
          title="Prove one workflow before expanding"
          description="A practical engagement begins with the current process, the documents involved, the systems the client authorizes and the checks that must remain under human control."
        />
        <ol className="mt-8 grid gap-4 md:grid-cols-3">
          {[
            ["Map the process", "Agree the starting point, hand-offs, required fields, exceptions and current pain points."],
            ["Set controls", "Confirm access permissions, review steps, test cases, data handling and success measures."],
            ["Test a pilot", "Run a limited workflow with approved sample or client-authorized data and review the results with the team."],
          ].map(([title, description], index) => (
            <li key={title} className="rounded-xl border border-border p-6">
              <p className="eyebrow">Step 0{index + 1}</p>
              <h2 className="mt-2 font-semibold">{title}</h2>
              <p className="mt-2 text-sm leading-7 text-muted-foreground">{description}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="border-y border-border bg-card/40">
        <div className="container-page section-pad">
          <SectionHeader eyebrow="Scope and limitations" title="Clear boundaries from the start" />
          <ul className="mt-6 grid gap-3 md:grid-cols-2">
            {[
              "AETHER-TRADE does not claim to file customs declarations, clear shipments or connect to government customs systems.",
              "ERP, TMS, CRM, email and carrier integrations depend on client authorization, available interfaces and an agreed scope.",
              "AI-assisted outputs and extracted document fields require review by the responsible user before consequential action.",
              "Capabilities labelled In Development, Custom Build or Planned are not represented as generally available.",
            ].map((item) => (
              <li key={item} className="rounded-lg border border-border p-4 text-sm leading-7 text-muted-foreground">{item}</li>
            ))}
          </ul>
        </div>
      </section>

      <section className="container-page section-pad">
        <SectionHeader eyebrow="Common questions" title="Freight forwarding workflow questions" />
        <div className="mt-7 grid gap-6 md:grid-cols-2">
          <article>
            <h2 className="font-semibold">Can you automate shipment document follow-ups?</h2>
            <p className="mt-2 text-sm leading-7 text-muted-foreground">A bounded workflow can be assessed using an agreed document checklist, authorized inbox or data source, approval controls and test cases. The live scope is confirmed before deployment.</p>
          </article>
          <article>
            <h2 className="font-semibold">Can you connect our existing freight software?</h2>
            <p className="mt-2 text-sm leading-7 text-muted-foreground">Potential connections are reviewed individually. They require permission, compatible APIs or other supported interfaces, and a separately agreed implementation scope.</p>
          </article>
          <article>
            <h2 className="font-semibold">Does this replace our operations team?</h2>
            <p className="mt-2 text-sm leading-7 text-muted-foreground">No. The intended role is to organize information and reduce repeatable manual coordination while keeping review and decisions with authorized staff.</p>
          </article>
          <article>
            <h2 className="font-semibold">How do we start?</h2>
            <p className="mt-2 text-sm leading-7 text-muted-foreground">Choose one recurring workflow, describe the current steps and agree how a small pilot would be evaluated.</p>
          </article>
        </div>
      </section>

      <section className="container-page section-pad">
        <div className="rounded-2xl border border-border bg-card p-7 md:p-10">
          <h2 className="text-2xl font-semibold">Which freight workflow is slowing your team down?</h2>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-muted-foreground">Tell us what documents your team handles, where follow-ups happen and what you want to improve. We will assess whether a focused pilot is appropriate.</p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Button asChild>
              <Link to="/request-demo" search={{ automation: undefined }}>Request a workflow discussion</Link>
            </Button>
            <Button asChild variant="outline">
              <Link to="/contact">Contact AETHER-TRADE</Link>
            </Button>
          </div>
        </div>
      </section>
    </>
  );
}
