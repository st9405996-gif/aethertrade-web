import { lazy, Suspense } from "react";
import type { ModuleId } from "@/lib/workspace-model";
const LazyAdminWorkspace = lazy(() =>
  import.meta.env.DEV || __ADMIN_DEMO__
    ? import("@/components/admin/admin-workspace").then((m) => ({ default: m.AdminWorkspace }))
    : Promise.resolve({ default: UnavailableAdminWorkspace }),
);

function UnavailableAdminWorkspace(_props: { module?: ModuleId }) {
  return <></>;
}

export function AdminWorkspaceRoute({ module }: { module?: ModuleId }) {
  return (
    <Suspense
      fallback={
        <div className="container-page py-16 text-sm text-muted-foreground">
          Loading admin workspace…
        </div>
      }
    >
      {module ? <LazyAdminWorkspace module={module} /> : <LazyAdminWorkspace />}
    </Suspense>
  );
}
