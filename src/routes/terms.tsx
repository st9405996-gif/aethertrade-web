import { createFileRoute } from "@tanstack/react-router";
import { meta } from "@/components/site/blocks";
import { LegalPage } from "@/components/site/legal-page";

export const Route = createFileRoute("/terms")({
  head: () => meta("Terms of Use", "Terms governing use of the AETHER-TRADE website."),
  component: TermsPage,
});

function TermsPage() {
  return (
    <LegalPage title="Terms of Use." intro="These terms cover use of this website. Any services would be governed by a separate written agreement.">
      <h2>About this website</h2>
      <p>
        This website describes AETHER-TRADE's platform and services. Each capability is labelled Available, In Development,
        Custom Build or Planned. Features labelled other than Available are not currently offered as working products.
      </p>
      <h2>No professional or compliance advice</h2>
      <p>
        Nothing on this site is customs clearance, a declaration submission, legal advice or a guarantee of regulatory
        compliance. AETHER-TRADE does not claim any government integration or approval.
      </p>
      <h2>Demonstration features</h2>
      <p>
        The Contact and Request a Demo forms are demonstrations. Submissions are not received by AETHER-TRADE and create
        no obligation for either party. Sample data shown on the site is illustrative.
      </p>
      <h2>Acceptable use</h2>
      <ul>
        <li>Do not submit confidential documents, personal data of others or unlawful content.</li>
        <li>Do not attempt to disrupt, overload or gain unauthorized access to the site.</li>
      </ul>
      <h2>Content and liability</h2>
      <p>
        Site content is provided "as is" for general information and may change without notice. To the extent permitted
        by law, AETHER-TRADE is not liable for decisions made in reliance on it. All content and branding remain the
        property of AETHER-TRADE.
      </p>
      <h2>Changes</h2>
      <p>We may update these terms. The date at the top shows the latest version.</p>
    </LegalPage>
  );
}
