import { createFileRoute } from "@tanstack/react-router";
import { lazy, Suspense } from "react";

const AdminRoute = lazy(() =>
  import("@/components/admin/admin-route").then((module) => ({ default: module.AdminRoute })),
);

export const Route = createFileRoute("/admin")({
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
