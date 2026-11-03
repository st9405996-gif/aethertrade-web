/**
 * @vitest-environment node
 */
import { describe, expect, it } from "vitest";
import {
  CONFIRMATION_TTL_SECONDS,
  issueConfirmationToken,
  verifyConfirmationToken,
} from "@/lib/confirmation-token";

const SECRET = "confirmation_secret_for_tests_0123456789";
const NOW = Date.UTC(2026, 10, 3, 12, 0, 0);
const REF = "AT-1A2B3C4D";

describe("confirmation tokens (forged URL protection)", () => {
  it("verifies a token issued by the server for the same reference", async () => {
    const token = await issueConfirmationToken(REF, SECRET, NOW);
    expect(await verifyConfirmationToken(REF, token, SECRET, NOW + 1000)).toBe(true);
  });

  it("rejects a forged reference with a token issued for another reference", async () => {
    const token = await issueConfirmationToken(REF, SECRET, NOW);
    expect(await verifyConfirmationToken("AT-FFFFFFFF", token, SECRET, NOW)).toBe(false);
  });

  it("rejects a made-up reference and token pair", async () => {
    expect(await verifyConfirmationToken(REF, "1762171200.".padEnd(75, "a"), SECRET, NOW)).toBe(
      false,
    );
  });

  it("rejects a token signed with a different secret", async () => {
    const token = await issueConfirmationToken(REF, "another_secret_value_0123456789abcdef", NOW);
    expect(await verifyConfirmationToken(REF, token, SECRET, NOW)).toBe(false);
  });

  it("rejects a token whose timestamp was altered after signing", async () => {
    const token = await issueConfirmationToken(REF, SECRET, NOW);
    const [issued, sig] = token.split(".") as [string, string];
    const tampered = `${Number(issued) + 60}.${sig}`;
    expect(await verifyConfirmationToken(REF, tampered, SECRET, NOW + 61_000)).toBe(false);
  });

  it("rejects an expired token", async () => {
    const token = await issueConfirmationToken(REF, SECRET, NOW);
    const later = NOW + (CONFIRMATION_TTL_SECONDS + 1) * 1000;
    expect(await verifyConfirmationToken(REF, token, SECRET, later)).toBe(false);
  });

  it("rejects a token dated implausibly far in the future", async () => {
    const token = await issueConfirmationToken(REF, SECRET, NOW + 3_600_000);
    expect(await verifyConfirmationToken(REF, token, SECRET, NOW)).toBe(false);
  });

  it("rejects malformed tokens and malformed references without throwing", async () => {
    for (const bad of ["", "abc", "123.456", "1762171200.ZZZZ", "1762171200.", "<script>"]) {
      expect(await verifyConfirmationToken(REF, bad, SECRET, NOW)).toBe(false);
    }
    expect(
      await verifyConfirmationToken(
        "AT-zzzzzzzz",
        await issueConfirmationToken(REF, SECRET, NOW),
        SECRET,
        NOW,
      ),
    ).toBe(false);
  });

  it("fails closed when the server secret is missing or too short", async () => {
    const token = await issueConfirmationToken(REF, SECRET, NOW);
    expect(await verifyConfirmationToken(REF, token, "", NOW)).toBe(false);
    expect(await verifyConfirmationToken(REF, token, "short", NOW)).toBe(false);
    await expect(issueConfirmationToken(REF, "short", NOW)).rejects.toThrow("too short");
  });

  it("refuses to issue a token for a non-reference value", async () => {
    await expect(issueConfirmationToken("DEMO-12345678", SECRET, NOW)).rejects.toThrow(
      "invalid reference",
    );
  });
});
