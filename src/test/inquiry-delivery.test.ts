import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  InquiryDeliveryError,
  deliverInquiry,
  parseDeliveryConfig,
  readDeliveryConfig,
  type DeliveryConfig,
  type DeliveryInput,
} from "@/lib/inquiry-delivery.server";

const SERVICE_KEY = "service_role_test_value_0123456789";
const RESEND_KEY = "re_test_value_0123456789";
const CONFIRMATION_SECRET = "confirmation_test_secret_0123456789abcdef";
const TURNSTILE_SECRET = "turnstile_test_secret_0123456789";
const ABUSE_SECRET = "abuse_hash_test_secret_0123456789abcdef";

const env = {
  INQUIRY_DELIVERY_ENABLED: "true",
  SUPABASE_URL: "https://example-project.supabase.co/",
  SUPABASE_SERVICE_ROLE_KEY: SERVICE_KEY,
  RESEND_API_KEY: RESEND_KEY,
  INQUIRY_NOTIFY_TO: "operations@aethertrade.cloud",
  INQUIRY_SALES_NOTIFY_TO: "sales@aethertrade.cloud",
  INQUIRY_FROM_EMAIL: "AETHER-TRADE <hello@aethertrade.cloud>",
  CONFIRMATION_SECRET: CONFIRMATION_SECRET,
  TURNSTILE_SECRET_KEY: TURNSTILE_SECRET,
  PUBLIC_SITE_HOSTNAME: "aethertrade.cloud",
  ABUSE_HASH_SECRET: ABUSE_SECRET,
};

const config: DeliveryConfig = {
  supabaseUrl: "https://example-project.supabase.co",
  serviceRoleKey: SERVICE_KEY,
  resendApiKey: RESEND_KEY,
  notifyTo: "operations@aethertrade.cloud",
  salesNotifyTo: "sales@aethertrade.cloud",
  fromEmail: "AETHER-TRADE <hello@aethertrade.cloud>",
  confirmationSecret: CONFIRMATION_SECRET,
  turnstileSecret: TURNSTILE_SECRET,
  publicSiteHostname: "aethertrade.cloud",
  abuseHashSecret: ABUSE_SECRET,
  quotaLimit: 5,
  quotaWindowSeconds: 600,
};

const input: DeliveryInput = {
  requestKey: "9b2e0c3a-4d5f-4a6b-8c7d-1e2f3a4b5c6d",
  kind: "contact",
  name: "Test Reviewer",
  email: "reviewer@example.com",
  company: "Illustrative company",
  country: "Pakistan",
  category: "General inquiry",
  automation: "",
  message: "Illustrative operational question",
  requirements: "",
};

const json = (status: number, body: unknown = {}) =>
  new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });

describe("readDeliveryConfig (fail-closed configuration)", () => {
  it("stays disabled without an explicit opt-in, and reports no diagnostics", () => {
    const readout = readDeliveryConfig({ ...env, INQUIRY_DELIVERY_ENABLED: undefined });
    expect(readout).toEqual({ enabled: false, config: null, missing: [] });
  });

  it("stays disabled when required values are absent, naming only the variables", () => {
    const readout = readDeliveryConfig({ ...env, SUPABASE_SERVICE_ROLE_KEY: "" });
    expect(readout.enabled).toBe(false);
    expect(readout.missing).toContain("SUPABASE_SERVICE_ROLE_KEY");
    expect(JSON.stringify(readout)).not.toContain(SERVICE_KEY);
  });

  it("rejects a non-HTTPS Supabase URL that is not local", () => {
    const readout = readDeliveryConfig({ ...env, SUPABASE_URL: "http://example.com" });
    expect(readout.enabled).toBe(false);
    expect(readout.missing).toContain("SUPABASE_URL");
  });

  it("rejects an invalid notification recipient", () => {
    const readout = readDeliveryConfig({ ...env, INQUIRY_NOTIFY_TO: "not-an-email" });
    expect(readout.enabled).toBe(false);
    expect(readout.missing).toContain("INQUIRY_NOTIFY_TO");
  });

  it("accepts a complete configuration and normalises the Supabase URL", () => {
    const readout = readDeliveryConfig(env);
    expect(readout.enabled).toBe(true);
    if (readout.enabled)
      expect(readout.config.supabaseUrl).toBe("https://example-project.supabase.co");
  });
});

