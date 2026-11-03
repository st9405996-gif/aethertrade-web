declare const __ADMIN_DEMO__: boolean;
import { createFileRoute, notFound } from "@tanstack/react-router";
import { lazy, Suspense } from "react";
import { adminDemoEnabled } from "@/lib/site-mode";

const ResetPreview =
  import.meta.env.DEV || __ADMIN_DEMO__
    ? lazy(() => import("@/components/admin/reset-preview"))
    : null;

export const Route = createFileRoute("/reset-password")({
  beforeLoad: () => {
    if (!adminDemoEnabled) throw notFound();
  },
  head: () => ({
    meta: [
      { title: "Password Recovery — AETHER-TRADE" },
      { name: "description", content: "AETHER-TRADE administrator password recovery readiness." },
      { property: "og:title", content: "Password Recovery — AETHER-TRADE" },
      { property: "og:description", content: "Account recovery is not yet connected." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: ResetRoute,
});

function ResetRoute() {
  return ResetPreview ? (
    <Suspense fallback={null}>
      <ResetPreview />
    </Suspense>
  ) : null;
}
