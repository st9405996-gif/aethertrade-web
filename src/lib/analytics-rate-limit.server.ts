const WINDOW_MS = 60_000;
const MAX_EVENTS_PER_WINDOW = 60;
const MAX_TRACKED_KEYS = 10_000;
const windows = new Map<string, { startedAt: number; hits: number }>();

export function consumeAnalyticsRateLimit(key: string, now = Date.now()): boolean {
  const safeKey = key.slice(0, 128) || "unidentified-client";
  const current = windows.get(safeKey);
  if (!current || now - current.startedAt >= WINDOW_MS) {
    if (!current && windows.size >= MAX_TRACKED_KEYS) {
      evictExpiredWindows(now);
      if (windows.size >= MAX_TRACKED_KEYS) return false;
    }
    windows.set(safeKey, { startedAt: now, hits: 1 });
    return true;
  }
  if (current.hits >= MAX_EVENTS_PER_WINDOW) return false;
  current.hits += 1;
  return true;
}

function evictExpiredWindows(now: number): void {
  for (const [key, window] of windows) {
    if (now - window.startedAt >= WINDOW_MS) windows.delete(key);
    if (windows.size < MAX_TRACKED_KEYS) return;
  }
}
