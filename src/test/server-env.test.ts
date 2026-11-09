import { afterEach, describe, expect, it } from "vitest";
import { readServerEnv } from "@/lib/server-env.server";

const original = {
  url: process.env.VITE_SUPABASE_URL,
  key: process.env.VITE_SUPABASE_PUBLISHABLE_KEY,
  legacyUrl: process.env.SUPABASE_URL,
  legacyKey: process.env.SUPABASE_PUBLISHABLE_KEY,
};

afterEach(() => {
  for (const [name, value] of [
    ["VITE_SUPABASE_URL", original.url],
    ["VITE_SUPABASE_PUBLISHABLE_KEY", original.key],
    ["SUPABASE_URL", original.legacyUrl],
    ["SUPABASE_PUBLISHABLE_KEY", original.legacyKey],
  ] as const) {
    if (value === undefined) delete process.env[name];
    else process.env[name] = value;
  }
});

describe("server Supabase environment aliases", () => {
  it("uses the VITE-prefixed Cloudflare bindings across server consumers", () => {
    process.env.VITE_SUPABASE_URL = "https://vite-project.supabase.co";
    process.env.VITE_SUPABASE_PUBLISHABLE_KEY = "vite-publishable-key";
    delete process.env.SUPABASE_URL;
    delete process.env.SUPABASE_PUBLISHABLE_KEY;

    expect(readServerEnv()).toMatchObject({
      SUPABASE_URL: "https://vite-project.supabase.co",
      SUPABASE_PUBLISHABLE_KEY: "vite-publishable-key",
    });
  });

  it("prefers VITE-prefixed values when both naming forms exist", () => {
    process.env.VITE_SUPABASE_URL = "https://vite-project.supabase.co";
    process.env.VITE_SUPABASE_PUBLISHABLE_KEY = "vite-publishable-key";
    process.env.SUPABASE_URL = "https://legacy-project.supabase.co";
    process.env.SUPABASE_PUBLISHABLE_KEY = "legacy-publishable-key";

    expect(readServerEnv()).toMatchObject({
      SUPABASE_URL: "https://vite-project.supabase.co",
      SUPABASE_PUBLISHABLE_KEY: "vite-publishable-key",
    });
  });

  it("retains legacy binding compatibility without changing service-role handling", () => {
    delete process.env.VITE_SUPABASE_URL;
    delete process.env.VITE_SUPABASE_PUBLISHABLE_KEY;
    process.env.SUPABASE_URL = "https://legacy-project.supabase.co";
    process.env.SUPABASE_PUBLISHABLE_KEY = "legacy-publishable-key";
    process.env.SUPABASE_SERVICE_ROLE_KEY = "server-only-service-role-key";

    expect(readServerEnv()).toMatchObject({
      SUPABASE_URL: "https://legacy-project.supabase.co",
      SUPABASE_PUBLISHABLE_KEY: "legacy-publishable-key",
      SUPABASE_SERVICE_ROLE_KEY: "server-only-service-role-key",
    });
  });
});
