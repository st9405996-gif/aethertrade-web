export type ConsentManagerData = {
  purposeConsents?: Record<string, boolean>;
};
export type ConsentManagerApi = (command: string, parameter?: unknown, callback?: unknown, async?: boolean) => unknown;

declare global {
  interface Window {
    __cmp?: ConsentManagerApi;
  }
}

/** Require an explicit ConsentManager audience-statistics purpose choice; fail closed otherwise. */
export function hasAnalyticsConsent(): boolean {
  const cmp = window.__cmp;
  if (!cmp) return false;
  try {
    const result = cmp("getCMPData", null, null, false) as ConsentManagerData | null;
    return result?.purposeConsents?.["8"] === true;
  } catch {
    return false;
  }
}
