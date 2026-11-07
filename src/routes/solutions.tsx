import { createFileRoute, Link } from "@tanstack/react-router";
import { getPublishedCmsPage, mergeCmsHead } from "@/lib/public-cms.functions";
import { CmsPageSections } from "@/components/site/cms-page-renderer";
import { getPublishedContentRecords } from "@/lib/public-content-records.functions";
import { PageHero, SectionHeader } from "@/components/site/section";
import { EmptyContentState, meta } from "@/components/site/blocks";
import { CtaBand } from "@/components/site/cta-band";
import { Button } from "@/components/ui/button";

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
  return (
    <>
      <PageHero
        eyebrow="Solutions"
        title="Built Around How Your Business Trades."
        description="Different roles in global trade face different operational problems. Here is where we focus for each."
      >
        <Button variant="outline" asChild>
          <Link to="/industries">Browse by industry</Link>
        </Button>
      </PageHero>
      <section className="container-page section-pad space-y-6">
        <SectionHeader eyebrow="By business type" title="Who we help" />
        {records.length ? (
          records.map((item) => (
            <article
              key={item.slug}
              id={item.slug}
              className="grid gap-6 rounded-xl border border-border bg-card p-6 md:grid-cols-3"
            >
              <div>
                <h3 className="text-xl font-semibold">{item.title}</h3>
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
          ))
        ) : (
          <EmptyContentState>No published solutions are available.</EmptyContentState>
        )}
      </section>
      <CmsPageSections page={cmsPage} />
      <CtaBand
        title="Don't see your exact situation?"
        description="Most operations are a mix. Tell us about yours."
      />
    </>
  );
}
