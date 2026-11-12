import { createFileRoute } from "@tanstack/react-router";
import { getPublishedCmsPage, mergeCmsHead, cmsHero } from "@/lib/public-cms.functions";
import { CmsPageSections } from "@/components/site/cms-page-renderer";
import { meta } from "@/components/site/blocks";
import { LegalPage } from "@/components/site/legal-page";

export const Route = createFileRoute("/cookie-policy")({
  loader: async () => ({ cmsPage: await getPublishedCmsPage({ data: { slug: "cookie-policy" } }) }),
  head: ({ loaderData }) =>
    mergeCmsHead(
      meta(
        "Cookie Policy",
        "How AETHER-TRADE uses browser storage, consent preferences, analytics and essential website security features.",
      ),
      loaderData?.cmsPage,
      { fallbackPath: "/cookie-policy", title: "Cookie Policy | AETHER-TRADE", description: "Learn how AETHER-TRADE uses essential browser storage, consent preferences and website analytics." },
    ),
  component: CookiePolicyPage,
});

function CookiePolicyPage() {
  const { cmsPage } = Route.useLoaderData();
  return (
    <>
      <LegalPage
        {...cmsHero(cmsPage, {
          title: "Cookie & Browser Storage Policy.",
          description:
            "AETHER-TRADE uses browser storage for essential preferences and administrator sign-in. With your permission, the website also uses analytics tools to understand website usage and improve its pages.",
        })}
        cmsBody={cmsPage?.body}
      >
        <h2>Browser storage used by the website</h2>
        <ul>
          <li>
            <strong className="text-foreground">Theme preference</strong>: remembers your light or
            dark display preference on this device.
          </li>
          <li>
            <strong className="text-foreground">Administrator session</strong>: the protected
            administrator workspace stores sign-in session information in browser storage to
            maintain the authenticated session.
          </li>
          <li>
            <strong className="text-foreground">Consent preference</strong>: the consent manager
            stores your cookie and analytics choices so they can be applied on later visits.
          </li>
        </ul>
        <h2>Analytics</h2>
        <p>
          If you allow the audience-statistics/analytics purpose in the consent banner, AETHER-TRADE
          uses Google Analytics and Microsoft Clarity to understand site visits and how visitors
          interact with pages. Microsoft Clarity may provide interaction recordings and heatmaps.
          Clarity is loaded only after analytics consent is granted, and its consent mode is told
          not to use advertising storage. If analytics consent is not granted, the Clarity tag is
          not loaded. If you later withdraw consent after it has loaded, the site sends Clarity a
          denied analytics-consent signal.
        </p>
        <p>
          You can change your choice through the consent preferences control when available in the
          website's consent banner. Analytics features may not work when consent is declined.
        </p>
        <h2>Form security</h2>
        <p>
          Contact and Request an Operations Audit forms use Cloudflare Turnstile and server-side
          rate limiting to help prevent automated abuse. Cloudflare may process technical browser
          and device signals as part of this security check.
        </p>
        <h2>Managing browser storage</h2>
        <p>
          You can clear website data through your browser settings. Clearing administrator session
          data will sign the administrator out; clearing the theme preference or consent preference
          will reset those choices.
        </p>
      </LegalPage>
      <CmsPageSections page={cmsPage} />
    </>
  );
}
