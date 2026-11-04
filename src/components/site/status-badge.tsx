import { cn } from "@/lib/utils";
export type AvailabilityStatus = "Available" | "Custom Build";
const STYLES: Record<AvailabilityStatus, string> = {
  Available: "bg-success/10 text-success border-success/30",
  "Custom Build": "bg-primary/10 text-primary border-primary/30",
};
/** Public label for services that are available or delivered as a scoped custom build. */
export function StatusBadge({ status, className }: { status: AvailabilityStatus; className?: string }) {

  return <span className={cn("inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 font-mono text-[0.7rem] uppercase tracking-wider", STYLES[status], className)}>
    <span className="size-1.5 rounded-full bg-current" aria-hidden="true" />{status}
  </span>;
}
