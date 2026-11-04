import { cn } from "@/lib/utils";
export type AvailabilityStatus = "Available" | "In Development" | "Custom Build" | "Planned";
const STYLES: Record<AvailabilityStatus, string> = {
  Available: "bg-success/10 text-success border-success/30",
  "In Development": "bg-warning/10 text-warning border-warning/30",
  "Custom Build": "bg-primary/10 text-primary border-primary/30",
  Planned: "bg-planned/10 text-planned border-planned/30",
};
/** Public catalogue label. Development labels are intentionally omitted from public cards. */
export function StatusBadge({ status, className }: { status: AvailabilityStatus; className?: string }) {
  if (status === "In Development" || status === "Planned") return null;
  return <span className={cn("inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 font-mono text-[0.7rem] uppercase tracking-wider", STYLES[status], className)}>
    <span className="size-1.5 rounded-full bg-current" aria-hidden="true" />{status}
  </span>;
}