describe("deliverInquiry (mocked providers; not verified against real accounts)", () => {
  let fetchMock: ReturnType<typeof vi.fn>;
  let errorSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
  });
  afterEach(() => {
    errorSpy.mockRestore();
  });

  it("persists with the service key, notifies the team and sends a confirmation", async () => {
    fetchMock = vi.fn(async (url: string) => {
      if (url.includes("/rest/v1/inquiries")) return new Response(null, { status: 201 });
      return json(200, { id: "email_1" });
    });

    const result = await deliverInquiry(input, config, fetchMock as unknown as typeof fetch);

    expect(result).toMatchObject({
      persisted: true,
      duplicate: false,
      notified: true,
      confirmationSent: true,
    });
    expect(result.reference).toMatch(/^AT-[0-9A-F]{8}$/);

    const [insertUrl, insertInit] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(insertUrl).toBe("https://example-project.supabase.co/rest/v1/inquiries");
    expect((insertInit.headers as Record<string, string>)["apikey"]).toBe(SERVICE_KEY);
    const row = JSON.parse(insertInit.body as string);
    expect(row).toMatchObject({
      request_key: input.requestKey,
      kind: "contact",
      consent: true,
      reference: result.reference,
    });
    expect(JSON.stringify(row)).not.toContain(SERVICE_KEY);

    const emailCalls = fetchMock.mock.calls.filter(([url]) =>
      String(url).includes("api.resend.com"),
    );
    expect(emailCalls).toHaveLength(2);
    const teamBody = JSON.parse((emailCalls[0]![1] as RequestInit).body as string);
    expect(teamBody.to).toEqual(["operations@aethertrade.cloud"]);
    expect(teamBody.reply_to).toBe("reviewer@example.com");
    const confirmBody = JSON.parse((emailCalls[1]![1] as RequestInit).body as string);
    expect(confirmBody.to).toEqual(["reviewer@example.com"]);
    expect(confirmBody.text).toContain(result.reference);
  });

  it("routes demo and sales inquiries to the sales mailbox", async () => {
    fetchMock = vi.fn(async (url: string) => {
      if (url.includes("/rest/v1/inquiries")) return new Response(null, { status: 201 });
      return json(200, { id: "email_sales" });
    });
    await deliverInquiry({ ...input, kind: "demo" }, config, fetchMock as unknown as typeof fetch);
    const teamCall = fetchMock.mock.calls.filter(([url]) => String(url).includes("api.resend.com"))[0];
    expect(JSON.parse((teamCall![1] as RequestInit).body as string).to).toEqual(["sales@aethertrade.cloud"]);
  });

  it("keeps the stored inquiry when a notification provider fails, and reports it honestly", async () => {
    fetchMock = vi.fn(async (url: string) => {
      if (url.includes("/rest/v1/inquiries")) return new Response(null, { status: 201 });
      return json(422, { message: "domain not verified" });
    });

    const result = await deliverInquiry(input, config, fetchMock as unknown as typeof fetch);

    expect(result).toMatchObject({ persisted: true, notified: false, confirmationSent: false });
    expect(JSON.stringify(errorSpy.mock.calls)).not.toContain(RESEND_KEY);
  });

  it("throws a generic error and sends no email when persistence fails", async () => {
    fetchMock = vi.fn(async () => json(500, { message: `leaked ${SERVICE_KEY}` }));

    const attempt = deliverInquiry(input, config, fetchMock as unknown as typeof fetch);
    await expect(attempt).rejects.toBeInstanceOf(InquiryDeliveryError);
    await expect(attempt).rejects.toThrow("could not be saved");

    const calls = fetchMock.mock.calls.map(([url]) => String(url));
    expect(calls.some((u) => u.includes("api.resend.com"))).toBe(false);
    expect(JSON.stringify(errorSpy.mock.calls)).not.toContain(SERVICE_KEY);
  });

  it("treats a repeated request key as the original submission, without re-notifying", async () => {
    fetchMock = vi.fn(async (url: string) => {
      if (url.includes("request_key=eq.")) return json(200, [{ reference: "AT-ABCDEF12" }]);
      return new Response(null, { status: 409 });
    });

    const result = await deliverInquiry(input, config, fetchMock as unknown as typeof fetch);

    expect(result).toEqual({
      reference: "AT-ABCDEF12",
      persisted: true,
      duplicate: true,
      notified: false,
      confirmationSent: false,
    });
    expect(fetchMock.mock.calls.some(([url]) => String(url).includes("api.resend.com"))).toBe(
      false,
    );
  });

  it("fails clearly when a duplicate cannot be matched to a stored reference", async () => {
    fetchMock = vi.fn(async (url: string) =>
      url.includes("request_key=eq.") ? json(200, []) : new Response(null, { status: 409 }),
    );
    await expect(
      deliverInquiry(input, config, fetchMock as unknown as typeof fetch),
    ).rejects.toThrow("could not be saved");
  });

  it("bounds every provider request with a timeout signal", async () => {
    fetchMock = vi.fn(async (url: string) =>
      url.includes("/rest/v1/inquiries") ? new Response(null, { status: 201 }) : json(200, {}),
    );
    await deliverInquiry(input, config, fetchMock as unknown as typeof fetch);
    for (const [, init] of fetchMock.mock.calls as [string, RequestInit][]) {
      expect(init.signal).toBeInstanceOf(AbortSignal);
    }
  });
});

describe("live-mode configuration requirements (added with abuse protection)", () => {
  it("requires the confirmation, Turnstile, hostname and abuse-hash settings by name", () => {
    const readout = readDeliveryConfig({
      ...env,
      CONFIRMATION_SECRET: undefined,
      TURNSTILE_SECRET_KEY: undefined,
      PUBLIC_SITE_HOSTNAME: undefined,
      ABUSE_HASH_SECRET: "short",
    });
    expect(readout.enabled).toBe(false);
    expect(readout.missing).toEqual(
      expect.arrayContaining([
        "CONFIRMATION_SECRET",
        "TURNSTILE_SECRET_KEY",
        "PUBLIC_SITE_HOSTNAME",
        "ABUSE_HASH_SECRET",
      ]),
    );
    expect(JSON.stringify(readout)).not.toContain("short");
  });

  it("parseDeliveryConfig validates values even while the enable flag is off", () => {
    const parsed = parseDeliveryConfig({ ...env, INQUIRY_DELIVERY_ENABLED: undefined });
    expect(parsed.valid).toBe(true);
    expect(readDeliveryConfig({ ...env, INQUIRY_DELIVERY_ENABLED: undefined }).enabled).toBe(false);
  });

  it("configures a fixed quota of five submissions per ten minutes", () => {
    const readout = readDeliveryConfig(env);
    expect(readout.enabled).toBe(true);
    if (readout.enabled) {
      expect(readout.config.quotaLimit).toBe(5);
      expect(readout.config.quotaWindowSeconds).toBe(600);
    }
  });
});
