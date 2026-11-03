import { createFileRoute, notFound, Outlet } from "@tanstack/react-router";
import { adminDemoEnabled } from "@/lib/site-mode";
export const Route = createFileRoute("/admin")({
  beforeLoad: () => { if (!adminDemoEnabled) throw notFound(); },
  component: () => <Outlet/>,
});
