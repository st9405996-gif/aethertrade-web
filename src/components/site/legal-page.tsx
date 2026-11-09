import type { ReactNode } from "react";
import { PageHero } from "@/components/site/section";
import { PlaceholderNote } from "@/components/site/blocks";

export const LEGAL_UPDATED = "November 2, 2026";

/** Shared layout for legal pages. Text is accurate to the site's current behavior but awaits legal review. */
export function LegalPage({
  eyebrow = "Legal",
  title,
  description,
  /** When the CMS "pages" record for this slug has a non-empty Body, it fully replaces `children` below (paragraphs split on blank lines) — letting an editor rewrite the whole legal text from the admin panel without a code change. Leave the record's Body empty to keep the built-in default text. */
  cmsBody,
  children,
}: {
  eyebrow?: string;
  title: string;
  description: string;
  cmsBody?: string | undefined;
  children: ReactNode;
}) {
  const overrideParagraphs = cmsBody?.trim()
    ? cmsBody
        .trim()
        .split(/\n{2,}/)
        .map((p) => p.trim())
        .filter(Boolean)
    : null;
  return (
    <>
      <PageHero eyebrow={eyebrow} title={title} description={description} />
      <section className="container-page section-pad max-w-3xl space-y-6 text-muted-foreground [&_h2]:pt-4 [&_h2]:text-xl [&_h2]:font-semibold [&_h2]:text-foreground [&_ul]:list-disc [&_ul]:space-y-2 [&_ul]:pl-6">
        <PlaceholderNote>Pending legal review · last updated {LEGAL_UPDATED}</PlaceholderNote>
        {overrideParagraphs
          ? overrideParagraphs.map((p, i) => (
              <p key={i} className="whitespace-pre-wrap">
                {p}
              </p>
            ))
          : children}
      </section>
    </>
  );
}
