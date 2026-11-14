export type KlaroConsentWatcher = {
  update: (manager: unknown, name: string, data: unknown) => void;
};

export type KlaroConsentManager = {
  getConsent: (name: string) => boolean;
  watch: (watcher: KlaroConsentWatcher) => void;
  unwatch: (watcher: KlaroConsentWatcher) => void;
};

type KlaroApi = {
  getManager: () => KlaroConsentManager;
  show: (config?: unknown, modal?: boolean) => unknown;
};

declare global {
  interface Window {
    klaro?: KlaroApi;
  }
}

/** Fail closed: analytics is enabled only after an explicit Klaro opt-in. */
export function getKlaroManager(): KlaroConsentManager | null {
  try {
    return window.klaro?.getManager() ?? null;
  } catch {
    return null;
  }
}

export function hasAnalyticsConsent(): boolean {
  return getKlaroManager()?.getConsent("analytics") === true;
}

/** Reopen the preference dialog so visitors can change or withdraw consent. */
export function openCookieSettings(): void {
  try {
    window.klaro?.show(undefined, true);
  } catch {
    // Consent settings must never interrupt normal site navigation.
  }
}
