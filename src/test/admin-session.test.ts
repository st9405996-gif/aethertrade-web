import { describe, expect, it, vi } from "vitest";
import {
  createAdminSession,
  logoutAdminSession,
  needsAdminSessionRefresh,
  parseStoredAdminSession,
  recoveryAccessToken,
  refreshAdminSession,
  type AdminSession,
} from "@/lib/admin-session";

const userId = "9b2e0c3a-4d5f-4a6b-8c7d-1e2f3a4b5c6d";
const authResponse = {
  access_token: "access-token",
  refresh_token: "refresh-token",
  expires_in: 3600,
  user: { id: userId, email: "private@example.com", user_metadata: { display_name: "Private" } },
};
const storedSession: AdminSession = {
  access_token: "access-token",
  refresh_token: "refresh-token",
  expires_at: 4_600,
  user: { id: userId },
};

describe("administrator session validation", () => {
  it("normalizes auth responses and stores only the user ID", () => {
    expect(createAdminSession(authResponse, 1_000_000)).toEqual({
      access_token: "access-token",
      refresh_token: "refresh-token",
      expires_at: 4_600,
      user: { id: userId },
    });
  });

  it("rejects malformed or incomplete auth responses", () => {
    expect(() => createAdminSession({ ...authResponse, refresh_token: "" })).toThrow(
      "Authentication response did not contain a valid administrator session.",
    );
    expect(() => createAdminSession({ ...authResponse, expires_in: 0 })).toThrow();
    expect(() => createAdminSession({ ...authResponse, user: { id: "not-a-uuid" } })).toThrow();
  });

  it("validates stored sessions and removes unneeded user metadata", () => {
    expect(
      parseStoredAdminSession(
        JSON.stringify({ ...storedSession, user: { id: userId, email: "private@example.com" } }),
      ),
    ).toEqual(storedSession);
    expect(() => parseStoredAdminSession("{")).toThrow(
      "The administrator session is invalid. Sign in again.",
    );
    expect(() =>
      parseStoredAdminSession(JSON.stringify({ ...storedSession, refresh_token: "" })),
    ).toThrow("The administrator session is invalid. Sign in again.");
  });

  it("refreshes sessions before expiry with a one-minute safety margin", () => {
    expect(needsAdminSessionRefresh({ ...storedSession, expires_at: 1_059 }, 1_000)).toBe(true);
    expect(needsAdminSessionRefresh({ ...storedSession, expires_at: 1_060 }, 1_000)).toBe(false);
  });

  it("accepts only bounded recovery or invite tokens from the URL fragment", () => {
    expect(recoveryAccessToken("#access_token=recovery-token&type=recovery")).toBe(
      "recovery-token",
    );
    expect(recoveryAccessToken("access_token=invite-token&type=invite")).toBe("invite-token");
    expect(recoveryAccessToken("#access_token=token&type=access_token")).toBeNull();
    expect(recoveryAccessToken("#type=recovery")).toBeNull();
    expect(recoveryAccessToken(`#access_token=${"x".repeat(16_385)}&type=recovery`)).toBeNull();
  });

  it("clears local auth state even when remote revocation fails and reports that result", async () => {
    const clearLocal = vi.fn();
    const result = await logoutAdminSession(async () => {
      throw new Error("remote logout unavailable");
    }, clearLocal);

    expect(result).toEqual({ revoked: false });
    expect(clearLocal).toHaveBeenCalledOnce();
  });

  it("shares concurrent refreshes and validates the rotated token response", async () => {
    let resolveResponse!: (response: Response) => void;
    const fetchImpl = vi.fn<typeof fetch>(
      () =>
        new Promise((resolve) => {
          resolveResponse = resolve;
        }),
    );
    const first = refreshAdminSession(storedSession, fetchImpl, 1_000_000);
    const second = refreshAdminSession(storedSession, fetchImpl, 1_000_000);

    expect(fetchImpl).toHaveBeenCalledTimes(1);
    expect(fetchImpl).toHaveBeenCalledWith(
      "/api/admin-supabase/auth/v1/token?grant_type=refresh_token",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ refresh_token: "refresh-token" }),
      }),
    );
    resolveResponse(
      new Response(
        JSON.stringify({
          ...authResponse,
          access_token: "rotated-access",
          refresh_token: "rotated-refresh",
        }),
        { status: 200 },
      ),
    );
    const [firstResult, secondResult] = await Promise.all([first, second]);
    expect(firstResult).toEqual(secondResult);
    expect(firstResult.access_token).toBe("rotated-access");
    expect(firstResult.refresh_token).toBe("rotated-refresh");
  });

  it("rejects successful refresh responses that omit session tokens", async () => {
    const fetchImpl = vi
      .fn<typeof fetch>()
      .mockResolvedValue(new Response(JSON.stringify({ expires_in: 3600 }), { status: 200 }));
    await expect(refreshAdminSession(storedSession, fetchImpl)).rejects.toThrow(
      "Authentication response did not contain a valid administrator session.",
    );
  });
});
