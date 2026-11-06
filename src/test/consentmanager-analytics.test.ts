import { afterEach, describe, expect, it, vi } from "vitest";
import { hasAnalyticsConsent, type ConsentManagerApi } from "@/lib/consentmanager-analytics";

afterEach(() => {
  delete window.__cmp;
});

describe("hasAnalyticsConsent", () => {
  it("fails closed when ConsentManager is unavailable", () => {
    expect(hasAnalyticsConsent()).toBe(false);
  });

  it("requires an explicit true choice for audience-statistics purpose 8", () => {
    const cmp = vi.fn<ConsentManagerApi>().mockReturnValue({
      purposeConsents: { "8": true },
    });
    window.__cmp = cmp;

    expect(hasAnalyticsConsent()).toBe(true);
    expect(cmp).toHaveBeenCalledWith("getCMPData", null, null, false);
  });

  it.each([
    ["denied", { purposeConsents: { "8": false } }],
    ["missing", { purposeConsents: {} }],
    ["string-valued", { purposeConsents: { "8": "true" } }],
    ["malformed", { purposeConsents: null }],
    ["empty", null],
  ])("fails closed for %s consent data", (_label, data) => {
    window.__cmp = vi.fn<ConsentManagerApi>().mockReturnValue(data);

    expect(hasAnalyticsConsent()).toBe(false);
  });

  it("fails closed when ConsentManager throws", () => {
    window.__cmp = vi.fn<ConsentManagerApi>(() => {
      throw new Error("CMP unavailable");
    });

    expect(hasAnalyticsConsent()).toBe(false);
  });
});
