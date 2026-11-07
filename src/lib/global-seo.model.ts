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
  defaultTitle: "AETHER-TRADE — Trade Automation Engineering",
  defaultDescription:
    "AETHER-TRADE engineers custom document intelligence and end-to-end workflow automation for importers, exporters and logistics enterprises.",
  defaultOgImage: "",
  googleVerification: "",
  bingVerification: "",
  organizationName: "AETHER-TRADE",
  organizationUrl: "https://aethertrade.cloud",
  organizationDescription:
    "AETHER-TRADE helps importers, exporters, freight forwarders and logistics businesses organize trade operations through intelligent software and AI-powered workflows.",
  organizationLogo: "",
  sameAs: [],
};
