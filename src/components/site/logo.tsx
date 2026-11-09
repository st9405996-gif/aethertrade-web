import { Link } from "@tanstack/react-router";
import { cn } from "@/lib/utils";

/**
 * AETHER-TRADE identity: an engineered A monogram crossed by the original
 * sweeping global orbit mark. Uses semantic theme tokens for light and dark UI.
 */
export function Logo({ className }: { className?: string }) {
  return (
    <Link
      to="/"
      aria-label="AETHER-TRADE home"
      className={cn("group inline-flex min-w-0 items-center gap-2.5", className)}
    >
      <svg
        viewBox="0 0 44 44"
        className="size-9 shrink-0"
        role="img"
        aria-hidden="true"
        fill="none"
      >
        <path d="M22 4.5 5.5 38h8.1L22 21.1 30.4 38h8.1L22 4.5Z" className="fill-foreground" />
        <path d="M16.4 28.7h11.2l3.1 6.2H13.3l3.1-6.2Z" className="fill-primary" />
        <path
          d="M2.5 29.2C8.4 18.1 21.2 12.2 40.5 8.1"
          className="stroke-primary"
          strokeWidth="3.1"
          strokeLinecap="round"
        />
        <path
          d="M3.1 29.6C11.1 35.2 25.4 30.5 39.4 9.2"
          className="stroke-foreground"
          strokeWidth="2.2"
          strokeLinecap="round"
        />
      </svg>
      <span className="flex min-w-0 flex-col leading-none">
        <span className="whitespace-nowrap text-[0.93rem] font-semibold tracking-[0.12em] text-foreground">
          AETHER<span className="text-primary">-TRADE</span>
        </span>
        <span className="mt-1 hidden whitespace-nowrap font-mono text-[0.52rem] tracking-[0.16em] text-muted-foreground sm:block">
          GLOBAL TRADE TECHNOLOGY
        </span>
      </span>
    </Link>
  );
}
