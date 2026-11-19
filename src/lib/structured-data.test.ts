import { describe, expect, it } from "vitest";
import { buildPageStructuredData, serializePageStructuredData } from "./structured-data";

describe("page structured data", () => {
  it("provides valid WebPage and breadcrumb graph data for every configured public route", () => {
    const routes = [
      "/", "/about", "/platform", "/how-it-works", "/solutions", "/industries",
      "/services", "/automations", "/custom-solutions", "/document-intake",
      "/shipment-follow-up", "/insights", "/partnerships", "/faqs", "/contact",
      "/request-demo", "/privacy-policy", "/terms", "/cookie-policy",
      "/uae-logistics-automation", "/china-trade-automation",
      "/usa-freight-forwarding-automation",
    ];

    for (const route of routes) {
      const result = buildPageStructuredData(route);
      expect(result, route).not.toBeNull();
      expect(result?.["@context"], route).toBe("https://schema.org");
      expect(result?.["@graph"].some((item) => ["WebPage", "ContactPage", "CollectionPage", "AboutPage"].includes(String(item["@type"]))), route).toBe(true);
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

  it("does not emit structured data for unknown or private routes", () => {
    expect(buildPageStructuredData("/admin")).toBeNull();
    expect(buildPageStructuredData("/auth")).toBeNull();
    expect(buildPageStructuredData("/not-a-real-page")).toBeNull();
  });
});
