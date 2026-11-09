import { createFileRoute, Link } from "@tanstack/react-router";
import { PageHero } from "@/components/site/section";
import { meta, PlaceholderNote } from "@/components/site/blocks";
import { Button } from "@/components/ui/button";
import { getPublicWebsiteSettings } from "@/lib/public-website-settings.functions";
import { isCareersEnabled, careersRobotsMeta } from "@/lib/careers-visibility";
import { getPublishedCareerListings } from "@/lib/public-careers.functions";
import { getPublishedCmsPage, mergeCmsHead, cmsHero } from "@/lib/public-cms.functions";
import { CmsPageSections } from "@/components/site/cms-page-renderer";

export const Route = createFileRoute("/careers")({
  loader: async () => {
    const settings = await getPublicWebsiteSettings();
    const openings = isCareersEnabled(settings) ? await getPublishedCareerListings() : [];
    const cmsPage = await getPublishedCmsPage({ data: { slug: "careers" } });
    return { settings, openings, cmsPage };
  },
  head: ({ loaderData }) => {
    const base = meta("Careers", "Careers at AETHER-TRADE.");
    const robots = careersRobotsMeta(loaderData?.settings);
    return mergeCmsHead(
      robots ? { ...base, meta: [...base.meta, robots] } : base,
      loaderData?.cmsPage,
    );
  },
  component: CareersPage,
});

function CareersPage() {
  const { settings, openings, cmsPage } = Route.useLoaderData();
  const careersEnabled = isCareersEnabled(settings);
  return (
    <>
      <PageHero
        {...cmsHero(cmsPage, {
          eyebrow: "Careers",
          title: "Work on the Future of Trade Operations.",
          description: "Roles at AETHER-TRADE will be listed here when they are open.",
        })}
      />
      <section className="container-page section-pad space-y-6">
        {careersEnabled && openings.length ? (
          <ul className="space-y-3">
            {openings.map((opening) => (
              <li key={opening.id} className="rounded-xl border border-border bg-card p-5">
                <h2 className="font-semibold">{opening.title}</h2>
                <p className="text-sm text-muted-foreground">
                  {opening.location} · {opening.type}
                </p>
                {opening.body.trim() && (
                  <p className="mt-3 whitespace-pre-wrap text-sm text-muted-foreground">
                    {opening.body}
                  </p>
                )}
              </li>
            ))}
          </ul>
        ) : (
          <>
            <PlaceholderNote>No open roles right now</PlaceholderNote>
            <p className="max-w-xl text-muted-foreground">
              We aren't hiring at the moment. If you'd like to introduce yourself for the future,
              get in touch.
            </p>
            <Button variant="outline" asChild>
              <Link to="/contact">Contact us</Link>
            </Button>
          </>
        )}
      </section>
      <CmsPageSections page={cmsPage ?? null} />
    </>
  );
}
