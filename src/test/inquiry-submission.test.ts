import { describe, expect, it } from "vitest";
import {
  MIN_FORM_ELAPSED_MS,
  SUBMISSION_REJECTED_MESSAGE,
  parseSubmission,
} from "@/lib/inquiry-submission";

const validSubmission = {
  kind: "contact",
  name: "Test Reviewer",
  email: "reviewer@example.com",
  company: "Illustrative company",
  country: "Pakistan",
  category: "General inquiry",
  automation: "",
  message: "Illustrative operational question",
  requirements: "",
  consent: true,
  website: "",
  requestKey: "9b2e0c3a-4d5f-4a6b-8c7d-1e2f3a4b5c6d",
  elapsedMs: 5_000,
};

describe("parseSubmission (server-side submission rules)", () => {
  it("accepts a complete submission with a plausible elapsed time", () => {
    const parsed = parseSubmission(validSubmission);
    expect(parsed.email).toBe("reviewer@example.com");
    expect(parsed.requestKey).toBe(validSubmission.requestKey);
  });

  it("rejects a filled honeypot field with a generic message", () => {
    expect(() => parseSubmission({ ...validSubmission, website: "https://spam.example" })).toThrow(
      SUBMISSION_REJECTED_MESSAGE,
    );
  });

  it("rejects submissions completed faster than a human could plausibly fill the form", () => {
    expect(() =>
      parseSubmission({ ...validSubmission, elapsedMs: MIN_FORM_ELAPSED_MS - 1 }),
    ).toThrow(SUBMISSION_REJECTED_MESSAGE);
  });

  it("rejects a missing or non-UUID idempotency key", () => {
    const { requestKey: _omit, ...withoutKey } = validSubmission;
    expect(() => parseSubmission(withoutKey)).toThrow(SUBMISSION_REJECTED_MESSAGE);
    expect(() => parseSubmission({ ...validSubmission, requestKey: "not-a-uuid" })).toThrow(
      SUBMISSION_REJECTED_MESSAGE,
    );
  });

  it("rejects submissions without privacy consent", () => {
    expect(() => parseSubmission({ ...validSubmission, consent: false })).toThrow(
      SUBMISSION_REJECTED_MESSAGE,
    );
  });

  it("rejects oversized free text", () => {
    expect(() => parseSubmission({ ...validSubmission, message: "x".repeat(4001) })).toThrow(
      SUBMISSION_REJECTED_MESSAGE,
    );
  });

  it("rejects an elapsed time beyond the 24-hour ceiling", () => {
    expect(() => parseSubmission({ ...validSubmission, elapsedMs: 25 * 60 * 60 * 1000 })).toThrow(
      SUBMISSION_REJECTED_MESSAGE,
    );
  });
});

describe("parseSubmission turnstile envelope", () => {
  it("accepts an optional Turnstile token and rejects an oversized one", () => {
    expect(
      parseSubmission({ ...validSubmission, turnstileToken: "token-abc" }).turnstileToken,
    ).toBe("token-abc");
    expect(() => parseSubmission({ ...validSubmission, turnstileToken: "x".repeat(2049) })).toThrow(
      SUBMISSION_REJECTED_MESSAGE,
    );
  });
});
