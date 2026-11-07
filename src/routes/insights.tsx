import { createFileRoute, Link } from "@tanstack/react-router";
import { getPublishedCmsPage, mergeCmsHead } from "@/lib/public-cms.functions";
import { CmsPageSections } from "@/components/site/cms-page-renderer";
import { PageHero } from "@/components/site/section";
import { CtaBand } from "@/components/site/cta-band";
import { getPublishedInsights } from "@/lib/public-insights.functions";

export const Route = createFileRoute("/insights")({
  loader: async () => ({
    articles: await getPublishedInsights(),
    cmsPage: await getPublishedCmsPage({ data: { slug: "insights" } }),
  }),
  head: ({ loaderData }) =>
    mergeCmsHead(
      (() => ({
        meta: [
          { title: "Insights — AETHER-TRADE" },
          {
            name: "description",
            content:
              "Practical perspectives on trade operations, document workflows and responsible AI in logistics.",
          },
          { property: "og:type", content: "website" },
        ],
      }))(),
      loaderData?.cmsPage,
    ),
  component: InsightsPage,
});

function InsightsPage() {
  const { articles, cmsPage } = Route.useLoaderData();

  return (
    <>
      <PageHero
        eyebrow="Insights"
        title="Notes on Running Better Trade Operations."
        description="Practical perspectives on documents, workflows and where AI genuinely helps."
      />
      <section className="container-page section-pad space-y-8">
        {articles.length === 0 ? (
          <p className="rounded-lg border border-dashed border-border px-4 py-6 text-sm text-muted-foreground">
            No articles have been published yet. Check back soon.
          </p>
        ) : (
          <div className="grid gap-5 md:grid-cols-3">
            {articles.map((article) => (
              <article
                key={article.slug}
                className="flex flex-col rounded-xl border border-border bg-card p-6"
              >
                {article.category ? <p className="eyebrow mb-2">{article.category}</p> : null}
                <h2 className="text-lg font-semibold">
                  <Link
                    to="/insights/$slug"
                    params={{ slug: article.slug }}
                    className="transition-colors hover:text-primary"
                  >
                    {article.title}
                  </Link>
                </h2>
                <p className="mt-2 flex-1 text-sm text-muted-foreground">
                  {article.body.length > 220
                    ? `${article.body.slice(0, 217).trimEnd()}…`
                    : article.body}
                </p>
                <Link
                  to="/insights/$slug"
                  params={{ slug: article.slug }}
                  className="mt-5 text-sm font-medium text-primary hover:underline"
                >
                  Read article
                </Link>
              </article>
            ))}
          </div>
        )}
      </section>
      <CmsPageSections page={cmsPage} />
      <CtaBand
        title="Have a question we should write about?"
        description="Tell us what your team is wrestling with."
      />
    </>
  );
}
