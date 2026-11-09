import { createFileRoute } from "@tanstack/react-router";
import { lazy, Suspense } from "react";

const AdminAuthRoute = lazy(() =>
  import("@/components/admin/admin-auth-routes").then((module) => ({
    default: module.AdminAuthRoute,
  })),
);

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Administrator Sign In — AETHER-TRADE" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: () => (
    <Suspense
      fallback={<div className="container-page py-16 text-sm text-muted-foreground">Loading…</div>}
    >
      <AdminAuthRoute />
    </Suspense>
  ),
});
