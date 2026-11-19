import { describe, expect, it } from "vitest";
import { buildPageStructuredData, serializePageStructuredData } from "./structured-data";

describe("page structured data", () => {
  it("provides serializable WebPage and breadcrumb graph data for indexable routes", () => {
    const routes = [
      "/", "/platform", "/how-it-works", "/solutions", "/industries", "/services",
      "/automations", "/document-intake", "/shipment-follow-up", "/insights",
      "/partnerships", "/faqs", "/contact", "/request-demo", "/privacy-policy",
      "/terms", "/cookie-policy", "/custom-solutions", "/uae-logistics-automation",
      "/china-trade-automation", "/usa-freight-forwarding-automation",
    ];

    for (const route of routes) {
      const result = buildPageStructuredData(route);
      expect(result, route).not.toBeNull();
      expect(result?.["@context"], route).toBe("https://schema.org");
      expect(result?.["@graph"].some((item) =>
        ["WebPage", "ContactPage", "CollectionPage", "AboutPage"].includes(String(item["@type"])),
      ), route).toBe(true);
      if (route !== "/") {
        expect(result?.["@graph"].some((item) => item["@type"] === "BreadcrumbList"), route).toBe(true);
      }
      expect(() => JSON.parse(serializePageStructuredData(route) ?? "")).not.toThrow();
    }
  });

  it("adds Service and SoftwareApplication types only to their relevant pages", () => {
    expect(buildPageStructuredData("/services")?.["@graph"].some((item) => item["@type"] === "Service")).toBe(true);
    expect(buildPageStructuredData("/custom-solutions")?.["@graph"].some((item) => item["@type"] === "Service")).toBe(true);
    expect(buildPageStructuredData("/document-intake")?.["@graph"].some((item) => item["@type"] === "SoftwareApplication")).toBe(true);
    expect(buildPageStructuredData("/shipment-follow-up")?.["@graph"].some((item) => item["@type"] === "SoftwareApplication")).toBe(true);
  });

  it("supports insight article URLs and excludes non-indexable or unknown routes", () => {
    expect(buildPageStructuredData("/insights/freight-forwarding-document-review-workflow")).not.toBeNull();
    expect(buildPageStructuredData("/about")).not.toBeNull();
    expect(buildPageStructuredData("/careers")).toBeNull();
    expect(buildPageStructuredData("/thank-you")).toBeNull();
    expect(buildPageStructuredData("/admin")).toBeNull();
    expect(buildPageStructuredData("/auth")).toBeNull();
    expect(buildPageStructuredData("/reset-password")).toBeNull();
    expect(buildPageStructuredData("/not-a-real-page")).toBeNull();
  });

  it("escapes script-breaking characters before embedding JSON-LD", () => {
    const serialized = serializePageStructuredData("/document-intake");
    expect(serialized).not.toContain("<");
    expect(JSON.parse(serialized ?? "")["@context"]).toBe("https://schema.org");
  });
});
