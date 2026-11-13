export function CompanyPositioning() {
  return (
    <section className="border-b border-border bg-secondary/20 py-12 sm:py-16" aria-labelledby="company-positioning-title">
      <div className="container-page grid gap-6 md:grid-cols-[0.8fr_1.2fr] md:items-start">
        <div>
          <p className="eyebrow">Who we are</p>
          <h2 id="company-positioning-title" className="mt-3 text-2xl font-semibold tracking-tight sm:text-3xl">
            We build custom software for real business operations.
          </h2>
        </div>
        <div className="space-y-4 text-sm leading-7 text-muted-foreground sm:text-base">
          <p>
            AETHER-TRADE is a software development and technology company. We design and build
            custom software applications, AI-powered tools and workflow automation solutions
            around each client's operational requirements.
          </p>
          <p>
            Our solutions can be delivered as standalone applications. Where a client needs
            them to work with existing ERP, TMS, CRM or other business tools, integrations can
            be scoped as a separate part of the project.
          </p>
          <p className="font-medium text-foreground">
            We build software and automation solutions; we are not simply an AI layer added
            on top of another company's software.
          </p>
        </div>
      </div>
    </section>
  );
}
