import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const eventSchema = z.object({
  eventType: z.enum(["page_view", "cta_click", "demo_conversion", "contact_conversion", "automation_interest"]),
  pagePath: z.string().trim().min(1).max(200).regex(/^\/[A-Za-z0-9/_-]*$/, "Use a clean relative page path."),
  automationSlug: z.string().trim().max(160).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).optional(),
  consent: z.literal(true),
});

export const trackAnalyticsEvent = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => {
    const parsed = eventSchema.safeParse(input);
    if (!parsed.success) throw new Error("Invalid analytics event.");
    return parsed.data;
  })
  .handler(async ({ data }) => {
    const { getRequestHeader } = await import("@tanstack/react-start/server");
    const origin = getRequestHeader("origin");
    const host = getRequestHeader("host");
    if (origin && host) {
      try {
        if (new URL(origin).host !== host) throw new Error("Cross-origin analytics request rejected.");
      } catch {
        throw new Error("Analytics origin could not be validated.");
      }
    }
    const clientKey = getRequestHeader("cf-connecting-ip") ?? "unidentified-client";
    const { consumeAnalyticsRateLimit } = await import("@/lib/analytics-rate-limit.server");
    if (!consumeAnalyticsRateLimit(clientKey)) return { accepted: false as const };

    const { readServerEnv } = await import("@/lib/server-env.server");
    const env = readServerEnv();
    const baseUrl = env["SUPABASE_URL"]?.replace(/\/$/, "");
    const publishableKey = env["SUPABASE_PUBLISHABLE_KEY"];
    if (!baseUrl || !publishableKey) throw new Error("Analytics database connection is not configured.");
    const response = await fetch(baseUrl + "/rest/v1/analytics_events", {
      method: "POST",
      headers: {
        apikey: publishableKey,
        Authorization: "Bearer " + publishableKey,
        "Content-Type": "application/json",
        Prefer: "return=minimal",
      },
      body: JSON.stringify({
        event_type: data.eventType,
        page_path: data.pagePath,
        automation_slug: data.automationSlug || null,
        consent: true,
      }),
    });
    if (!response.ok) throw new Error("Analytics event was not accepted by the database.");
    return { accepted: true as const };
  });
