type MutationMethod = "POST" | "PATCH" | "DELETE";
type JsonRecord = Record<string, unknown>;

interface AdminRecordMutation {
  accessToken: string;
  path: string;
  method: MutationMethod;
  body?: unknown;
  expectedId: string;
  operation: string;
}

function isRecord(value: unknown): value is JsonRecord {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function errorMessage(value: unknown): string | null {
  if (!isRecord(value)) return null;
  for (const key of ["message", "msg", "error_description", "error"]) {
    const message = value[key];
    if (typeof message === "string" && message) return message;
  }
  return null;
}

export async function writeAdminRecord(
  mutation: AdminRecordMutation,
  fetchImpl: typeof fetch = fetch,
): Promise<JsonRecord> {
  const request: RequestInit = {
    method: mutation.method,
    headers: {
      Authorization: "Bearer " + mutation.accessToken,
      "Content-Type": "application/json",
      Prefer: "return=representation",
    },
  };
  if (mutation.body !== undefined) request.body = JSON.stringify(mutation.body);

  const response = await fetchImpl("/api/admin-supabase" + mutation.path, request);

  const raw = await response.text();
  let payload: unknown = null;
  if (raw) {
    try {
      payload = JSON.parse(raw);
    } catch {
      if (response.ok) throw new Error(`${mutation.operation} returned invalid JSON.`);
      payload = { message: raw };
    }
  }

  if (!response.ok) {
    throw new Error(
      errorMessage(payload) ?? `${mutation.operation} failed with status ${response.status}.`,
    );
  }

  if (!Array.isArray(payload) || payload.length !== 1) {
    throw new Error(`${mutation.operation} could not be confirmed: expected one affected record.`);
  }

  const [record] = payload;
  if (!isRecord(record) || record["id"] !== mutation.expectedId) {
    throw new Error(
      `${mutation.operation} could not be confirmed: the returned record did not match.`,
    );
  }

  return record;
}
