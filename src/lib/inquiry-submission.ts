// Pure, client-safe submission rules shared by the server function and its tests.
import { z } from "zod";
import { inquirySchema } from "@/lib/workspace-model";

/** Shown for every rejected submission, so bots learn nothing about which check failed. */
export const SUBMISSION_REJECTED_MESSAGE =
  "Your submission could not be accepted. Please check the form and try again.";

/** Humans rarely complete the form faster than this; faster submissions are treated as automated. */
export const MIN_FORM_ELAPSED_MS = 3_000;
export const MAX_FORM_ELAPSED_MS = 24 * 60 * 60 * 1000;

// elapsedMs is supplied by the browser and can be forged. It is a cheap heuristic only;
// the security controls are Turnstile and the server-side quota in submission-guard.
const submissionEnvelope = z.object({
  requestKey: z.uuid(),
  elapsedMs: z.number().finite().min(0).max(MAX_FORM_ELAPSED_MS),
  turnstileToken: z.string().min(1).max(2048).optional(),
});

export type ValidatedSubmission = z.infer<typeof inquirySchema> &
  z.infer<typeof submissionEnvelope>;

/**
 * Validates field values plus the anti-spam envelope (idempotency key and elapsed time).
 * The honeypot is enforced by inquirySchema: any value in `website` is rejected.
 */
export function parseSubmission(input: unknown): ValidatedSubmission {
  const fields = inquirySchema.safeParse(input);
  const envelope = submissionEnvelope.safeParse(input);
  if (!fields.success || !envelope.success) throw new Error(SUBMISSION_REJECTED_MESSAGE);
  if (envelope.data.elapsedMs < MIN_FORM_ELAPSED_MS) throw new Error(SUBMISSION_REJECTED_MESSAGE);
  return { ...fields.data, ...envelope.data };
}
