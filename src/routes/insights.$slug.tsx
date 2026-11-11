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
          ? { "@type": "Organization", name: loaderData.author }
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
      links: [{ rel: "canonical", href: canonical }],
      meta: [
        { title },
        { name: "description", content: description },
        ...(loaderData.noindex ? [{ name: "robots", content: "noindex, nofollow" }] : []),
        { property: "og:title", content: title },
        { property: "og:description", content: description },
        { property: "og:type", content: "article" },
        { property: "og:url", content: canonical },
        { name: "twitter:card", content: "summary" },
        { name: "twitter:title", content: title },
        { name: "twitter:description", content: description },
      ],
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

function renderInlineMarkdown(text: string) {
  const tokenPattern = /(\\*\\*[^*]+\\*\\*|\\*[^*]+\\*|\\[[^\\]]+\\]\\([^)]+\\))/g;
  return text.split(tokenPattern).filter(Boolean).map((part, index) => {
    if (part.startsWith("**") && part.endsWith("**")) return <strong key={index} className="font-semibold text-foreground">{part.slice(2, -2)}</strong>;
    if (part.startsWith("*") && part.endsWith("*")) return <em key={index}>{part.slice(1, -1)}</em>;
    const match = part.match(/^\\[([^\\]]+)\\]\\(([^)]+)\\)$/);
    if (!match) return part;
    const [, label, href] = match;
    const safeHref = (href.startsWith("/") && !href.startsWith("//")) || href.startsWith("https://");
    if (!safeHref) return label;
    return <a key={index} href={href} className="font-medium text-primary underline-offset-4 hover:underline" {...(href.startsWith("https://") ? { target: "_blank", rel: "noreferrer" } : {})}>{label}</a>;
  });
}

function renderArticleBlock(block: string, index: number) {
  const lines = block.split("\\n");
  if (lines.every((line) => /^[-*]\\s+/.test(line))) return <ul key={index} className="list-disc space-y-2 pl-6">{lines.map((line, itemIndex) => <li key={itemIndex}>{renderInlineMarkdown(line.replace(/^[-*]\\s+/, ""))}</li>)}</ul>;
  if (lines.every((line) => /^\\d+\\.\\s+/.test(line))) return <ol key={index} className="list-decimal space-y-2 pl-6">{lines.map((line, itemIndex) => <li key={itemIndex}>{renderInlineMarkdown(line.replace(/^\\d+\\.\\s+/, ""))}</li>)}</ol>;
  if (block.startsWith("### ")) return <h3 key={index} className="pt-4 text-lg font-semibold leading-7 text-foreground">{renderInlineMarkdown(block.slice(4))}</h3>;
  if (block.startsWith("## ")) return <h2 key={index} className="pt-6 text-2xl font-semibold leading-tight text-foreground">{renderInlineMarkdown(block.slice(3))}</h2>;
  return <p key={index}>{lines.map((line, lineIndex) => <span key={lineIndex}>{lineIndex > 0 ? " " : ""}{renderInlineMarkdown(line)}</span>)}</p>;
}

function InsightArticlePage() {
  const article = Route.useLoaderData();
  const blocks = article.body
    .split(/\n{2,}/)
    .map((block) => block.trim())
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
        {blocks.map(renderArticleBlock)}
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
      <section className="mt-12 rounded-xl border border-border bg-card p-6 md:p-8">
        <h2 className="text-2xl font-semibold text-foreground">
          Want to improve a document or shipment workflow?
        </h2>
        <p className="mt-3 leading-7 text-muted-foreground">
          Start with one process. We can map the hand-offs, identify repetitive checks and scope a
          practical pilot with human review.
        </p>
        <a
          href="/contact"
          className="mt-5 inline-flex font-medium text-primary underline-offset-4 hover:underline"
        >
          Discuss your workflow →
        </a>
      </section>
    </article>
  );
}
