import { Check } from "lucide-react";
import { StatusBadge, type AvailabilityStatus } from "@/components/site/status-badge";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

/** Clickable card grid for capabilities, services, solutions and industries. */
export function CardGrid({
  items,
}: {
  items: { title: string; body: string; status?: AvailabilityStatus; points?: string[] }[];
}) {
  return (
    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {items.map((it) => (
        <article key={it.title} className="h-full">
          <details className="group h-full rounded-xl border border-border bg-card p-6 transition-colors hover:border-primary/50">
            <summary className="flex h-full cursor-pointer list-none flex-col">
              <div className="mb-3 flex items-start justify-between gap-3">
                <h3 className="text-lg font-semibold tracking-tight">{it.title}</h3>
                {it.status ? <StatusBadge status={it.status} className="shrink-0" /> : null}
              </div>
              <p className="text-sm text-muted-foreground">{it.body}</p>
              {it.points?.length ? (
                <ul className="mt-4 space-y-1.5">
                  {it.points.slice(0, 3).map((p) => (
                    <li key={p} className="flex items-center gap-2 text-sm">
                      <Check className="size-3.5 text-primary" aria-hidden="true" /> {p}
                    </li>
                  ))}
                </ul>
              ) : null}
              <span className="mt-auto inline-flex items-center gap-1 pt-5 text-sm font-medium text-primary">
                View details <span aria-hidden="true">↗</span>
              </span>
            </summary>
            <div className="mt-5 border-t border-border pt-4">
              {it.points?.length ? (
                <ul className="space-y-2 text-sm text-muted-foreground">
                  {it.points.map((p) => (
                    <li key={p} className="flex gap-2">
                      <Check className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden="true" /> {p}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm leading-relaxed text-muted-foreground">{it.body}</p>
              )}
              <a href="/request-demo" className="mt-5 inline-flex text-sm font-medium text-primary hover:underline">
                Discuss this with our team →
              </a>
            </div>
          </details>
        </article>
      ))}
    </div>
  );
}

export function FaqList({ items }: { items: { q: string; a: string }[] }) {
  return (
    <Accordion type="single" collapsible className="mx-auto max-w-3xl">
      {items.map((f, i) => (
        <AccordionItem key={f.q} value={`f${i}`}>
          <AccordionTrigger className="text-left">{f.q}</AccordionTrigger>
          <AccordionContent className="text-muted-foreground">{f.a}</AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  );
}

/** Dashed notice for content awaiting verified information. */
export function PlaceholderNote({ children }: { children: React.ReactNode }) {
  return (
    <p className="rounded-lg border border-dashed border-border px-4 py-3 font-mono text-xs uppercase tracking-wider text-muted-foreground">
      {children}
    </p>
  );
}

export function EmptyContentState({ children }: { children: React.ReactNode }) {
  return (
    <p
      role="status"
      className="rounded-lg border border-dashed border-border px-4 py-6 text-sm text-muted-foreground"
    >
      {children}
    </p>
  );
}

export function meta(title: string, description: string) {
  const t = `${title} — AETHER-TRADE`;
  return {
    meta: [
      { title: t },
      { name: "description", content: description },
      { property: "og:title", content: t },
      { property: "og:description", content: description },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  };
}
