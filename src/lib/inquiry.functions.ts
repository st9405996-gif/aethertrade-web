import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { parseSubmission } from "@/lib/inquiry-submission";

const confirmationInput = z.object({
  reference: z.string().max(20),
  token: z.string().max(200),
});

/** Reports only whether live delivery is configured. Never returns configuration values. */
export const getInquiryDeliveryMode = createServerFn({ method: "GET" }).handler(async () => {
  const { readDeliveryConfig } = await import("@/lib/inquiry-delivery.server");
  const { readServerEnv } = await import("@/lib/server-env.server");
  return {
    mode: readDeliveryConfig(readServerEnv()).enabled ? ("live" as const) : ("demo" as const),
  };
});

/**
 * Validates an inquiry on the server. Demo mode persists nothing. Live mode runs the
 * abuse guard (Turnstile, then quota) before storing anything, and returns a signed
 * confirmation token that the thank-you page must verify.
 */
export const submitInquiry = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => parseSubmission(input))
  .handler(async ({ data }) => {
    const { SUBMISSION_REJECTED_MESSAGE } = await import("@/lib/inquiry-submission");
    const { getRequestHeader } = await import("@tanstack/react-start/server");
    const { consumeRateLimit } = await import("@/lib/submission-rate-limit.server");
    const clientKey = getRequestHeader("cf-connecting-ip") ?? "unidentified-client";
    if (!consumeRateLimit(clientKey)) throw new Error(SUBMISSION_REJECTED_MESSAGE);

    const { readDeliveryConfig, deliverInquiry } = await import("@/lib/inquiry-delivery.server");
    const { readServerEnv } = await import("@/lib/server-env.server");
    const readout = readDeliveryConfig(readServerEnv());
    if (!readout.enabled) {
      return {
        mode: "demo" as const,
        reference: null,
        persisted: false as const,
        notified: false as const,
        confirmationToken: null,
      };
    }

    const { guardLiveSubmission } = await import("@/lib/submission-guard.server");
    const guard = await guardLiveSubmission({
      config: readout.config,
      turnstileToken: data.turnstileToken,
      remoteIp: getRequestHeader("cf-connecting-ip") ?? undefined,
    });
    if (!guard.ok) throw new Error(guard.userMessage);

    const result = await deliverInquiry(
      {
        requestKey: data.requestKey,
        kind: data.kind,
        name: data.name,
        email: data.email,
        company: data.company,
        country: data.country,
        category: data.category,
        automation: data.automation,
        message: data.message,
        requirements: data.requirements,
      },
      readout.config,
    );

    const { issueConfirmationToken } = await import("@/lib/confirmation-token");
    const confirmationToken = await issueConfirmationToken(
      result.reference,
      readout.config.confirmationSecret,
    );
    return { mode: "live" as const, ...result, confirmationToken };
  });

/**
 * Returns only true or false. Confirms that a reference and token were issued by this server
 * and have not expired. Returns no inquiry data.
 */
export const verifyInquiryConfirmation = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => {
    const parsed = confirmationInput.safeParse(input);
    return parsed.success ? parsed.data : { reference: "", token: "" };
  })
  .handler(async ({ data }) => {
    const { readServerEnv } = await import("@/lib/server-env.server");
    const { verifyConfirmationToken } = await import("@/lib/confirmation-token");
    const secret = readServerEnv()["CONFIRMATION_SECRET"] ?? "";
    const confirmed = await verifyConfirmationToken(data.reference, data.token, secret);
    return { confirmed };
  });
