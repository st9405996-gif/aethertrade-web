import type { ReactNode } from "react";
import { PageHero } from "@/components/site/section";
import { PlaceholderNote } from "@/components/site/blocks";

export const LEGAL_UPDATED = "November 2, 2026";

/** Shared layout for legal pages. Text is accurate to the site's current behavior but awaits legal review. */
export function LegalPage({ title, intro, children }: { title: string; intro: string; children: ReactNode }) {
  return (
    <>
      <PageHero eyebrow="Legal" title={title} description={intro} />
      <section className="container-page section-pad max-w-3xl space-y-6 text-muted-foreground [&_h2]:pt-4 [&_h2]:text-xl [&_h2]:font-semibold [&_h2]:text-foreground [&_ul]:list-disc [&_ul]:space-y-2 [&_ul]:pl-6">
        <PlaceholderNote>Pending legal review · last updated {LEGAL_UPDATED}</PlaceholderNote>
        {children}
      </section>
    </>
  );
}
