// SERVER-ONLY. Fixed-window submission quota, enforced atomically by the
// public.consume_submission_quota() database function (docs/database/004). Fails closed.
export type QuotaOutcome = "allowed" | "limited" | "unavailable";

export interface QuotaSettings {
  supabaseUrl: string;
  serviceRoleKey: string;
  limit: number;
  windowSeconds: number;
}

const TIMEOUT_MS = 5_000;

export async function consumeSubmissionQuota(
  settings: QuotaSettings,
  quotaKey: string,
  fetchImpl: typeof fetch = fetch,
): Promise<QuotaOutcome> {
  let response: Response;
  try {
    response = await fetchImpl(`${settings.supabaseUrl}/rest/v1/rpc/consume_submission_quota`, {
      method: "POST",
      headers: {
        apikey: settings.serviceRoleKey,
        Authorization: `Bearer ${settings.serviceRoleKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        p_key: quotaKey,
        p_limit: settings.limit,
        p_window_seconds: settings.windowSeconds,
      }),
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
  } catch {
    console.error("submission-quota: request failed");
    return "unavailable";
  }
  if (!response.ok) {
    console.error("submission-quota: service returned an error", { status: response.status });
    return "unavailable";
  }
  const value: unknown = await response.json().catch(() => undefined);
  if (value === true) return "allowed";
  if (value === false) return "limited";
  return "unavailable";
}
