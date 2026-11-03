import { createFileRoute } from "@tanstack/react-router";

// Operational health endpoint. Hidden (404) unless OPS_HEALTH_TOKEN is configured and presented.
export const Route = createFileRoute("/api/inquiry-health")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const { handleInquiryHealthRequest } = await import("@/lib/inquiry-health.server");
        return handleInquiryHealthRequest(request);
      },
    },
  },
});
