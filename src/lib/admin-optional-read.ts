/**
 * Structured results for optional Admin Panel reads. A failed read is never converted
 * into an empty list: the caller keeps previously loaded data and reports the failure.
 * Messages are deliberately generic so no SQL, stack trace or server detail reaches the UI.
 */
export type JsonRecord = Record<string, unknown>;

export type OptionalRead =
  { status: "ok"; rows: JsonRecord[] } | { status: "failed"; label: string; message: string };

function failure(label: string): OptionalRead {
  return {
    status: "failed",
    label,
    message: `${label} could not be loaded. Check your connection and access, then retry.`,
  };
}

export async function readOptionalRows(
  label: string,
  read: () => Promise<unknown>,
): Promise<OptionalRead> {
  try {
    const result = await read();
    if (!Array.isArray(result)) return failure(label);
    const rows = result.filter(
      (item): item is JsonRecord =>
        item !== null && typeof item === "object" && !Array.isArray(item),
    );
    if (rows.length !== result.length) return failure(label);
    return { status: "ok", rows };
  } catch {
    return failure(label);
  }
}

/** Successful reads (including an empty list) replace the data; failed reads keep what was loaded. */
export function keepPreviousOnFailure<T>(
  previous: T[],
  result: OptionalRead,
  map: (rows: JsonRecord[]) => T[],
): T[] {
  return result.status === "ok" ? map(result.rows) : previous;
}

/** One banner message for every module that failed in the same load. */
export function summarizeLoadFailures(labels: string[]): string {
  if (labels.length === 0) return "";
  return (
    "Some workspace data could not be loaded (" +
    labels.join(", ") +
    "). Other modules are available. Retry to load the missing data."
  );
}
