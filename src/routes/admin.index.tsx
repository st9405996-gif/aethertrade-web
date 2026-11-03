import { createFileRoute } from "@tanstack/react-router";
import { AdminWorkspaceRoute } from "@/components/admin/admin-lazy";
export const Route = createFileRoute("/admin/")({
  head: () => ({ meta: [{ title: "Admin Overview — AETHER-TRADE Demo" }, { name: "description", content: "AETHER-TRADE disconnected administration workspace." }, { property: "og:title", content: "AETHER-TRADE Admin Demo" }, { property: "og:description", content: "Browser-only administration preview. No operational backend." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }, { name: "robots", content: "noindex, nofollow" }] }),
  component: () => <AdminWorkspaceRoute/>,
});