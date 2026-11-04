import { createFileRoute, Outlet, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useWorkspace } from "@/components/admin/workspace-provider";
export const Route = createFileRoute("/admin")({ component: AdminGate });
function AdminGate() {
  const { ready, authenticated } = useWorkspace();
  const navigate = useNavigate();
  useEffect(() => { if (ready && !authenticated) void navigate({ to: "/auth", replace: true }); }, [ready, authenticated, navigate]);
  if (!ready) return <div className="container-page py-20 text-sm text-muted-foreground">Checking administrator session…</div>;
  if (!authenticated) return null;
  return <Outlet />;
}
