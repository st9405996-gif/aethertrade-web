import { useEffect, useRef } from "react";
import { useServerFn } from "@tanstack/react-start";
import { trackAnalyticsEvent } from "@/lib/analytics.functions";

import { getKlaroManager, hasAnalyticsConsent } from "@/lib/consentmanager-analytics";

export function ConsentedAnalyticsTracker({ pathname }: { pathname: string }) {
  const sendEvent = useServerFn(trackAnalyticsEvent);
  const lastTrackedPath = useRef<string | null>(null);

  useEffect(() => {
    const manager = getKlaroManager();
    if (!manager) return;

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

    const watcher = { update: () => checkConsentAndTrack() };
    manager.watch(watcher);
    document.addEventListener("click", trackCtaClick, true);
    checkConsentAndTrack();
    return () => {
      manager.unwatch(watcher);
      document.removeEventListener("click", trackCtaClick, true);
    };
  }, [pathname, sendEvent]);

  return null;
}
