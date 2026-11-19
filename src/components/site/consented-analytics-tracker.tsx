import { useEffect, useRef } from "react";
import { getKlaroManager, hasAnalyticsConsent } from "@/lib/consentmanager-analytics";

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
  }
}

export function ConsentedAnalyticsTracker({ pathname }: { pathname: string }) {
  const lastTrackedPath = useRef<string | null>(null);

  useEffect(() => {
    const manager = getKlaroManager();
    if (!manager) return;

    const track = (eventName: string, parameters: Record<string, string>) => {
      if (!hasAnalyticsConsent() || typeof window.gtag !== "function") return;
      window.gtag("event", eventName, parameters);
    };

    const checkConsentAndTrack = () => {
      if (!hasAnalyticsConsent()) {
        lastTrackedPath.current = null;
        return;
      }
      if (lastTrackedPath.current === pathname) return;
      lastTrackedPath.current = pathname;
      track("page_view", {
        page_path: pathname,
        page_location: window.location.href,
        page_title: document.title,
      });
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
      ) return;
      track("cta_click", {
        page_path: pathname,
        link_url: destination.pathname,
      });
    };

    const watcher = { update: () => checkConsentAndTrack() };
    manager.watch(watcher);
    document.addEventListener("click", trackCtaClick, true);
    checkConsentAndTrack();
    return () => {
      manager.unwatch(watcher);
      document.removeEventListener("click", trackCtaClick, true);
    };
  }, [pathname]);

  return null;
}
