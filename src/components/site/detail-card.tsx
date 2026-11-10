import { ArrowUpRight } from "lucide-react";
import { CmsIcon } from "@/components/site/cms-icon";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Link } from "@tanstack/react-router";

export function DetailCard({
  title,
  body,
  icon,
  details,
  ctaLabel = "Discuss this with our team",
}: {
  title: string;
  body: string;
  icon?: string;
  details?: string[];
  ctaLabel?: string;
}) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <button
          type="button"
          className="card-elevated group flex h-full w-full flex-col gap-3 p-5 text-left transition-colors hover:border-primary/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          aria-label={`View details: ${title}`}
        >
          {icon ? <CmsIcon name={icon} className="size-5 text-primary" /> : null}
          <span className="text-sm font-semibold leading-snug">{title}</span>
          <span className="text-xs leading-relaxed text-muted-foreground">{body}</span>
          <span className="mt-auto inline-flex items-center gap-1.5 pt-2 text-sm text-primary">
            View details <ArrowUpRight className="size-4 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
          </span>
        </button>
      </DialogTrigger>
      <DialogContent className="max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription className="pt-2 leading-relaxed">{body}</DialogDescription>
        </DialogHeader>
        {details?.length ? (
          <ul className="space-y-2 text-sm text-muted-foreground">
            {details.map((detail) => (
              <li key={detail} className="flex gap-2">
                <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-primary" />
                <span>{detail}</span>
              </li>
            ))}
          </ul>
        ) : null}
        <DialogFooter>
          <Button asChild>
            <Link to="/request-demo" search={{ automation: undefined }}>
              {ctaLabel}
            </Link>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
