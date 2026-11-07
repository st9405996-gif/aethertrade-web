import { useEffect, useRef } from "react";
import { useServerFn } from "@tanstack/react-start";
import { trackAnalyticsEvent } from "@/lib/analytics.functions";

import { hasAnalyticsConsent, type ConsentManagerApi } from "@/lib/consentmanager-analytics";

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
      void sendEvent({ data: { eventType: "page_view", pagePath: pathname, consent: true } }).catch(
        () => {
          // Analytics must never interrupt navigation or surface an error to visitors.
        },
      );
    };

    const trackCtaClick = (event: MouseEvent) => {
      if (!hasAnalyticsConsent()) return;
      const target = event.target;
      if (!(target instanceof Element)) return;
      const anchor = target.closest("a[href]") as HTMLAnchorElement | null;
      if (!anchor) return;
      let destination: URL;
      try {
        destination = new URL(anchor.href, window.location.origin);
      } catch {
        return;
      }
      if (
        destination.origin !== window.location.origin ||
        !["/request-demo", "/contact"].includes(destination.pathname)
      )
        return;
      void sendEvent({ data: { eventType: "cta_click", pagePath: pathname, consent: true } }).catch(
        () => {
          // Analytics must never interrupt navigation or surface an error to visitors.
        },
      );
    };

    cmp("addEventListener", ["settings", checkConsentAndTrack, true], null);
    cmp("addEventListener", ["consent", checkConsentAndTrack, true], null);
    document.addEventListener("click", trackCtaClick, true);
    checkConsentAndTrack();
    return () => {
      cmp("removeEventListener", ["settings", checkConsentAndTrack, true], null);
      cmp("removeEventListener", ["consent", checkConsentAndTrack, true], null);
      document.removeEventListener("click", trackCtaClick, true);
    };
  }, [pathname, sendEvent]);

  return null;
}
