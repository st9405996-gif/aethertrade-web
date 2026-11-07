import { describe, expect, it } from "vitest";
import {
  getConnectionReadiness,
  getInquiryDeliveryReadiness,
  getWorkspaceSessionReadiness,
} from "@/lib/connection-readiness";

describe("admin connection readiness claims", () => {
  it("shows loading and unverified states instead of a false connected claim", () => {
    expect(getWorkspaceSessionReadiness(false, false)).toEqual({
      label: "Checking",
      description: "Verifying the administrator session and loading workspace data.",
    });
    expect(getWorkspaceSessionReadiness(true, false)).toEqual({
      label: "Not verified",
      description: "No verified administrator session is available.",
    });
  });

  it("describes a loaded session without claiming continuous health", () => {
    expect(getWorkspaceSessionReadiness(true, true)).toEqual({
      label: "Session loaded",
      description:
        "Workspace data was loaded for this authenticated session. This is not a continuous health check.",
    });
  });

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
