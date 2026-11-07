import { describe, expect, it } from "vitest";
import { isPublicAt } from "@/lib/publication";

describe("isPublicAt", () => {
  const now = Date.parse("2026-11-06T12:00:00.000Z");
  it("allows published content", () => expect(isPublicAt("Published", null, now)).toBe(true));
  it("keeps drafts and archived content private", () => {
    expect(isPublicAt("Draft", null, now)).toBe(false);
    expect(isPublicAt("Archived", null, now)).toBe(false);
  });
  it("keeps scheduled content private until its time", () => {
    expect(isPublicAt("Scheduled", "2026-11-06T12:01:00.000Z", now)).toBe(false);
  });
  it("makes scheduled content public at or after its time", () => {
    expect(isPublicAt("Scheduled", "2026-11-06T12:00:00.000Z", now)).toBe(true);
    expect(isPublicAt("Scheduled", "2026-11-06T11:59:00.000Z", now)).toBe(true);
  });
  it("rejects invalid scheduled timestamps", () =>
    expect(isPublicAt("Scheduled", "not-a-date", now)).toBe(false));
});
