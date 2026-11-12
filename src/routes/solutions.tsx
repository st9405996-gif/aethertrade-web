import { createFileRoute, Link } from "@tanstack/react-router";
import { getPublishedCmsPage, mergeCmsHead, cmsHero, cmsCta } from "@/lib/public-cms.functions";
import { CmsPageSections } from "@/components/site/cms-page-renderer";
import { getPublishedContentRecords } from "@/lib/public-content-records.functions";
import { PageHero, SectionHeader } from "@/components/site/section";
import { EmptyContentState, meta } from "@/components/site/blocks";
import { CtaBand } from "@/components/site/cta-band";
import { Button } from "@/components/ui/button";
import { ArrowUpRight, Check } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

const lines = (value: string) =>
  value
    .split("\n")
    .map((item) => item.trim())
    .filter(Boolean);
export const Route = createFileRoute("/solutions")({
  loader: async () => ({
    cmsPage: await getPublishedCmsPage({ data: { slug: "solutions" } }),
    items: await getPublishedContentRecords({ data: { module: "solutions" } }),
  }),
  head: ({ loaderData }) =>
    mergeCmsHead(
      meta(
        "Solutions",
        "Solutions for importers, exporters, freight forwarders, logistics operators and trading companies.",
      ),
      loaderData?.cmsPage,
      { fallbackPath: "/solutions", title: "Solutions for Freight Forwarders & Trade Teams | AETHER-TRADE", description: "Workflow automation and document intelligence for freight forwarders, customs brokers, importers, exporters, logistics operators and trading companies." },
    ),
  component: SolutionsPage,
});
function SolutionsPage() {
  const { items, cmsPage } = Route.useLoaderData();
  const records = items.map((item) => ({
    slug: item.slug,
    title: item.title,
    audience: item.body,
    challenges: lines(item.fields["challenges"] || ""),
    helps: lines(item.fields["benefits"] || ""),
  }));

  // Keep the homepage and Solutions audience lists aligned without implying
  // customs filing, government access or a pre-built customs integration.
  if (!records.some((item) => item.slug === "customs-brokers")) {
    records.push({
      slug: "customs-brokers",
      title: "Customs Brokers",
      audience:
        "Potential workflow use cases include organizing supporting shipment documents, tracking review status and routing exceptions for authorized broker staff. Customs filing and government-system access are not offered.",
      challenges: [
        "Supporting documents arrive across inboxes and client channels",
        "Review status and outstanding information are difficult to track",
        "Exceptions need clear ownership and evidence for follow-up",
      ],
      helps: [
        "Structure each client or shipment document set around an agreed reference",
        "Flag missing or inconsistent information for human review",
        "Keep review outcomes and hand-offs organized for the responsible team",
      ],
    });
  }
  return (
    <>
      <PageHero
        {...cmsHero(cmsPage, {
          eyebrow: "Solutions",
          title: "Built Around How Your Business Trades.",
          description:
            "Different roles in global trade face different operational problems. Here is where we focus for each.",
        })}
      >
        <Button variant="outline" asChild>
          <Link to="/industries">Browse by industry</Link>
        </Button>
      </PageHero>
      <section className="container-page section-pad space-y-6">
        <SectionHeader eyebrow="By business type" title="Who we help" />
        {records.length ? (
          records.map((item) => (
            <Dialog key={item.slug}>
              <article
                id={item.slug}
                className="grid gap-6 rounded-xl border border-border bg-card p-6 md:grid-cols-3"
              >
              <div>
                <DialogTrigger asChild>
                  <button type="button" className="inline-flex items-center gap-2 text-left text-xl font-semibold hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                    {item.title} <ArrowUpRight className="size-4" />
                  </button>
                </DialogTrigger>
                <p className="mt-2 text-sm text-muted-foreground">{item.audience}</p>
              </div>
              <div>
                <p className="eyebrow mb-2">Common challenges</p>
                <ul className="list-disc space-y-1 pl-5 text-sm">
                  {item.challenges.map((value) => (
                    <li key={value}>{value}</li>
                  ))}
                </ul>
              </div>
              <div>
                <p className="eyebrow mb-2">How we help</p>
                <ul className="list-disc space-y-1 pl-5 text-sm">
                  {item.helps.map((value) => (
                    <li key={value}>{value}</li>
                  ))}
                </ul>
              </div>
              </article>
              <DialogContent className="max-h-[85vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>{item.title}</DialogTitle>
                  <DialogDescription className="pt-2 leading-relaxed">{item.audience}</DialogDescription>
                </DialogHeader>
                <div className="grid gap-5 sm:grid-cols-2">
                  <div>
                    <p className="mb-2 text-sm font-semibold">Common challenges</p>
                    <ul className="space-y-2 text-sm text-muted-foreground">
                      {item.challenges.map((value) => (
                        <li key={value} className="flex gap-2">
                          <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-primary" />
                          <span>{value}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <p className="mb-2 text-sm font-semibold">How we help</p>
                    <ul className="space-y-2 text-sm text-muted-foreground">
                      {item.helps.map((value) => (
                        <li key={value} className="flex gap-2">
                          <Check className="mt-0.5 size-4 shrink-0 text-primary" />
                          <span>{value}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
                <DialogFooter>
                  <Button asChild>
                    <Link to="/request-demo" search={{ automation: undefined }}>
                      Discuss your requirements
                    </Link>
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          ))
        ) : (
          <EmptyContentState>No published solutions are available.</EmptyContentState>
        )}
      </section>
      <CmsPageSections page={cmsPage} />
      <CtaBand
        {...cmsCta(cmsPage, {
          title: "Don't see your exact situation?",
          description: "Most operations are a mix. Tell us about yours.",
        })}
      />
    </>
  );
}
