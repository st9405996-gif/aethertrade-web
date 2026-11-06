import { describe, expect, it, vi } from "vitest";
import { executeAdminMutation } from "@/lib/admin-mutation-result";

describe("executeAdminMutation", () => {
  it("reports a completed mutation", async () => {
    const operation = vi.fn();

    await expect(executeAdminMutation(operation)).resolves.toEqual({ status: "success" });
    expect(operation).toHaveBeenCalledOnce();
  });

  it("returns the failure so callers can preserve the edit state", async () => {
    const error = new Error("The database rejected the update.");
    const operation = vi.fn().mockRejectedValue(error);

    await expect(executeAdminMutation(operation)).resolves.toEqual({ status: "failure", error });
    expect(operation).toHaveBeenCalledOnce();
  });
});
