// Signed confirmation for a stored inquiry. The browser cannot forge a valid token without
// CONFIRMATION_SECRET, so a made-up reference in the URL never verifies. Tokens expire.
import { hmacSha256Hex, timingSafeEqual } from "@/lib/crypto-utils";

export const REFERENCE_PATTERN = /^AT-[0-9A-F]{8}$/;
export const CONFIRMATION_TTL_SECONDS = 24 * 60 * 60;
export const MIN_SECRET_LENGTH = 32;
const TOKEN_PATTERN = /^(\d{10})\.([0-9a-f]{64})$/;
const MAX_CLOCK_SKEW_SECONDS = 300;

export async function issueConfirmationToken(
  reference: string,
  secret: string,
  nowMs: number = Date.now(),
): Promise<string> {
  if (!REFERENCE_PATTERN.test(reference)) throw new Error("invalid reference");
  if (secret.length < MIN_SECRET_LENGTH) throw new Error("confirmation secret too short");
  const issuedAt = Math.floor(nowMs / 1000);
  const signature = await hmacSha256Hex(secret, `${reference}|${issuedAt}`);
  return `${issuedAt}.${signature}`;
}

export async function verifyConfirmationToken(
  reference: string,
  token: string,
  secret: string,
  nowMs: number = Date.now(),
): Promise<boolean> {
  if (secret.length < MIN_SECRET_LENGTH) return false;
  if (!REFERENCE_PATTERN.test(reference)) return false;
  const match = TOKEN_PATTERN.exec(token);
  if (!match) return false;
  const issuedAt = Number(match[1]);
  const ageSeconds = Math.floor(nowMs / 1000) - issuedAt;
  if (ageSeconds < -MAX_CLOCK_SKEW_SECONDS || ageSeconds > CONFIRMATION_TTL_SECONDS) return false;
  const expected = await hmacSha256Hex(secret, `${reference}|${issuedAt}`);
  return timingSafeEqual(expected, match[2]!);
}
