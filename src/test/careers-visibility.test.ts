import { describe, expect, it } from "vitest";
import { careersRobotsMeta, filterCareersLinks, isCareersEnabled } from "@/lib/careers-visibility";
import type { PublicWebsiteSettings } from "@/lib/public-website-settings.functions";

const enabled: PublicWebsiteSettings = { status: "available", careersEnabled: true };
const disabled: PublicWebsiteSettings = { status: "available", careersEnabled: false };
const missing: PublicWebsiteSettings = { status: "missing", careersEnabled: false };
const unavailable: PublicWebsiteSettings = { status: "unavailable", careersEnabled: false };
const links = [
  { label: "Careers", to: "/careers" },
  { label: "Open roles", to: "/careers/roles" },
  { label: "Contact", to: "/contact" },
];

describe("Careers visibility policy", () => {
  it("allows indexing and the Careers link only when explicitly enabled", () => {
    expect(isCareersEnabled(enabled)).toBe(true);
    expect(careersRobotsMeta(enabled)).toBeNull();
    expect(filterCareersLinks(links, enabled)).toEqual(links);
  });

  it.each([
    ["disabled", disabled],
    ["missing", missing],
    ["unavailable", unavailable],
    ["not loaded", undefined],
  ] as const)("fails closed when settings are %s", (_state, settings) => {
    expect(isCareersEnabled(settings)).toBe(false);
    expect(careersRobotsMeta(settings)).toEqual({
      name: "robots",
      content: "noindex, nofollow",
    });
    expect(filterCareersLinks(links, settings)).toEqual([{ label: "Contact", to: "/contact" }]);
  });

  it("filters Careers links by destination even when their label is customized", () => {
    expect(
      filterCareersLinks(
        [{ label: "Join our team", to: "/careers?department=engineering" }],
        disabled,
      ),
    ).toEqual([]);
  });
});
