import { useEffect, useRef } from "react";
import { useServerFn } from "@tanstack/react-start";
import { trackAnalyticsEvent } from "@/lib/analytics.functions";

type ConsentManagerData = {
  purposeConsents?: Record<string, boolean>;
};
type ConsentManagerApi = (command: string, parameter?: unknown, callback?: unknown, async?: boolean) => unknown;

declare global {
  interface Window {
    __cmp?: ConsentManagerApi;
  }
}

function hasAnalyticsConsent(): boolean {
  const cmp = window.__cmp;
  if (!cmp) return false;
  try {
    const result = cmp("getCMPData", null, null, false) as ConsentManagerData | null;
    // Purpose 8 is the TCF audience-statistics purpose. Fail closed if the CMP has a different setup.
    return result?.purposeConsents?.["8"] === true;
  } catch {
    return false;
  }
}

export function ConsentedAnalyticsTracker({ pathname }: { pathname: string }) {
  const sendEvent = useServerFn(trackAnalyticsEvent);
  const lastTrackedPath = useRef<string | null>(null);

  useEffect(() => {
    const cmp = window.__cmp;
    if (!cmp) return;

    const checkConsentAndTrack = () => {
      if (!hasAnalyticsConsent()) {
        lastTrackedPath.current = null;
        return;
      }
      if (lastTrackedPath.current === pathname) return;
      lastTrackedPath.current = pathname;
      void sendEvent({ data: { eventType: "page_view", pagePath: pathname, consent: true } }).catch(() => {
        // Analytics must never interrupt navigation or surface an error to visitors.
      });
    };

    cmp("addEventListener", ["settings", checkConsentAndTrack, true], null);
    cmp("addEventListener", ["consent", checkConsentAndTrack, true], null);
    checkConsentAndTrack();
    return () => {
      cmp("removeEventListener", ["settings", checkConsentAndTrack, true], null);
      cmp("removeEventListener", ["consent", checkConsentAndTrack, true], null);
    };
  }, [pathname, sendEvent]);

  return null;
}
