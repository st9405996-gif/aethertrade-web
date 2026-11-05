import { createFileRoute, Link } from "@tanstack/react-router";
import { getPublishedCmsPage, mergeCmsHead } from "@/lib/public-cms.functions";
import { meta } from "@/components/site/blocks";
import { LegalPage } from "@/components/site/legal-page";

export const Route = createFileRoute("/privacy-policy")({
  loader: async () => ({ cmsPage: await getPublishedCmsPage({ data: { slug: "privacy-policy" } }) }),
  head: ({ loaderData }) => mergeCmsHead(meta("Privacy Policy", "What information AETHER-TRADE collects through its website forms, how it is used and how to contact us."), loaderData?.cmsPage),
  component: PrivacyPage,
});

function PrivacyPage() {
  return (
    <LegalPage title="Privacy Policy." intro="This notice describes how the AETHER-TRADE website currently handles information submitted through its contact and operations-audit forms.">
      <h2>Information submitted through our forms</h2>
      <p>
        When you submit the Contact or Request an Operations Audit form, the information you provide is sent to AETHER-TRADE.
        This may include your name, business email address, company, country, inquiry category, selected automation,
        message, requirements and consent response. The website stores the inquiry in its operational database and
        generates a reference number so the request can be followed up.
      </p>
      <p>
        The website also sends an acknowledgment to the email address you provide and a notification to the AETHER-TRADE
        sales inbox. Email delivery is handled by Resend. Database and application infrastructure are provided by
        Supabase and Cloudflare. These providers process information as needed to host, secure and operate the service.
      </p>
      <p>Please do not submit confidential trade documents, passwords, payment details or sensitive shipment information.</p>
      <h2>How we use inquiry information</h2>
      <ul>
        <li>To review and respond to your inquiry.</li>
        <li>To contact you about the business request you submitted.</li>
        <li>To maintain inquiry status, reference and operational records.</li>
        <li>To protect the form from automated abuse and repeated submissions.</li>
      </ul>
      <h2>Technical and security information</h2>
      <p>
        Cloudflare hosts and protects the website. The form uses Cloudflare Turnstile and server-side rate limiting to
        reduce automated abuse. Hosting and security services may process technical request information such as IP address,
        browser details and request metadata.
      </p>
      <h2>Browser storage</h2>
      <p>
        The website stores your theme preference in your browser. The administrator workspace also stores its sign-in
        session in browser storage so an administrator can remain signed in. See the <Link to="/cookie-policy" className="text-primary underline">Cookie Policy</Link>
        for more information.
      </p>
      <h2>Sharing and sale</h2>
      <p>
        AETHER-TRADE does not sell personal information. Information is shared with the service providers described above
        only as needed to host the website, protect the forms, store inquiries and deliver email.
      </p>
      <h2>Retention and privacy requests</h2>
      <p>
        Inquiry records are retained in the operational system for business follow-up and recordkeeping. A fixed retention
        period has not yet been published. For a question about an inquiry or a request concerning your information, contact
        <a className="text-primary underline" href="mailto:sales@aethertrade.cloud"> sales@aethertrade.cloud</a> and include your inquiry reference if available.
      </p>
    </LegalPage>
  );
}
