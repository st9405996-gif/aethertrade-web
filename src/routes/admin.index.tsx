import { createFileRoute } from "@tanstack/react-router";
import { AdminWorkspaceRoute } from "@/components/admin/admin-lazy";
export const Route = createFileRoute("/admin/")({
  head: () => ({ meta: [{ title: "Admin Overview — AETHER-TRADE" }, { name: "description", content: "Secure AETHER-TRADE administrator workspace." }, { property: "og:title", content: "AETHER-TRADE Admin" }, { property: "og:description", content: "Authenticated administrator workspace for managing website content and operations." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }, { name: "robots", content: "noindex, nofollow" }] }),
  component: () => <AdminWorkspaceRoute/>,
});