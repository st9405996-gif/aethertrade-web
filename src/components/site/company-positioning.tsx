export function CompanyPositioning() {
  return (
    <section className="border-b border-border bg-secondary/20 py-12 sm:py-16" aria-labelledby="company-positioning-title">
      <div className="container-page grid gap-6 md:grid-cols-[0.8fr_1.2fr] md:items-start">
        <div>
          <p className="eyebrow">Who we are</p>
          <h2 id="company-positioning-title" className="mt-3 text-2xl font-semibold tracking-tight sm:text-3xl">
            We build technology for import-export and logistics operations.
          </h2>
        </div>
        <div className="space-y-4 text-sm leading-7 text-muted-foreground sm:text-base">
          <p>
            AETHER-TRADE is a trade-technology and automation company. We design and build
            custom software, AI agents and connected workflows for importers, exporters,
            freight forwarders, customs brokers and logistics businesses.
          </p>
          <p>
            Our work can cover document intelligence, supplier and shipment coordination,
            repetitive operational processes, reporting and back-office automation. ERP, TMS,
            CRM and other system integrations are scoped separately around approved access.
          </p>
          <p className="font-medium text-foreground">
            We work across trade operations and the technology that connects them — not just document checking.
          </p>
        </div>
      </div>
    </section>
  );
}
