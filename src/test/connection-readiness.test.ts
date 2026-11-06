import { describe, expect, it } from "vitest";
import { getConnectionReadiness, getInquiryDeliveryReadiness } from "@/lib/connection-readiness";

describe("admin connection readiness claims", () => {
  it("reports only the database and session checks that were performed", () => {
    expect(getConnectionReadiness(true)).toEqual({
      database: "Loaded this session",
      authentication: "Session verified",
      mediaStorage: "Not probed",
      worker: "Not probed",
    });
  });

  it("does not claim a database connection without a verified admin session", () => {
    expect(getConnectionReadiness(false)).toEqual({
      database: "Not checked",
      authentication: "No verified session",
      mediaStorage: "Not probed",
      worker: "Not probed",
    });
  });

  it("distinguishes configured, pending, disabled, and failed email readiness", () => {
    expect(getInquiryDeliveryReadiness(undefined, false).status).toBe("Checking");
    expect(getInquiryDeliveryReadiness({ mode: "live" }, false).status).toBe(
      "Configured · not tested",
    );
    expect(getInquiryDeliveryReadiness({ mode: "demo" }, false).status).toBe("Unavailable");
    expect(getInquiryDeliveryReadiness(undefined, true)).toEqual({
      status: "Unavailable",
      description: "The server-side inquiry delivery configuration could not be checked.",
    });
  });
});
