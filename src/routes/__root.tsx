import { QueryClient, QueryClientProvider, useQuery } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
  ScriptOnce,
  type ErrorComponentProps,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";
import { themeBootstrapScript } from "@/components/site/theme-toggle";
import { Header } from "@/components/site/header";
import { Footer } from "@/components/site/footer";
import { WorkspaceProvider } from "@/components/admin/workspace-provider";
import { Toaster } from "@/components/ui/sonner";
import { getPublishedCmsPage } from "@/lib/public-cms.functions";
import { CmsPageRenderer } from "@/components/site/cms-page-renderer";

// Enterprise typography — Inter-first system stack with bundled Geist fallback.
import "@fontsource/geist-sans/400.css";
import "@fontsource/geist-sans/500.css";
import "@fontsource/geist-sans/600.css";
import "@fontsource/geist-sans/700.css";


function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Page not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: ErrorComponentProps) {
  console.error(error);
  const router = useRouter();
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          This page didn't load
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Something went wrong on our end. You can try refreshing or head back home.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Try again
          </button>
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            Go home
          </a>
        </div>
      </div>
    </div>
  );
}

// Canonical public origin. Change only if the production domain changes; see public/sitemap.xml.
const SITE_URL = "https://aethertrade.cloud";
const GOOGLE_ANALYTICS_ID = "G-JY6M0YJY1S";

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "AETHER-TRADE — Trade Automation Engineering" },
      {
        name: "description",
        content:
          "AETHER-TRADE engineers custom document intelligence and end-to-end workflow automation for importers, exporters and logistics enterprises.",
      },
      { name: "author", content: "AETHER-TRADE" },
      { property: "og:title", content: "AETHER-TRADE" },
      {
        property: "og:description",
        content: "Custom document intelligence and workflow automation for global trade.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    scripts: [
      {
        src: "https://cdn.consentmanager.net/delivery/autoblocking/30b2b75d02cfa.js",
        "data-cmp-ab": "1",
        "data-cmp-host": "d.delivery.consentmanager.net",
        "data-cmp-cdn": "cdn.consentmanager.net",
        "data-cmp-codesrc": "16",
      },
      {
        src: `https://www.googletagmanager.com/gtag/js?id=${GOOGLE_ANALYTICS_ID}`,
        async: true,
      },
      {
        children: `window.dataLayer = window.dataLayer || [];
function gtag(){window.dataLayer.push(arguments);}
gtag('js', new Date());
gtag('config', '${GOOGLE_ANALYTICS_ID}');`,
      },
      {
        type: "application/ld+json",
        children: JSON.stringify([
          {
            "@context": "https://schema.org",
            "@type": "Organization",
            name: "AETHER-TRADE",
            url: SITE_URL,
            description:
              "AETHER-TRADE helps importers, exporters, freight forwarders and logistics businesses organize trade operations through intelligent software and AI-powered workflows.",
          },
          {
            "@context": "https://schema.org",
            "@type": "WebSite",
            name: "AETHER-TRADE",
            url: SITE_URL,
          },
        ]),
      },
    ],
    links: [
      {
        rel: "stylesheet",
        href: appCss,
      },
      { rel: "icon", href: "/favicon.svg?v=20261104", type: "image/svg+xml" },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <HeadContent />
        <ScriptOnce>{themeBootstrapScript}</ScriptOnce>
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  const router = useRouter();
  const pathname = router.state.location.pathname;
  const admin = pathname.startsWith("/admin");
  const bareAuthPage = admin || pathname === "/auth" || pathname === "/reset-password";
  const pageSlugs: Record<string, string> = {
    "/": "home",
    "/about": "about",
    "/platform": "platform",
    "/how-it-works": "how-it-works",
    "/solutions": "solutions",
    "/industries": "industries",
    "/services": "services",
    "/automations": "automations",
    "/custom-solutions": "custom-solutions",
    "/insights": "insights",
    "/partnerships": "partnerships",
    "/careers": "careers",
    "/faqs": "faqs",
    "/contact": "contact",
    "/request-demo": "request-demo",
    "/privacy-policy": "privacy-policy",
    "/terms": "terms",
    "/cookie-policy": "cookie-policy",
  };
  const cmsSlug = pageSlugs[pathname] ?? null;
  const { data: cmsPage } = useQuery({
    queryKey: ["published-cms-page", cmsSlug],
    queryFn: () => getPublishedCmsPage({ data: { slug: cmsSlug! } }),
    enabled: Boolean(cmsSlug) && !bareAuthPage,
    staleTime: 60_000,
  });
  const hasCmsContent = Boolean(cmsPage && (cmsPage.body.trim() || cmsPage.sections.length));
  const cmsOverridesRoute = Boolean(hasCmsContent && cmsSlug && !["contact", "request-demo", "insights"].includes(cmsSlug));

  useEffect(() => {
    if (!cmsPage || !cmsSlug || !hasCmsContent) return;
    const title = cmsPage.seoTitle || cmsPage.title + " — AETHER-TRADE";
    document.title = title;
    const updateMeta = (attribute: "name" | "property", key: string, content: string) => {
      let element = document.head.querySelector('meta[' + attribute + '="' + key + '"]') as HTMLMetaElement | null;
      if (!content) {
        element?.remove();
        return;
      }
      if (!element) {
        element = document.createElement("meta");
        element.setAttribute(attribute, key);
        document.head.appendChild(element);
      }
      element.content = content;
    };
    const canonical = /^https:\/\/[A-Za-z0-9.-]+(?:\/.*)?$/.test(cmsPage.canonical)
      ? cmsPage.canonical
      : "https://aethertrade.cloud" + (pathname === "/" ? "/" : pathname);
    let canonicalLink = document.head.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
    if (!canonicalLink) {
      canonicalLink = document.createElement("link");
      canonicalLink.rel = "canonical";
      document.head.appendChild(canonicalLink);
    }
    canonicalLink.href = canonical;
    updateMeta("property", "og:title", title);
    updateMeta("property", "og:url", canonical);
    if (cmsPage.seoDescription) {
      updateMeta("name", "description", cmsPage.seoDescription);
      updateMeta("property", "og:description", cmsPage.seoDescription);
      updateMeta("name", "twitter:description", cmsPage.seoDescription);
    }
    updateMeta("name", "twitter:title", title);
    updateMeta("name", "robots", cmsPage.noindex ? "noindex, nofollow" : "");
  }, [cmsPage, cmsSlug, hasCmsContent, pathname]);

  return (
    <QueryClientProvider client={queryClient}>
      <WorkspaceProvider>
        <div className="flex min-h-screen flex-col">
          {!bareAuthPage && <Header />}
          <main className="flex-1">
            {/* Required: nested routes render here. Removing <Outlet /> breaks all child routes. */}
            {cmsOverridesRoute && cmsPage ? <CmsPageRenderer page={cmsPage} /> : <Outlet />}
            {!cmsOverridesRoute && cmsPage && hasCmsContent && <CmsPageRenderer page={cmsPage} showTitle={false} />}
          </main>
          {!bareAuthPage && <Footer />}
        </div>
        <Toaster />
      </WorkspaceProvider>
    </QueryClientProvider>
  );
}
