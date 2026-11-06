export type AuditRow = Record<string, unknown>;

export type AuditReadResult =
  | { status: "available"; rows: AuditRow[]; error: "" }
  | { status: "unavailable"; rows: []; error: string };

function isAuditRow(value: unknown): value is AuditRow {
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    return false;
  }
  const row = value as Record<string, unknown>;
  return ["id", "action", "created_at"].every(
    (field) => typeof row[field] === "string" && row[field].trim().length > 0,
  );
}

export async function readAuditRows(read: () => Promise<unknown>): Promise<AuditReadResult> {
  try {
    const result = await read();
    if (!Array.isArray(result) || !result.every(isAuditRow)) {
      return {
        status: "unavailable",
        rows: [],
        error: "Audit history could not be loaded. Check access and connection.",
      };
    }
    return { status: "available", rows: result, error: "" };
  } catch {
    return {
      status: "unavailable",
      rows: [],
      error: "Audit history could not be loaded. Check access and connection.",
    };
  }
}
