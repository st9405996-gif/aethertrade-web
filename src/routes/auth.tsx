import { createFileRoute, notFound } from "@tanstack/react-router";
import { lazy, Suspense } from "react";

const AdminAuthRoute = lazy(() =>
  import.meta.env.DEV || __ADMIN_DEMO__
    ? import("@/components/admin/admin-auth-routes").then((module) => ({
        default: module.AdminAuthRoute,
      }))
    : Promise.resolve({ default: () => <></> }),
);

export const Route = createFileRoute("/auth")({
  beforeLoad: () => {
    if (!(import.meta.env.DEV || __ADMIN_DEMO__)) throw notFound();
  },
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
