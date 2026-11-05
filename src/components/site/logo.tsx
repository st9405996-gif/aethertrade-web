import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { cn } from "@/lib/utils";
import { getPublishedContentRecords } from "@/lib/public-content-records.functions";

export function Logo({ className }: { className?: string }) {
  const { data } = useQuery({
    queryKey: ["public-branding"],
    queryFn: () => getPublishedContentRecords({ data: { module: "branding" } }),
  });
  const brand = data?.[0];
  const name = brand?.title?.trim() || "AETHER-TRADE";
  const logoUrl = brand?.fields.logo?.trim() || "";
  const safeLogo = logoUrl.startsWith("/") && !logoUrl.startsWith("//")
    ? logoUrl
    : /^https:\/\/[A-Za-z0-9.-]+(?:\/[^\s]*)?$/.test(logoUrl) ? logoUrl : "";
  const tagline = brand?.body?.trim() || "GLOBAL TRADE TECHNOLOGY";
  return <Link to="/" aria-label={name + " home"} className={cn("group inline-flex min-w-0 items-center gap-2.5", className)}>
    {safeLogo ? <img src={safeLogo} alt="" className="size-9 shrink-0 object-contain" /> : <svg viewBox="0 0 44 44" className="size-9 shrink-0" role="img" aria-hidden="true" fill="none">
      <path d="M22 4.5 5.5 38h8.1L22 21.1 30.4 38h8.1L22 4.5Z" className="fill-foreground"/>
      <path d="M16.4 28.7h11.2l3.1 6.2H13.3l3.1-6.2Z" className="fill-primary"/>
      <ellipse cx="22" cy="22" rx="20" ry="8.1" transform="rotate(-34 22 22)" className="stroke-primary" strokeWidth="1.8" strokeLinecap="round"/>
      <circle cx="35.1" cy="10.7" r="2.6" className="fill-primary"/>
    </svg>}
    <span className="flex min-w-0 flex-col leading-none">
      <span className="whitespace-nowrap text-[0.93rem] font-semibold tracking-[0.12em] text-foreground">{name}</span>
      <span className="mt-1 hidden whitespace-nowrap font-mono text-[0.52rem] tracking-[0.16em] text-muted-foreground sm:block">{tagline}</span>
    </span>
  </Link>;
}
