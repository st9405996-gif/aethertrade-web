/* AETHER-TRADE cookie consent configuration.
 * Klaro! is self-hosted from the public/ assets in this repository.
 */
var klaroConfig = {
  version: 1,
  elementID: "klaro",
  storageMethod: "cookie",
  cookieName: "aethertrade-consent",
  cookieExpiresAfterDays: 180,
  privacyPolicy: "/privacy-policy",
  default: false,
  mustConsent: false,
  acceptAll: true,
  hideDeclineAll: false,
  hideLearnMore: false,
  noticeAsModal: false,
  noAutoLoad: false,
  lang: "en",
  disablePoweredBy: false,
  translations: {
    en: {
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
        analytics: "Analytics",
      },
      analytics: {
        title: "Website analytics",
        description: "Google Analytics and Microsoft Clarity help us understand website usage. They remain disabled unless you opt in.",
      },
    },
  },
  services: [
    {
      name: "analytics",
      title: "Website analytics",
      purposes: ["analytics"],
      required: false,
      default: false,
      cookies: [/^_ga/, /^_gid$/, /^_gat/, /^CLID$/, /^_clck$/, /^_clsk$/],
      onAccept: "if (window.gtag) { gtag('consent', 'update', {analytics_storage: 'granted'}); }",
      onDecline: "if (window.gtag) { gtag('consent', 'update', {analytics_storage: 'denied'}); }",
    },
  ],
};
