import { z } from "zod";

export const analyticsEventSchema = z.object({
  eventType: z.enum([
    "page_view",
    "cta_click",
    "demo_conversion",
    "contact_conversion",
    "automation_interest",
  ]),
  pagePath: z
    .string()
    .trim()
    .min(1)
    .max(200)
    .regex(/^\/[A-Za-z0-9/_-]*$/, "Use a clean relative page path."),
  automationSlug: z
    .string()
    .trim()
    .max(160)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
    .optional(),
  consent: z.literal(true),
});

export type AnalyticsEvent = z.infer<typeof analyticsEventSchema>;

export function validateAnalyticsOrigin(origin: string | null, host: string | null): void {
  if (!origin || !host) throw new Error("Analytics origin could not be validated.");
  try {
    if (new URL(origin).host !== host) throw new Error("Cross-origin analytics request rejected.");
  } catch {
    throw new Error("Analytics origin could not be validated.");
  }
}
