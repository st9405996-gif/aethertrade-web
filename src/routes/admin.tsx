import { createFileRoute, notFound } from "@tanstack/react-router";
import { lazy, Suspense } from "react";

const AdminRoute = lazy(() =>
  import.meta.env.DEV || __ADMIN_DEMO__
    ? import("@/components/admin/admin-route").then((module) => ({ default: module.AdminRoute }))
    : Promise.resolve({ default: () => <></> }),
);

export const Route = createFileRoute("/admin")({
  beforeLoad: () => {
    if (!(import.meta.env.DEV || __ADMIN_DEMO__)) throw notFound();
  },
  component: () => (
    <Suspense
      fallback={
        <div className="container-page py-20 text-sm text-muted-foreground">
          Loading administrator access…
        </div>
      }
    >
      <AdminRoute />
    </Suspense>
  ),
});
