import { createServerFn } from "@tanstack/react-start";
import { readServerEnv } from "@/lib/server-env.server";

export interface PublicWebsiteSettings {
  careersEnabled: boolean;
}
export const getPublicWebsiteSettings = createServerFn({ method: "GET" }).handler(async () => {
  const env = readServerEnv();
  const baseUrl = env["SUPABASE_URL"]?.replace(/\/+$/, "");
  const key = env["SUPABASE_PUBLISHABLE_KEY"];
  if (!baseUrl || !key) return { careersEnabled: false };
  try {
    const url = new URL(baseUrl + "/rest/v1/public_website_settings");
    url.searchParams.set("select", "careers_enabled");
    url.searchParams.set("limit", "1");
    const response = await fetch(url, {
      headers: { apikey: key, Authorization: "Bearer " + key, Accept: "application/json" },
    });
    if (!response.ok) return { careersEnabled: false };
    const rows: unknown = await response.json();
    const first = Array.isArray(rows) ? rows[0] : null;
    return { careersEnabled: Boolean(first && typeof first === "object" && (first as Record<string, unknown>).careers_enabled === true) };
  } catch {
    return { careersEnabled: false };
  }
});
