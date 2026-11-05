import { PageHero } from "@/components/site/section";
import { CtaBand } from "@/components/site/cta-band";
import { CmsPageSections } from "@/components/site/cms-page-renderer";
import type { PublishedCmsPage } from "@/lib/public-cms.functions";

/**
 * Interim page used until the full page content ships in the next milestone.
 * Real navigation and CTAs; clearly labelled so nothing looks finished but empty.
 */
export function StubPage({
  eyebrow,
  title,
  description,
  note,
  cmsPage,
}: {
  eyebrow: string;
  title: string;
  description: string;
  note: string;
  cmsPage?: PublishedCmsPage | null;
}) {
  return (
    <>
      <PageHero eyebrow={eyebrow} title={title} description={description}>
        <p className="inline-flex items-center gap-2 rounded-full border border-dashed border-border px-4 py-1.5 font-mono text-[0.7rem] uppercase tracking-widest text-muted-foreground">
          {note}
        </p>
      </PageHero>
      <CmsPageSections page={cmsPage ?? null} />
      <CtaBand
        title="Start the conversation."
        description="Tell us about your business, your operational challenges and what you want to improve."
      />
    </>
  );
}
