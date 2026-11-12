export interface GlobalSeoSettings {
  siteName: string;
  siteUrl: string;
  defaultTitle: string;
  defaultDescription: string;
  defaultOgImage: string;
  googleVerification: string;
  bingVerification: string;
  organizationName: string;
  organizationUrl: string;
  organizationDescription: string;
  organizationLogo: string;
  sameAs: string[];
}

export const DEFAULT_GLOBAL_SEO: GlobalSeoSettings = {
  siteName: "AETHER-TRADE",
  siteUrl: "https://aethertrade.cloud",
  defaultTitle: "AETHER-TRADE | Freight Document Intelligence & Workflow Automation",
  defaultDescription:
    "AETHER-TRADE provides document intelligence and workflow automation for freight forwarders and trade operations teams, with human review for consequential decisions.",
  defaultOgImage: "",
  googleVerification: "",
  bingVerification: "",
  organizationName: "AETHER-TRADE",
  organizationUrl: "https://aethertrade.cloud",
  organizationDescription:
    "AETHER-TRADE helps freight forwarders and trade operations teams organize shipment documents, identify possible discrepancies and coordinate repeatable workflows with human oversight.",
  organizationLogo: "",
  sameAs: [],
};
