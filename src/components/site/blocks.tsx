import { Check } from "lucide-react";
import { StatusBadge, type AvailabilityStatus } from "@/components/site/status-badge";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

/** Card grid used for capabilities, services and solutions. */
export function CardGrid({
  items,
}: {
  items: { title: string; body: string; status?: AvailabilityStatus; points?: string[] }[];
}) {
  return (
    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {items.map((it) => (
        <article
          key={it.title}
          className="flex flex-col rounded-xl border border-border bg-card p-6"
        >
          <div className="mb-3 flex items-start justify-between gap-3">
            <h3 className="text-lg font-semibold tracking-tight">{it.title}</h3>
            {it.status ? <StatusBadge status={it.status} className="shrink-0" /> : null}
          </div>
          <p className="text-sm text-muted-foreground">{it.body}</p>
          {it.points?.length ? (
            <ul className="mt-4 space-y-1.5">
              {it.points.map((p) => (
                <li key={p} className="flex items-center gap-2 text-sm">
                  <Check className="size-3.5 text-primary" aria-hidden="true" /> {p}
                </li>
              ))}
            </ul>
          ) : null}
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
