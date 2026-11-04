import { createFileRoute } from "@tanstack/react-router";
import ResetPage from "@/components/admin/reset-preview";
export const Route = createFileRoute("/reset-password")({
  head: () => ({ meta: [{ title: "Reset Administrator Password — AETHER-TRADE" }, { name: "robots", content: "noindex, nofollow" }] }),
  component: ResetPage,
});
