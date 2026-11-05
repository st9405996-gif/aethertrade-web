const WINDOW_MS = 60_000;
const MAX_EVENTS_PER_WINDOW = 60;
const windows = new Map<string, { startedAt: number; hits: number }>();

export function consumeAnalyticsRateLimit(key: string, now = Date.now()): boolean {
  const safeKey = key.slice(0, 128) || "unidentified-client";
  const current = windows.get(safeKey);
  if (!current || now - current.startedAt >= WINDOW_MS) {
    windows.set(safeKey, { startedAt: now, hits: 1 });
    return true;
  }
  if (current.hits >= MAX_EVENTS_PER_WINDOW) return false;
  current.hits += 1;
  return true;
}
