import { createFileRoute } from "@tanstack/react-router";
import AuthPage from "@/components/admin/auth-preview";
export const Route = createFileRoute("/auth")({
  head: () => ({ meta: [{ title: "Administrator Sign In — AETHER-TRADE" }, { name: "robots", content: "noindex, nofollow" }] }),
  component: AuthPage,
});
