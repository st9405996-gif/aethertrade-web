import type { AnalyticsEvent } from "@/lib/analytics-event";

export interface AnalyticsDatabaseConfig {
  supabaseUrl: string;
  serviceRoleKey: string;
}

export function requireServerVerifiedAnalyticsConsent(
  consent: boolean | undefined,
): void {
  if (consent !== true) {
    throw new Error(
      "Analytics event was not recorded because server-verifiable consent is unavailable.",
    );
  }
}

export async function writeAnalyticsEvent(
  config: AnalyticsDatabaseConfig,
  event: AnalyticsEvent,
  serverVerifiedConsent: boolean | undefined,
  fetchImpl: typeof fetch = fetch,
): Promise<void> {
  requireServerVerifiedAnalyticsConsent(serverVerifiedConsent);

  if (!config.supabaseUrl || !config.serviceRoleKey) {
    throw new Error("Analytics database connection is not configured.");
  }

  const response = await fetchImpl(
    `${config.supabaseUrl.replace(/\/$/, "")}/rest/v1/analytics_events`,
    {
      method: "POST",
      headers: {
        apikey: config.serviceRoleKey,
        Authorization: `Bearer ${config.serviceRoleKey}`,
        "Content-Type": "application/json",
        Prefer: "return=minimal",
      },
      body: JSON.stringify({
        event_type: event.eventType,
        page_path: event.pagePath,
        automation_slug: event.automationSlug || null,
        consent: true,
      }),
      signal: AbortSignal.timeout(5_000),
    },
  );
  if (!response.ok) throw new Error("Analytics event was not accepted by the database.");
}
