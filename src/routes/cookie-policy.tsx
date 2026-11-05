import { createFileRoute } from "@tanstack/react-router";
import { getPublishedCmsPage, mergeCmsHead } from "@/lib/public-cms.functions";
import { meta } from "@/components/site/blocks";
import { LegalPage } from "@/components/site/legal-page";

export const Route = createFileRoute("/cookie-policy")({
  loader: async () => ({ cmsPage: await getPublishedCmsPage({ data: { slug: "cookie-policy" } }) }),
  head: ({ loaderData }) => mergeCmsHead(meta("Cookie Policy", "How AETHER-TRADE uses browser storage and essential website security features."), loaderData?.cmsPage),
  component: CookiePolicyPage,
});

function CookiePolicyPage() {
  return (
    <LegalPage title="Cookie & Browser Storage Policy." intro="AETHER-TRADE uses limited browser storage for essential website preferences and administrator sign-in. We do not currently use advertising or analytics tools.">
      <h2>Browser storage used by the website</h2>
      <ul>
        <li><strong className="text-foreground">Theme preference</strong>: remembers your light or dark display preference on this device.</li>
        <li><strong className="text-foreground">Administrator session</strong>: the protected administrator workspace stores sign-in session information in browser storage to maintain the authenticated session.</li>
      </ul>
      <h2>Form security</h2>
      <p>
        Contact and operations-audit forms use Cloudflare Turnstile and server-side rate limiting to help prevent automated
        abuse. Cloudflare may process technical browser and device signals as part of this security check.
      </p>
      <h2>Analytics and advertising</h2>
      <p>The website does not currently use advertising cookies or analytics tools.</p>
      <h2>Managing browser storage</h2>
      <p>
        You can clear website data through your browser settings. Clearing administrator session data will sign the
        administrator out; clearing the theme preference will restore the default display setting.
      </p>
    </LegalPage>
  );
}
