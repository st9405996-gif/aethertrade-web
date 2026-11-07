import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { getPublishedInsight } from "@/lib/public-insights.functions";

const SITE_URL = "https://aethertrade.cloud";

export const Route = createFileRoute("/insights/$slug")({
  loader: async ({ params }) => {
    const article = await getPublishedInsight({ data: { slug: params.slug } });
    if (!article) throw notFound();
    return article;
  },
  head: ({ loaderData }) => {
    if (!loaderData) return {};

    const title = loaderData.seoTitle || `${loaderData.title} — AETHER-TRADE`;
    const description =
      loaderData.seoDescription ||
      loaderData.geoSummary ||
      loaderData.body.replace(/\s+/g, " ").trim().slice(0, 160);
    const canonical = `${SITE_URL}/insights/${encodeURIComponent(loaderData.slug)}`;
    const graph: Record<string, unknown>[] = [
      {
        "@context": "https://schema.org",
        "@type": "Article",
        headline: loaderData.title,
        description,
        mainEntityOfPage: canonical,
        author: loaderData.author
          ? { "@type": "Person", name: loaderData.author }
          : { "@type": "Organization", name: "AETHER-TRADE" },
        publisher: {
          "@type": "Organization",
          name: "AETHER-TRADE",
          url: SITE_URL,
        },
      },
    ];

    if (loaderData.aeoQuestions.length > 0) {
      graph.push({
        "@context": "https://schema.org",
        "@type": "FAQPage",
        mainEntity: loaderData.aeoQuestions.map(({ question, answer }) => ({
          "@type": "Question",
          name: question,
          acceptedAnswer: { "@type": "Answer", text: answer },
        })),
      });
    }

    return {
      meta: [
        { title },
        { name: "description", content: description },
        ...(loaderData.noindex ? [{ name: "robots", content: "noindex, nofollow" }] : []),
        { property: "og:title", content: title },
        { property: "og:description", content: description },
        { property: "og:type", content: "article" },
        { name: "twitter:card", content: "summary" },
        { name: "twitter:title", content: title },
        { name: "twitter:description", content: description },
      ],
      links: [{ rel: "canonical", href: canonical }],
      scripts: [
        {
          type: "application/ld+json",
          children: JSON.stringify(graph).replace(/</g, "\\u003c"),
        },
      ],
    };
  },
  component: InsightArticlePage,
});

function InsightArticlePage() {
  const article = Route.useLoaderData();
  const paragraphs = article.body
    .split(/\n{2,}/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);

  return (
    <article className="container-page section-pad mx-auto max-w-3xl">
      <Link
        to="/insights"
        className="text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        ← All insights
      </Link>
      <header className="mb-10 mt-8 space-y-4">
        {article.category ? <p className="eyebrow">{article.category}</p> : null}
        <h1 className="text-3xl font-semibold tracking-tight md:text-5xl">{article.title}</h1>
        {article.author ? (
          <p className="text-sm text-muted-foreground">By {article.author}</p>
        ) : null}
      </header>
      {article.geoSummary ? (
        <aside className="mb-8 rounded-lg border border-border bg-card p-5">
          <h2 className="text-sm font-semibold text-foreground">Key takeaways</h2>
          <p className="mt-2 text-sm leading-7 text-muted-foreground">{article.geoSummary}</p>
        </aside>
      ) : null}
      <div className="space-y-5 text-base leading-8 text-muted-foreground">
        {paragraphs.map((paragraph, index) => (
          <p key={index}>{paragraph}</p>
        ))}
      </div>
      {article.aeoQuestions.length > 0 ? (
        <section className="mt-12 border-t border-border pt-8">
          <h2 className="text-xl font-semibold text-foreground">Common questions</h2>
          <dl className="mt-5 space-y-6">
            {article.aeoQuestions.map(({ question, answer }) => (
              <div key={question}>
                <dt className="font-medium text-foreground">{question}</dt>
                <dd className="mt-2 text-sm leading-7 text-muted-foreground">{answer}</dd>
              </div>
            ))}
          </dl>
        </section>
      ) : null}
    </article>
  );
}
