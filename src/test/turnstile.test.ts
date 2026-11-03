/**
 * @vitest-environment node
 */
import { describe, expect, it, vi } from "vitest";
import { TURNSTILE_ACTION, probeTurnstileSecret, verifyTurnstile } from "@/lib/turnstile.server";

const base = {
  secret: "turnstile_secret_test_value_123",
  expectedHostname: "aethertrade.cloud",
  remoteIp: "203.0.113.7",
};
const reply = (body: unknown, status = 200) =>
  vi.fn(
    async () =>
      new Response(JSON.stringify(body), {
        status,
        headers: { "content-type": "application/json" },
      }),
  );

describe("verifyTurnstile (server-side challenge verification)", () => {
  it("passes a valid token with matching action and hostname", async () => {
    const fetchMock = reply({
      success: true,
      action: TURNSTILE_ACTION,
      hostname: "aethertrade.cloud",
    });
    expect(
      await verifyTurnstile({ ...base, token: "tok" }, fetchMock as unknown as typeof fetch),
    ).toBe("passed");
    const body = (fetchMock.mock.calls[0] as unknown as [string, RequestInit])[1]
      .body as URLSearchParams;
    expect(body.get("secret")).toBe(base.secret);
    expect(body.get("response")).toBe("tok");
    expect(body.get("remoteip")).toBe("203.0.113.7");
  });

  it("does not call Cloudflare when no token was supplied", async () => {
    const fetchMock = reply({ success: true });
    expect(
      await verifyTurnstile({ ...base, token: undefined }, fetchMock as unknown as typeof fetch),
    ).toBe("rejected");
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("rejects a failed challenge", async () => {
    const fetchMock = reply({ success: false, "error-codes": ["invalid-input-response"] });
    expect(
      await verifyTurnstile({ ...base, token: "bad" }, fetchMock as unknown as typeof fetch),
    ).toBe("rejected");
  });

  it("rejects a token issued for a different action", async () => {
    const fetchMock = reply({ success: true, action: "login", hostname: "aethertrade.cloud" });
    expect(
      await verifyTurnstile({ ...base, token: "tok" }, fetchMock as unknown as typeof fetch),
    ).toBe("rejected");
  });

  it("rejects a token issued for a different hostname", async () => {
    const fetchMock = reply({ success: true, action: TURNSTILE_ACTION, hostname: "evil.example" });
    expect(
      await verifyTurnstile({ ...base, token: "tok" }, fetchMock as unknown as typeof fetch),
    ).toBe("rejected");
  });

  it("is unavailable (fail closed) when the network request fails", async () => {
    const fetchMock = vi.fn(async () => {
      throw new Error("network down");
    });
    expect(
      await verifyTurnstile({ ...base, token: "tok" }, fetchMock as unknown as typeof fetch),
    ).toBe("unavailable");
  });

  it("is unavailable when the service returns an error status", async () => {
    const fetchMock = reply(
      { success: true, action: TURNSTILE_ACTION, hostname: "aethertrade.cloud" },
      503,
    );
    expect(
      await verifyTurnstile({ ...base, token: "tok" }, fetchMock as unknown as typeof fetch),
    ).toBe("unavailable");
  });

  it("is unavailable when the response is not JSON", async () => {
    const fetchMock = vi.fn(async () => new Response("<html>", { status: 200 }));
    expect(
      await verifyTurnstile({ ...base, token: "tok" }, fetchMock as unknown as typeof fetch),
    ).toBe("unavailable");
  });

  it("sets a request timeout signal", async () => {
    const fetchMock = reply({
      success: true,
      action: TURNSTILE_ACTION,
      hostname: "aethertrade.cloud",
    });
    await verifyTurnstile({ ...base, token: "tok" }, fetchMock as unknown as typeof fetch);
    expect((fetchMock.mock.calls[0] as unknown as [string, RequestInit])[1].signal).toBeInstanceOf(
      AbortSignal,
    );
  });
});

describe("probeTurnstileSecret (health probe)", () => {
  it("reports a valid secret when Cloudflare rejects only the probe token", async () => {
    expect(
      await probeTurnstileSecret(
        base.secret,
        reply({
          success: false,
          "error-codes": ["invalid-input-response"],
        }) as unknown as typeof fetch,
      ),
    ).toBe("valid");
  });

  it("reports an invalid secret", async () => {
    expect(
      await probeTurnstileSecret(
        base.secret,
        reply({
          success: false,
          "error-codes": ["invalid-input-secret"],
        }) as unknown as typeof fetch,
      ),
    ).toBe("invalid");
  });

  it("reports unreachable on network failure", async () => {
    const fetchMock = vi.fn(async () => {
      throw new Error("offline");
    });
    expect(await probeTurnstileSecret(base.secret, fetchMock as unknown as typeof fetch)).toBe(
      "unreachable",
    );
  });
});
