import { useQuery } from "@tanstack/react-query";
import { getPublishedCmsPage, type PublishedCmsPage } from "@/lib/public-cms.functions";

export function CmsPageSections({ page }: { page: PublishedCmsPage | null }) {
  if (!page || (!page.body.trim() && !page.sections.length)) return null;
  return <CmsPageRenderer page={page} showTitle={false} />;
}

export function CmsPageRenderer({
  page,
  showTitle = true,
}: {
  page: PublishedCmsPage;
  showTitle?: boolean;
}) {
  const hasBody = page.body.trim().length > 0;
  const sections = page.sections.filter(
    (section) => section.title || section.body || section.imageUrl,
  );
  return (
    <section className="container-page space-y-10 py-12 md:py-16">
      {showTitle && (
        <header className="max-w-4xl">
          <p className="eyebrow">AETHER-TRADE</p>
          <h1 className="mt-4 text-4xl font-semibold tracking-tight text-foreground md:text-5xl">
            {page.title}
          </h1>
        </header>
      )}
      {hasBody && (
        <div className="max-w-4xl whitespace-pre-wrap text-base leading-8 text-muted-foreground">
          {page.body}
        </div>
      )}
      {sections.map((section, index) => (
        <section
          key={section.id || index}
          className="grid gap-6 border-t border-border pt-8 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] md:items-start"
        >
          <div className="space-y-4">
            {section.title && (
              <h2 className="text-2xl font-semibold tracking-tight text-foreground md:text-3xl">
                {section.title}
              </h2>
            )}
            {section.body && (
              <p className="whitespace-pre-wrap text-base leading-8 text-muted-foreground">
                {section.body}
              </p>
            )}
          </div>
          {section.imageUrl && (
            <figure>
              <img
                src={section.imageUrl}
                alt={section.imageAlt || section.title}
                loading="lazy"
                className="w-full rounded-md border border-border object-cover"
              />
              {section.imageAlt && (
                <figcaption className="mt-2 text-xs text-muted-foreground">
                  {section.imageAlt}
                </figcaption>
              )}
            </figure>
          )}
        </section>
      ))}
    </section>
  );
}
