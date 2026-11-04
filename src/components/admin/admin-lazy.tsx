import { lazy, Suspense } from "react";
import type { ModuleId } from "@/lib/workspace-model";
const LazyAdminWorkspace = lazy(() => import("@/components/admin/admin-workspace").then(m => ({ default: m.AdminWorkspace })));
export function AdminWorkspaceRoute({ module }: { module?: ModuleId }) {
  return <Suspense fallback={<div className="container-page py-16 text-sm text-muted-foreground">Loading admin workspace…</div>}>
    {module ? <LazyAdminWorkspace module={module} /> : <LazyAdminWorkspace />}
  </Suspense>;
}
