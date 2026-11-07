import { useEffect } from "react";
import { hasAnalyticsConsent, type ConsentManagerApi } from "@/lib/consentmanager-analytics";

const CLARITY_PROJECT_ID = "z94mamag59";
type ClarityFunction = ((...args: unknown[]) => void) & { q?: unknown[][] };

declare global {
  interface Window {
    __cmp?: ConsentManagerApi;
    clarity?: ClarityFunction;
  }
}

/**
 * Load Microsoft Clarity only after the visitor grants the site's
 * audience-statistics consent (ConsentManager purpose 8).
 */
export function ConsentedClarityTracker() {
  useEffect(() => {
    const syncClarityConsent = () => {
      const granted = hasAnalyticsConsent();

      if (granted) {
        if (!window.clarity) {
          const clarity: ClarityFunction = (...args) => {
            clarity.q = clarity.q || [];
            clarity.q.push(args);
          };
          window.clarity = clarity;
        }

        // Queue the consent decision before the Clarity tag can execute.
        window.clarity?.("consentv2", {
          ad_Storage: "denied",
          analytics_Storage: "granted",
        });

        const selector = 'script[data-clarity-project="' + CLARITY_PROJECT_ID + '"]';
        if (!document.head.querySelector(selector)) {
          const script = document.createElement("script");
          script.async = true;
          script.src = "https://www.clarity.ms/tag/" + CLARITY_PROJECT_ID + "?ref=bwt";
          script.dataset["clarityProject"] = CLARITY_PROJECT_ID;
          document.head.appendChild(script);
        }
        return;
      }

      // If consent is withdrawn after installation, tell Clarity to stop
      // cookie-based analytics and remain in its denied-consent mode.
      if (window.clarity) {
        window.clarity("consentv2", {
          ad_Storage: "denied",
          analytics_Storage: "denied",
        });
      }
    };

    const cmp = window.__cmp;
    if (!cmp) return;

    cmp("addEventListener", ["settings", syncClarityConsent, true], null);
    cmp("addEventListener", ["consent", syncClarityConsent, true], null);
    syncClarityConsent();

    return () => {
      cmp("removeEventListener", ["settings", syncClarityConsent, true], null);
      cmp("removeEventListener", ["consent", syncClarityConsent, true], null);
    };
  }, []);

  return null;
}
