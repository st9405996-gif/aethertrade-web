/**
 * Best-effort, per-isolate throttle for expensive server functions.
 *
 * The durable abuse controls are Turnstile and the server-side quota
 * (submission-guard.server.ts) plus the WAF rate-limit rule; both operate in live
 * mode and fail closed. This limiter only blunts bursts that arrive faster than a
 * single Worker isolate can shed them — for example while delivery is not yet
 * configured, or when the upstream services are unreachable. It fails open by
 * design: losing this in-memory state never blocks a legitimate submission.
 */

const WINDOW_MS = 60_000;
const MAX_REQUESTS_PER_WINDOW = 10;
const MAX_TRACKED_KEYS = 10_000;

type Bucket = { count: number; resetAt: number };

const buckets = new Map<string, Bucket>();

/** True when the key may proceed this window; false when the window is exhausted. */
export function consumeRateLimit(key: string, nowMs: number = Date.now()): boolean {
  const bucket = buckets.get(key);
  if (!bucket || bucket.resetAt <= nowMs) {
    if (buckets.size >= MAX_TRACKED_KEYS) evictExpired(nowMs);
    buckets.set(key, { count: 1, resetAt: nowMs + WINDOW_MS });
    return true;
  }
  bucket.count += 1;
  return bucket.count <= MAX_REQUESTS_PER_WINDOW;
}

function evictExpired(nowMs: number) {
  for (const [key, bucket] of buckets) {
    if (bucket.resetAt <= nowMs) buckets.delete(key);
    if (buckets.size < MAX_TRACKED_KEYS) return;
  }
}
