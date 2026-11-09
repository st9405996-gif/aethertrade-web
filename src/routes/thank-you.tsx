import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { PageHero } from "@/components/site/section";
import { CtaBand } from "@/components/site/cta-band";
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
  const verify = useServerFn(verifyInquiryConfirmation);
  const hasServerConfirmation = Boolean(reference && token);

  const confirmation = useQuery({
    queryKey: ["inquiry-confirmation", reference, token],
    queryFn: () => verify({ data: { reference: reference ?? "", token: token ?? "" } }),
    enabled: hasServerConfirmation,
    retry: false,
    staleTime: Infinity,
  });

  if (hasServerConfirmation && confirmation.isPending) {
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

  if (hasServerConfirmation && confirmation.data?.confirmed === true) {
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
        eyebrow="Confirmation unavailable"
        title={
          hasServerConfirmation
            ? "We could not verify this confirmation."
            : "Your submission status is unavailable."
        }
        description={
          reference
            ? `Reference: ${reference}. Your inquiry may still have been received. Check your email for a confirmation message. Please do not submit the same inquiry again solely because this page could not verify it.`
            : "If you submitted an inquiry, it may still have been received. Check your email for a confirmation message. Please do not submit it again solely because this page could not verify it."
        }
      />
      <CtaBand
        title="Explore meanwhile."
        description="See how the platform reviews documents, or browse the automation catalogue."
      />
    </>
  );
}
