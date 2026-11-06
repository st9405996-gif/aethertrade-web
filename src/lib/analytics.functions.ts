import { createServerFn } from "@tanstack/react-start";
import { readServerEnv } from "@/lib/server-env.server";
import { analyticsEventSchema, validateAnalyticsOrigin } from "@/lib/analytics-event";

export const trackAnalyticsEvent = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => {
    const parsed = analyticsEventSchema.safeParse(input);
    if (!parsed.success) throw new Error("Invalid analytics event.");
    return parsed.data;
  })
  .handler(async ({ data }) => {
    const { getRequestHeader } = await import("@tanstack/react-start/server");
    const origin = getRequestHeader("origin");
    const host = getRequestHeader("host");
    validateAnalyticsOrigin(origin ?? null, host ?? null);
    // No server-verifiable CMP signal exists; the browser claim is not proof.
    const serverVerifiedConsent: boolean | undefined = undefined;
    const { requireServerVerifiedAnalyticsConsent, writeAnalyticsEvent } = await import(
      "@/lib/analytics-write.server"
    );
    requireServerVerifiedAnalyticsConsent(serverVerifiedConsent);

    const clientKey = getRequestHeader("cf-connecting-ip") ?? "unidentified-client";
    const { consumeAnalyticsRateLimit } = await import("@/lib/analytics-rate-limit.server");
    if (!consumeAnalyticsRateLimit(clientKey)) return { accepted: false as const };

    const env = readServerEnv();
    const baseUrl = env["SUPABASE_URL"]?.replace(/\/$/, "");
    const serviceRoleKey = env["SUPABASE_SERVICE_ROLE_KEY"];
    await writeAnalyticsEvent(
      {
        supabaseUrl: baseUrl ?? "",
        serviceRoleKey: serviceRoleKey ?? "",
      },
      data,
      serverVerifiedConsent,
    );
    return { accepted: true as const };
  });
