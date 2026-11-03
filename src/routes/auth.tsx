declare const __ADMIN_DEMO__: boolean;
import { createFileRoute, notFound } from "@tanstack/react-router";
import { lazy, Suspense } from "react";
import { adminDemoEnabled } from "@/lib/site-mode";

// The preview module is loaded only in dev/explicit demo builds, so production emits no auth chunk.
const AuthPreview =
  import.meta.env.DEV || __ADMIN_DEMO__
    ? lazy(() => import("@/components/admin/auth-preview"))
    : null;

export const Route = createFileRoute("/auth")({
  beforeLoad: () => {
    if (!adminDemoEnabled) throw notFound();
  },
  head: () => ({
    meta: [
      { title: "Administrator Access — AETHER-TRADE" },
      { name: "description", content: "Administrator sign-in readiness for AETHER-TRADE." },
      { property: "og:title", content: "AETHER-TRADE Administrator Access" },
      {
        property: "og:description",
        content: "Secure administrator access awaits external account connection.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: AuthRoute,
});

function AuthRoute() {
  return AuthPreview ? (
    <Suspense fallback={null}>
      <AuthPreview />
    </Suspense>
  ) : null;
}
