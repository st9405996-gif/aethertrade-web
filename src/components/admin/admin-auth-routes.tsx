import AuthPage from "@/components/admin/auth-preview";
import ResetPage from "@/components/admin/reset-preview";
import { WorkspaceProvider } from "@/components/admin/workspace-provider";

export function AdminAuthRoute() {
  return (
    <WorkspaceProvider>
      <AuthPage />
    </WorkspaceProvider>
  );
}

export function AdminResetRoute() {
  return (
    <WorkspaceProvider>
      <ResetPage />
    </WorkspaceProvider>
  );
}
