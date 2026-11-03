import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { PageHero } from "@/components/site/section";
import { CtaBand } from "@/components/site/cta-band";
import { useWorkspace } from "@/components/admin/workspace-provider";
import { verifyInquiryConfirmation } from "@/lib/inquiry.functions";

export const Route = createFileRoute("/thank-you")({
  validateSearch: (search: Record<string, unknown>) => ({
    reference: typeof search["reference"] === "string" ? search["reference"] : undefined,
    // A token is signed by the server. The page never trusts the URL alone; see verifyInquiryConfirmation.
    token: typeof search["token"] === "string" ? search["token"] : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Thank You — AETHER-TRADE" },
      { name: "description", content: "Check the status of your AETHER-TRADE demo inquiry." },
      { property: "og:title", content: "Thank You — AETHER-TRADE" },
      { property: "og:description", content: "AETHER-TRADE demo inquiry confirmation." },
      { name: "robots", content: "noindex, nofollow" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ThankYouPage,
});

function ThankYouPage() {
  const { reference, token } = Route.useSearch();
  const { data, ready } = useWorkspace();
  const verify = useServerFn(verifyInquiryConfirmation);
  const hasServerConfirmation = Boolean(reference && token);

  const confirmation = useQuery({
    queryKey: ["inquiry-confirmation", reference, token],
    queryFn: () => verify({ data: { reference: reference ?? "", token: token ?? "" } }),
    enabled: hasServerConfirmation,
    retry: false,
    staleTime: Infinity,
  });

  if (hasServerConfirmation) {
    if (confirmation.isPending) {
      return (
        <>
          <PageHero
            eyebrow="Confirming"
            title="Checking your submission."
            description="Please wait while we confirm your reference."
          />
          <CtaBand
            title="Explore meanwhile."
            description="See how the platform reviews documents, or browse the automation catalogue."
          />
        </>
      );
    }
    if (confirmation.data?.confirmed === true) {
      return (
        <>
          <PageHero
            eyebrow="Inquiry received"
            title="Thank you. Your inquiry was received."
            description={`Reference: ${reference}. Please keep this number for your records. Please do not send confidential trade documents or sensitive shipment details.`}
          />
          <CtaBand
            title="Explore meanwhile."
            description="See how the platform reviews documents, or browse the automation catalogue."
          />
        </>
      );
    }
    return (
      <>
        <PageHero
          eyebrow="Not confirmed"
          title="We could not confirm this submission."
          description="This page does not show a verified reference. If you submitted an inquiry, please try submitting the form again."
        />
        <CtaBand
          title="Explore meanwhile."
          description="See how the platform reviews documents, or browse the automation catalogue."
        />
      </>
    );
  }

  // Demo-mode confirmation: stored only in this browser, never delivered.
  const found = ready && data.inquiries.some((r) => r.reference === reference);
  return (
    <>
      <PageHero
        eyebrow={found ? "Demo saved" : "Demo confirmation"}
        title={
          found ? "Your demo inquiry is saved in this browser." : "No saved inquiry confirmed."
        }
        description={
          found
            ? `Reference: ${reference}. This was a test only. AETHER-TRADE has not received a database submission or email.`
            : "Submit the Contact or Request a Demo form to test the inquiry workflow. No live delivery is configured."
        }
      />
      <CtaBand
        title="Explore meanwhile."
        description="See how the platform reviews documents, or browse the automation catalogue."
      />
    </>
  );
}
