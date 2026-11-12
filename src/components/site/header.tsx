import { Link } from "@tanstack/react-router";
import { Menu, ArrowRight } from "lucide-react";
import { Logo } from "@/components/site/logo";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetClose,
} from "@/components/ui/sheet";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getPublishedContentRecords } from "@/lib/public-content-records.functions";
import { getPublicWebsiteSettings } from "@/lib/public-website-settings.functions";
import { filterCareersLinks } from "@/lib/careers-visibility";

export function Header() {
  const [open, setOpen] = useState(false);
  const { data, isError } = useQuery({
    queryKey: ["public-navigation"],
    queryFn: () => getPublishedContentRecords({ data: { module: "navigation" } }),
  });
  const { data: siteSettings } = useQuery({
    queryKey: ["public-website-settings"],
    queryFn: () => getPublicWebsiteSettings(),
  });
  const configured = !isError
    ? data
        ?.filter(
          (item) => item.category.toLowerCase() === "header" && item.fields["visible"] !== "false",
        )
        .map((item) => ({ label: item.title, to: item.body.trim() }))
        .filter((item) => item.to.startsWith("/") && !item.to.startsWith("//"))
    : undefined;
  const items = filterCareersLinks(configured ?? [], siteSettings);
  const navigationMessage = isError
    ? "Navigation links could not be loaded."
    : data && items.length === 0
      ? "No navigation links are published."
      : "";

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/70 bg-background/80 backdrop-blur-md">
      <div className="container-page flex h-16 items-center justify-between gap-4">
        <Logo />
        <nav aria-label="Primary" className="hidden items-center gap-1 lg:flex">
          {items.map((item) => (
            <Link
              key={item.to}
              to={item.to as never}
              className="rounded-md px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
              activeProps={{ className: "text-foreground bg-accent/60" }}
            >
              {item.label}
            </Link>
          ))}
          <Link to={"/document-intake" as never} className="rounded-md px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-foreground" activeProps={{ className: "text-foreground bg-accent/60" }}>Document Intake</Link>
          <Link to={"/shipment-follow-up" as never} className="rounded-md px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-foreground" activeProps={{ className: "text-foreground bg-accent/60" }}>Shipment Follow-Up</Link>
          {navigationMessage && (
            <span role="status" className="px-3 py-2 text-sm text-muted-foreground">
              {navigationMessage}
            </span>
          )}
        </nav>
        <div className="flex items-center gap-2">
          <Button variant="hero" size="sm" asChild className="hidden sm:inline-flex">
            <Link to="/request-demo" search={{ automation: undefined }}>
              Book an Operations Audit
              <ArrowRight />
            </Link>
          </Button>
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                className="lg:hidden"
                aria-label="Open navigation menu"
              >
                <Menu />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-80 overflow-y-auto">
              <SheetHeader>
                <SheetTitle className="text-left">
                  <Logo />
                </SheetTitle>
              </SheetHeader>
              <nav aria-label="Mobile" className="flex flex-col gap-1 px-4">
                {items.map((item) => (
                  <SheetClose asChild key={item.to}>
                    <Link
                      to={item.to as never}
                      className="rounded-md px-3 py-3 text-base text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                      activeProps={{ className: "text-foreground bg-accent/60" }}
                    >
                      {item.label}
                    </Link>
                  </SheetClose>
                ))}
                <SheetClose asChild><Link to={"/document-intake" as never} className="rounded-md px-3 py-3 text-base text-muted-foreground transition-colors hover:bg-accent hover:text-foreground">Document Intake</Link></SheetClose>
                <SheetClose asChild><Link to={"/shipment-follow-up" as never} className="rounded-md px-3 py-3 text-base text-muted-foreground transition-colors hover:bg-accent hover:text-foreground">Shipment Follow-Up</Link></SheetClose>
                {navigationMessage && (
                  <p role="status" className="px-3 py-3 text-sm text-muted-foreground">
                    {navigationMessage}
                  </p>
                )}
                <SheetClose asChild>
                  <Link
                    to="/contact"
                    className="rounded-md px-3 py-3 text-base text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                  >
                    Contact
                  </Link>
                </SheetClose>
              </nav>
              <div className="mt-4 px-4 pb-6">
                <SheetClose asChild>
                  <Button variant="hero" size="lg" className="w-full" asChild>
                    <Link to="/request-demo" search={{ automation: undefined }}>
                      Book an Operations Audit
                      <ArrowRight />
                    </Link>
                  </Button>
                </SheetClose>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
