import { Link } from "@tanstack/react-router";
import { cn } from "@/lib/utils";

/** AETHER-TRADE logomark: a precision "A" chevron with an accent node. */
export function Logo({ className }: { className?: string }) {
  return (
    <Link
      to="/"
      aria-label="AETHER-TRADE home"
      className={cn("flex items-center gap-2.5", className)}
    >
      <svg
        viewBox="0 0 32 32"
        className="size-8 shrink-0"
        role="img"
        aria-hidden="true"
        fill="none"
      >
        <path
          d="M16 3 4 27h6.4L16 13.2 21.6 27H28L16 3Z"
          className="fill-foreground"
        />
        <path d="M12.4 21h7.2l1.5 3.4h-10.2L12.4 21Z" className="fill-primary" />
        <circle cx="16" cy="17.5" r="1.6" className="fill-primary" />
      </svg>
      <span className="font-mono text-[0.95rem] font-medium tracking-[0.18em] text-foreground">
        AETHER-TRADE
      </span>
    </Link>
  );
}
