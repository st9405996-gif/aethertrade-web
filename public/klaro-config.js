/* AETHER-TRADE cookie consent configuration.
 * Klaro! is self-hosted from the public/ assets in this repository.
 */
var klaroConfig = {
  version: 1,
  elementID: "klaro",
  storageMethod: "cookie",
  storageName: "aethertrade-consent",
  cookieExpiresAfterDays: 180,
  translations: {
    en: {
      privacyPolicyUrl: "/privacy-policy",
      consentModal: {
        title: "Privacy preferences",
        description: "Choose whether AETHER-TRADE may use optional analytics to understand and improve the website. You can change your choice at any time.",
      },
      consentNotice: {
        description: "We use optional analytics to understand how visitors use AETHER-TRADE. You can accept or reject analytics, or customize your choice.",
        learnMore: "Customize",
      },
      ok: "Accept all",
      decline: "Reject all",
      acceptSelected: "Save preferences",
      purposes: {
        analytics: {
          title: "Analytics",
        },
      },
    },
  },
  default: false,
  mustConsent: false,
  acceptAll: true,
  hideDeclineAll: false,
  hideLearnMore: false,
  services: [
    {
      name: "analytics",
      title: "Website analytics",
      purposes: ["analytics"],
      required: false,
      default: false,
      cookies: [/^_ga/, /^_gid$/, /^_gat/, /^CLID$/, /^_clck$/, /^_clsk$/],
      callback: function (consent) {
        if (typeof window.gtag === "function") {
          window.gtag("consent", "update", {
            analytics_storage: consent ? "granted" : "denied",
          });
        }
      },
    },
  ],
};
