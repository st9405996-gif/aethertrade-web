export interface AdminSession {
  access_token: string;
  refresh_token: string;
  expires_at: number;
  user: { id: string };
}

export interface AdminLogoutResult {
  revoked: boolean;
}

const invalidSessionMessage = "The administrator session is invalid. Sign in again.";
const refreshes = new Map<string, Promise<AdminSession>>();

function object(value: unknown): Record<string, unknown> | null {
  return value !== null && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

function isUuid(value: unknown): value is string {
  return (
    typeof value === "string" &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)
  );
}

function validSession(value: unknown): AdminSession | null {
  const session = object(value);
  const user = object(session?.["user"]);
  if (
    typeof session?.["access_token"] !== "string" ||
    !session["access_token"] ||
    session["access_token"].length > 16_384 ||
    typeof session["refresh_token"] !== "string" ||
    !session["refresh_token"] ||
    session["refresh_token"].length > 16_384 ||
    typeof session["expires_at"] !== "number" ||
    !Number.isSafeInteger(session["expires_at"]) ||
    session["expires_at"] <= 0 ||
    !isUuid(user?.["id"])
  ) {
    return null;
  }
  return {
    access_token: session["access_token"],
    refresh_token: session["refresh_token"],
    expires_at: session["expires_at"],
    user: { id: user["id"] },
  };
}

export function parseStoredAdminSession(raw: string): AdminSession {
  let value: unknown;
  try {
    value = JSON.parse(raw);
  } catch {
    throw new Error(invalidSessionMessage);
  }
  const session = validSession(value);
  if (!session) throw new Error(invalidSessionMessage);
  return session;
}

export function createAdminSession(value: unknown, nowMs = Date.now()): AdminSession {
  const response = object(value);
  const expiresIn = response?.["expires_in"];
  const user = object(response?.["user"]);
  if (
    typeof response?.["access_token"] !== "string" ||
    !response["access_token"] ||
    response["access_token"].length > 16_384 ||
    typeof response["refresh_token"] !== "string" ||
    !response["refresh_token"] ||
    response["refresh_token"].length > 16_384 ||
    typeof expiresIn !== "number" ||
    !Number.isFinite(expiresIn) ||
    expiresIn <= 0 ||
    !isUuid(user?.["id"])
  ) {
    throw new Error("Authentication response did not contain a valid administrator session.");
  }
  const session = validSession({
    access_token: response["access_token"],
    refresh_token: response["refresh_token"],
    expires_at: Math.floor(nowMs / 1000) + expiresIn,
    user: { id: user["id"] },
  });
  if (!session) {
    throw new Error("Authentication response did not contain a valid administrator session.");
  }
  return session;
}

export function needsAdminSessionRefresh(
  session: AdminSession,
  nowSeconds = Math.floor(Date.now() / 1000),
) {
  return session.expires_at < nowSeconds + 60;
}

export function recoveryAccessToken(hash: string): string | null {
  if (hash.length > 20_000) return null;
  const parameters = new URLSearchParams(hash.startsWith("#") ? hash.slice(1) : hash);
  const token = parameters.get("access_token");
  if (
    !token ||
    token.length > 16_384 ||
    !["recovery", "invite"].includes(parameters.get("type") ?? "")
  ) {
    return null;
  }
  return token;
}

export async function logoutAdminSession(
  revokeRemote: () => Promise<unknown>,
  clearLocal: () => void,
): Promise<AdminLogoutResult> {
  let revoked = true;
  try {
    await revokeRemote();
  } catch {
    revoked = false;
  }
  clearLocal();
  return { revoked };
}

function responseMessage(value: unknown): string {
  const response = object(value);
  const message =
    response?.["message"] ??
    response?.["msg"] ??
    response?.["error_description"] ??
    response?.["error"];
  return typeof message === "string" ? message : "Supabase request failed";
}

export function refreshAdminSession(
  session: AdminSession,
  fetchImpl: typeof fetch = fetch,
  nowMs = Date.now(),
): Promise<AdminSession> {
  const pending = refreshes.get(session.refresh_token);
  if (pending) return pending;

  const refresh = (async () => {
    const response = await fetchImpl("/api/admin-supabase/auth/v1/token?grant_type=refresh_token", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refresh_token: session.refresh_token }),
    });
    const payload: unknown = await response.json().catch(() => null);
    if (!response.ok) throw new Error(responseMessage(payload));
    return createAdminSession(payload, nowMs);
  })();
  const tracked = refresh.finally(() => {
    if (refreshes.get(session.refresh_token) === tracked) refreshes.delete(session.refresh_token);
  });
  refreshes.set(session.refresh_token, tracked);
  return tracked;
}
