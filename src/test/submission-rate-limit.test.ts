/**
 * @vitest-environment node
 */
import { describe, expect, it } from "vitest";
import { consumeRateLimit } from "@/lib/submission-rate-limit.server";

describe("consumeRateLimit (per-isolate burst throttle)", () => {
  it("allows requests up to the window budget and then refuses", () => {
    const start = 1_000_000;
    const outcomes = Array.from({ length: 12 }, (_, i) => consumeRateLimit("ip-a", start + i));
    expect(outcomes.filter(Boolean).length).toBe(10);
    expect(outcomes.slice(10)).toEqual([false, false]);
  });

  it("tracks keys independently", () => {
    const start = 2_000_000;
    for (let i = 0; i < 10; i++) expect(consumeRateLimit("ip-c", start + 1)).toBe(true);
    expect(consumeRateLimit("ip-c", start + 2)).toBe(false);
    // A different key is unaffected by the exhausted one.
    expect(consumeRateLimit("ip-b", start)).toBe(true);
  });

  it("admits the key again once the window has elapsed", () => {
    const start = 3_000_000;
    for (let i = 0; i < 10; i++) consumeRateLimit("ip-d", start + i);
    expect(consumeRateLimit("ip-d", start + 30_000)).toBe(false);
    expect(consumeRateLimit("ip-d", start + 60_001)).toBe(true);
  });

  it("starts a fresh budget after the window elapses", () => {
    const start = 4_000_000;
    for (let i = 0; i < 10; i++) expect(consumeRateLimit("ip-e", start)).toBe(true);
    expect(consumeRateLimit("ip-e", start + 1)).toBe(false);
    expect(consumeRateLimit("ip-e", start + 60_001)).toBe(true);
  });
});
