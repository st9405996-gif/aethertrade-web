import { createFileRoute } from "@tanstack/react-router";
import { getPublishedCmsPage, mergeCmsHead } from "@/lib/public-cms.functions";
import { CmsPageSections } from "@/components/site/cms-page-renderer";
import { PageHero, SectionHeader } from "@/components/site/section";
import { meta } from "@/components/site/blocks";
import { CtaBand } from "@/components/site/cta-band";
import { WorkflowDemo } from "@/components/site/workflow-demo";
import { HOW_IT_WORKS_STEPS } from "@/content/site-content";

export const Route = createFileRoute("/how-it-works")({
  loader: async () => ({ cmsPage: await getPublishedCmsPage({ data: { slug: "how-it-works" } }) }),
  head:  ({ loaderData }) => mergeCmsHead((() =>
    meta(
      "How It Works",
      "How AETHER-TRADE engagements run: discover, scope, configure, pilot and expand — with human review at every step.",
    ))(), loaderData?.cmsPage) ,
  component: HowItWorksPage,
});

function HowItWorksPage() {
  const { cmsPage } = Route.useLoaderData();
  return (
    <>
      <PageHero
        eyebrow="How it works"
        title="Start Small. Prove Value. Then Expand."
        description="Every engagement begins with one workflow, a clear goal and a measured pilot — not a big-bang rollout."
      />
      <section className="container-page section-pad">
        <SectionHeader eyebrow="Engagement" title="Five steps from conversation to working workflow" />
        <ol className="mx-auto mt-12 grid max-w-4xl gap-4">
          {HOW_IT_WORKS_STEPS.map((s, i) => (
            <li key={s.title} className="flex gap-5 rounded-xl border border-border bg-card p-6">
              <span className="font-mono text-sm text-primary">0{i + 1}</span>
              <div>
                <h3 className="font-semibold">{s.title}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{s.body}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>
      <section className="border-t border-border">
        <div className="container-page section-pad">
          <SectionHeader eyebrow="Inside a case" title="What a reviewed workflow looks like" description="Illustrative example with sample data." />
          <div className="mt-10">
            <WorkflowDemo />
          </div>
        </div>
      </section>
      <CmsPageSections page={cmsPage} />
      <CtaBand title="Pick the first workflow together." description="Tell us where your team loses the most time." />
    </>
  );
}
