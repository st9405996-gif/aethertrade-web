declare const __ADMIN_DEMO__: boolean;
import { lazy, Suspense } from "react";
import type { ModuleId } from "@/lib/workspace-model";

// The condition is written inline so the bundler can fold it to a literal in production builds.
// In production (no admin demo) the import below is removed entirely from the output.
const LazyAdminWorkspace =
  import.meta.env.DEV || __ADMIN_DEMO__
    ? lazy(() =>
        import("@/components/admin/admin-workspace").then((m) => ({ default: m.AdminWorkspace })),
      )
    : null;

export function AdminWorkspaceRoute({ module }: { module?: ModuleId }) {
  if (!LazyAdminWorkspace) return null;
  return (
    <Suspense fallback={null}>
      {module ? <LazyAdminWorkspace module={module} /> : <LazyAdminWorkspace />}
    </Suspense>
  );
}
