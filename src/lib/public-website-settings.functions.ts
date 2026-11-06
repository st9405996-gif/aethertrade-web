import { createServerFn } from "@tanstack/react-start";
import { readServerEnv } from "@/lib/server-env.server";

export type PublicWebsiteSettings =
  | { status: "available"; careersEnabled: boolean }
  | { status: "missing"; careersEnabled: false }
  | { status: "unavailable"; careersEnabled: false };

const missingSettings: PublicWebsiteSettings = { status: "missing", careersEnabled: false };
const unavailableSettings: PublicWebsiteSettings = { status: "unavailable", careersEnabled: false };

function asRecord(value: unknown): Record<string, unknown> | null {
  return value !== null && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

export async function readPublicWebsiteSettings(
  baseUrl: string | undefined,
  key: string | undefined,
  fetchImpl: typeof fetch = fetch,
): Promise<PublicWebsiteSettings> {
  const normalizedBaseUrl = baseUrl?.replace(/\/+$/, "");
  if (!normalizedBaseUrl || !key) return unavailableSettings;

  let url: URL;
  try {
    url = new URL(normalizedBaseUrl + "/rest/v1/public_website_settings");
  } catch {
    return unavailableSettings;
  }

  url.searchParams.set("select", "careers_enabled");
  url.searchParams.set("limit", "1");

  let response: Response;
  try {
    response = await fetchImpl(url, {
      headers: { apikey: key, Authorization: "Bearer " + key, Accept: "application/json" },
    });
  } catch {
    return unavailableSettings;
  }
  if (!response.ok) return unavailableSettings;

  let rows: unknown;
  try {
    rows = await response.json();
  } catch {
    return unavailableSettings;
  }
  if (!Array.isArray(rows)) return unavailableSettings;
  if (rows.length === 0) return missingSettings;

  const first = asRecord(rows[0]);
  const careersEnabled = first?.["careers_enabled"];
  if (typeof careersEnabled !== "boolean") return unavailableSettings;
  return {
    status: "available",
    careersEnabled,
  };
}

export const getPublicWebsiteSettings = createServerFn({ method: "GET" }).handler(async () => {
  const env = readServerEnv();
  return readPublicWebsiteSettings(env["SUPABASE_URL"], env["SUPABASE_PUBLISHABLE_KEY"]);
});
