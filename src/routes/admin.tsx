import { createFileRoute, Outlet, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useWorkspace } from "@/components/admin/workspace-provider";

export const Route = createFileRoute("/admin")({ component: AdminGate });

function AdminGate() {
  const { ready, authenticated, role } = useWorkspace();
  const navigate = useNavigate();
  const ownerAuthorized = authenticated && role === "Super Admin";

  useEffect(() => {
    if (ready && !ownerAuthorized) {
      void navigate({ to: "/auth", replace: true });
    }
  }, [ready, ownerAuthorized, navigate]);

  if (!ready) {
    return (
      <div className="container-page py-20 text-sm text-muted-foreground">
        Verifying owner administrator access…
      </div>
    );
  }

  if (!ownerAuthorized) return null;

  return <Outlet />;
}
