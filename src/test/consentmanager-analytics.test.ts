import { afterEach, describe, expect, it, vi } from "vitest";
import {
  hasAnalyticsConsent,
  openCookieSettings,
  type KlaroConsentManager,
} from "@/lib/consentmanager-analytics";

afterEach(() => {
  delete window.klaro;
});

function createManager(consent = false) {
  return {
    getConsent: vi.fn((name: string) => name === "analytics" && consent),
    watch: vi.fn(),
    unwatch: vi.fn(),
  } satisfies KlaroConsentManager;
}

describe("hasAnalyticsConsent", () => {
  it("fails closed when Klaro is unavailable", () => {
    expect(hasAnalyticsConsent()).toBe(false);
  });

  it("allows analytics only after an explicit Klaro opt-in", () => {
    const manager = createManager(true);
    window.klaro = { getManager: () => manager, show: vi.fn() };

    expect(hasAnalyticsConsent()).toBe(true);
    expect(manager.getConsent).toHaveBeenCalledWith("analytics");
  });

  it("fails closed when analytics consent is denied", () => {
    const manager = createManager(false);
    window.klaro = { getManager: () => manager, show: vi.fn() };

    expect(hasAnalyticsConsent()).toBe(false);
  });

  it("fails closed when Klaro has no manager", () => {
    window.klaro = {
      getManager: () => {
        throw new Error("Klaro unavailable");
      },
      show: vi.fn(),
    };

    expect(hasAnalyticsConsent()).toBe(false);
  });

  it("reopens the preference dialog so consent can be changed", () => {
    const show = vi.fn();
    window.klaro = { getManager: () => createManager(), show };

    openCookieSettings();

    expect(show).toHaveBeenCalledWith(undefined, true);
  });

  it("does not throw when the preference dialog is unavailable", () => {
    window.klaro = {
      getManager: () => createManager(),
      show: () => {
        throw new Error("Klaro unavailable");
      },
    };

    expect(() => openCookieSettings()).not.toThrow();
  });
});
