import { Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import globe from "@/assets/globe-network.jpg";

/** Closing call-to-action band with the connected-global-trade visual. */
export function CtaBand({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <section className="relative overflow-hidden">
      <img
        src={globe}
        alt=""
        aria-hidden="true"
        loading="lazy"
        width={1920}
        height={1024}
        className="absolute inset-0 h-full w-full object-cover"
      />
      <div
        className="absolute inset-0 bg-gradient-to-r from-background via-background/85 to-background/40"
        aria-hidden="true"
      />
      <div className="container-page relative py-20 sm:py-24">
        <div className="max-w-2xl">
          <p className="eyebrow mb-3">Get started</p>
          <h2 className="text-balance text-3xl font-semibold tracking-tight sm:text-4xl">
            {title}
          </h2>
          <p className="mt-4 text-pretty text-lg text-muted-foreground">{description}</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button variant="hero" size="xl" asChild>
              <Link to="/request-demo" search={{ automation: undefined }}>
                Request a Demo <ArrowRight />
              </Link>
            </Button>
            <Button variant="outline-hero" size="xl" asChild>
              <Link to="/contact">Contact Us</Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
