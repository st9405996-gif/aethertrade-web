import { describe, expect, it, vi } from "vitest";
import { attemptInvitedUserRevocation } from "@/lib/admin-user-compensation";

describe("administrator invite compensation", () => {
  it("confirms successful revocation", async () => {
    const fetchImpl = vi.fn<typeof fetch>().mockResolvedValue(new Response(null, { status: 204 }));

    await expect(
      attemptInvitedUserRevocation("/auth/v1/admin/users/user-id", {}, fetchImpl),
    ).resolves.toBe(true);
    expect(fetchImpl).toHaveBeenCalledWith("/auth/v1/admin/users/user-id", {
      method: "DELETE",
      headers: {},
    });
  });

  it("does not claim revocation when the server rejects cleanup", async () => {
    const fetchImpl = vi.fn<typeof fetch>().mockResolvedValue(new Response(null, { status: 500 }));

    await expect(
      attemptInvitedUserRevocation("/auth/v1/admin/users/user-id", {}, fetchImpl),
    ).resolves.toBe(false);
  });

  it("does not claim revocation when cleanup fails over the network", async () => {
    const fetchImpl = vi.fn<typeof fetch>().mockRejectedValue(new TypeError("fetch failed"));

    await expect(
      attemptInvitedUserRevocation("/auth/v1/admin/users/user-id", {}, fetchImpl),
    ).resolves.toBe(false);
  });
});
