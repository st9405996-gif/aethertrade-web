import { createFileRoute } from "@tanstack/react-router";
import { lazy, Suspense } from "react";

const AdminResetRoute = lazy(() =>
  import("@/components/admin/admin-auth-routes").then((module) => ({
    default: module.AdminResetRoute,
  })),
);

export const Route = createFileRoute("/reset-password")({
  head: () => ({
    meta: [
      { title: "Reset Administrator Password — AETHER-TRADE" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: () => (
    <Suspense
      fallback={<div className="container-page py-16 text-sm text-muted-foreground">Loading…</div>}
    >
      <AdminResetRoute />
    </Suspense>
  ),
});
