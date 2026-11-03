import { createFileRoute, Link } from "@tanstack/react-router";
import { meta } from "@/components/site/blocks";
import { LegalPage } from "@/components/site/legal-page";

export const Route = createFileRoute("/privacy-policy")({
  head: () => meta("Privacy Policy", "What information the AETHER-TRADE website handles, where it is kept and your choices."),
  component: PrivacyPage,
});

function PrivacyPage() {
  return (
    <LegalPage title="Privacy Policy." intro="This page explains, in plain terms, what the AETHER-TRADE website does with information today.">
      <h2>Current status of our forms</h2>
      <p>
        The Contact and Request a Demo forms are currently <strong className="text-foreground">demonstration forms</strong>.
        When you submit one, our server checks that the fields are filled in correctly and then discards them. Nothing is
        stored on our systems, no email is sent and AETHER-TRADE does not receive your message. A copy is kept only in
        your own browser so the demo can show a confirmation.
      </p>
      <h2>Information you enter</h2>
      <ul>
        <li>Name, business email, company, country and the text of your message or requirements.</li>
        <li>Your privacy consent choice.</li>
      </ul>
      <p>Please use illustrative details and never include confidential trade documents or shipment information.</p>
      <h2>Information stored in your browser</h2>
      <ul>
        <li>Your light/dark theme preference.</li>
        <li>Copies of demo form submissions you make on this device.</li>
      </ul>
      <p>This stays on your device, is not sent to us and can be removed by clearing site data in your browser. See the <Link to="/cookie-policy" className="text-primary underline">Cookie Policy</Link>.</p>
      <h2>Technical information</h2>
      <p>
        Like any website, our hosting provider processes standard request details (such as IP address, browser type and
        pages requested) to deliver pages and protect the service. We do not use advertising or analytics cookies.
      </p>
      <h2>Sharing and sale</h2>
      <p>We do not sell personal information and do not share form details with third parties.</p>
      <h2>When this changes</h2>
      <p>
        Before our forms start sending inquiries to AETHER-TRADE, this policy will be updated to describe what is stored,
        how long it is kept, who can access it and how to ask for it to be corrected or deleted.
      </p>
      <h2>Contact</h2>
      <p>A dedicated privacy contact will be published here before inquiries are collected.</p>
    </LegalPage>
  );
}
