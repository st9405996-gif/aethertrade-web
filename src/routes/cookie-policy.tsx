import { createFileRoute } from "@tanstack/react-router";
import { getPublishedCmsPage, mergeCmsHead } from "@/lib/public-cms.functions";
import { meta } from "@/components/site/blocks";
import { LegalPage } from "@/components/site/legal-page";

export const Route = createFileRoute("/cookie-policy")({
  loader: async () => ({ cmsPage: await getPublishedCmsPage({ data: { slug: "cookie-policy" } }) }),
  head:  ({ loaderData }) => mergeCmsHead((() => meta("Cookie Policy", "How the AETHER-TRADE website uses cookies and browser storage."))(), loaderData?.cmsPage) ,
  component: CookiePolicyPage,
});

function CookiePolicyPage() {
  return (
    <LegalPage title="Cookie Policy." intro="We do not use advertising or analytics cookies. The site keeps a small amount of data in your browser so it works as expected.">
      <h2>What we store in your browser</h2>
      <ul>
        <li><strong className="text-foreground">Theme preference</strong> (key “aether-theme”): remembers light or dark mode. No personal information.</li>
        <li><strong className="text-foreground">Demo form copies</strong>: if you submit the Contact or Request a Demo form, the details you typed are kept in this browser's local storage so the demo can show a confirmation. They are not sent to AETHER-TRADE.</li>
      </ul>
      <h2>Cookies</h2>
      <p>The website itself does not set tracking cookies. Our hosting provider may use strictly necessary security measures to protect the service.</p>
      <h2>Analytics and advertising</h2>
      <p>None are used today. If that changes, this page will be updated first and, where required, we will ask for your consent.</p>
      <h2>Managing storage</h2>
      <p>You can clear site data at any time in your browser settings. The site will still work.</p>
    </LegalPage>
  );
}
