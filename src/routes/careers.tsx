import { createFileRoute, Link } from "@tanstack/react-router";
import { getPublishedCmsPage, mergeCmsHead } from "@/lib/public-cms.functions";
import { PageHero } from "@/components/site/section";
import { meta, PlaceholderNote } from "@/components/site/blocks";
import { Button } from "@/components/ui/button";
import { CAREERS } from "@/content/site-content";

export const Route = createFileRoute("/careers")({
  loader: async () => ({ cmsPage: await getPublishedCmsPage({ data: { slug: "careers" } }) }),
  head:  ({ loaderData }) => mergeCmsHead((() => {
    const m = meta("Careers", "Careers at AETHER-TRADE.");
    return CAREERS.published ? m : { meta: [...m.meta, { name: "robots", content: "noindex" }] };
  })(), loaderData?.cmsPage) ,
  component: CareersPage,
});

function CareersPage() {
  return (
    <>
      <PageHero
        eyebrow="Careers"
        title="Work on the Future of Trade Operations."
        description="Roles at AETHER-TRADE will be listed here when they are open."
      />
      <section className="container-page section-pad space-y-6">
        {CAREERS.published && CAREERS.openings.length ? (
          <ul className="space-y-3">
            {CAREERS.openings.map((o) => (
              <li key={o.title} className="rounded-xl border border-border bg-card p-5">
                <h2 className="font-semibold">{o.title}</h2>
                <p className="text-sm text-muted-foreground">{o.location} · {o.type}</p>
              </li>
            ))}
          </ul>
        ) : (
          <>
            <PlaceholderNote>No open roles right now</PlaceholderNote>
            <p className="max-w-xl text-muted-foreground">
              We aren't hiring at the moment. If you'd like to introduce yourself for the future, get in touch.
            </p>
            <Button variant="outline" asChild><Link to="/contact">Contact us</Link></Button>
          </>
        )}
      </section>
    </>
  );
}
