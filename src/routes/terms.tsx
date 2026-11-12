import { createFileRoute } from "@tanstack/react-router";
import { getPublishedCmsPage, mergeCmsHead, cmsHero } from "@/lib/public-cms.functions";
import { CmsPageSections } from "@/components/site/cms-page-renderer";
import { meta } from "@/components/site/blocks";
import { LegalPage } from "@/components/site/legal-page";

export const Route = createFileRoute("/terms")({
  loader: async () => ({ cmsPage: await getPublishedCmsPage({ data: { slug: "terms" } }) }),
  head: ({ loaderData }) =>
    mergeCmsHead(
      meta(
        "Terms of Use",
        "Terms governing access to and use of the AETHER-TRADE website and inquiry forms.",
      ),
      loaderData?.cmsPage,
      { fallbackPath: "/terms" },
    ),
  component: TermsPage,
});

function TermsPage() {
  const { cmsPage } = Route.useLoaderData();
  return (
    <>
      <LegalPage
        {...cmsHero(cmsPage, {
          title: "Terms of Use.",
          description:
            "These terms cover use of this website. Any services or implementation work would be governed by a separate written agreement.",
        })}
        cmsBody={cmsPage?.body}
      >
        <h2>About this website</h2>
        <p>
          This website describes AETHER-TRADE's platform and services. Each capability is labelled
          Available, In Development, Custom Build or Planned. Features labelled other than Available
          are not currently offered as generally available working products.
        </p>
        <h2>No customs clearance or professional advice</h2>
        <p>
          Nothing on this site is customs clearance, a declaration submission, legal advice or a
          guarantee of regulatory compliance. AETHER-TRADE does not claim any government integration
          or approval unless expressly stated in a separate written agreement.
        </p>
        <h2>Contact and operations-audit inquiries</h2>
        <p>
          The Contact and Request an Operations Audit forms accept submissions only when secure
          server-side delivery is enabled. The form indicates whether it is currently accepting
          submissions. If it is unavailable, information entered into it is not submitted or stored;
          use the published email links on the Contact page instead. When live delivery is enabled,
          a submission sends the information you provide to AETHER-TRADE for review and may generate
          an email acknowledgment and a team notification. A submission is a request for contact only;
          it does not create a service agreement, guarantee acceptance or establish a customer
          relationship.
        </p>
        <p>
          Do not submit confidential trade documents, passwords, payment details or sensitive
          shipment information.
        </p>
        <h2>Acceptable use</h2>
        <ul>
          <li>Provide information that you are authorized to share.</li>
          <li>
            Do not submit unlawful content or personal data belonging to another person without
            authorization.
          </li>
          <li>Do not attempt to disrupt, overload or gain unauthorized access to the website.</li>
        </ul>
        <h2>Content and liability</h2>
        <p>
          Site content is provided for general information and may change without notice. You remain
          responsible for independently verifying operational, customs, legal and regulatory
          decisions. To the extent permitted by law, AETHER-TRADE is not liable for decisions made
          solely in reliance on general website content. All website content and branding remain the
          property of their respective rights holders.
        </p>
        <h2>Changes</h2>
        <p>
          These terms may be updated as the website and services change. The latest version will be
          published on this page.
        </p>
      </LegalPage>
      <CmsPageSections page={cmsPage} />
    </>
  );
}
