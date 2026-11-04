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
      loaderData.body.replace(/\s+/g, " ").trim().slice(0, 160);
    const canonical = `${SITE_URL}/insights/${encodeURIComponent(loaderData.slug)}`;
    const articleSchema = {
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
    };

    return {
      meta: [
        { title },
        { name: "description", content: description },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
        { property: "og:type", content: "article" },
        { name: "twitter:card", content: "summary" },
      ],
      links: [{ rel: "canonical", href: canonical }],
      scripts: [
        {
          type: "application/ld+json",
          children: JSON.stringify(articleSchema).replace(/</g, "\\u003c"),
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
        <h1 className="text-3xl font-semibold tracking-tight md:text-5xl">
          {article.title}
        </h1>
        {article.author ? (
          <p className="text-sm text-muted-foreground">By {article.author}</p>
        ) : null}
      </header>
      <div className="space-y-5 text-base leading-8 text-muted-foreground">
        {paragraphs.map((paragraph, index) => (
          <p key={index}>{paragraph}</p>
        ))}
      </div>
    </article>
  );
}
