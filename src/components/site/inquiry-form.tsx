import { useState, useRef, useEffect, type FormEvent } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { ArrowRight, ShieldCheck, AlertCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { inquirySchema } from "@/lib/workspace-model";
import { submitInquiry, getInquiryDeliveryMode } from "@/lib/inquiry.functions";
import { CATALOGUE_PREVIEW } from "@/lib/catalogue-preview";
import { loadTurnstile, TURNSTILE_SITE_KEY } from "@/lib/turnstile-client";
import { trackAnalyticsEvent } from "@/lib/analytics.functions";
import { hasAnalyticsConsent } from "@/lib/consentmanager-analytics";

export function InquiryForm({
  kind,
  automation = "",
  initialShipmentVolume,
}: {
  kind: "contact" | "demo";
  automation?: string | undefined;
  initialShipmentVolume?: string | undefined;
}) {
  const navigate = useNavigate();
  const submit = useServerFn(submitInquiry);
  const readMode = useServerFn(getInquiryDeliveryMode);
  const trackEvent = useServerFn(trackAnalyticsEvent);
  // Defaults to the demo notice until the server reports live delivery, so the page never
  // claims delivery that has not been confirmed.
  const { data: delivery } = useQuery({
    queryKey: ["inquiry-delivery-mode"],
    queryFn: () => readMode(),
    staleTime: Infinity,
  });
  const isLive = delivery?.mode === "live";
  const mountedAt = useRef<number | null>(null);
  const [challengeToken, setChallengeToken] = useState("");
  const challengeRef = useRef<HTMLDivElement | null>(null);
  const widgetId = useRef<string | null>(null);
  const challengeRequired = isLive && Boolean(TURNSTILE_SITE_KEY);
  useEffect(() => {
    mountedAt.current = performance.now();
  }, []);
  useEffect(() => {
    if (!challengeRequired || !TURNSTILE_SITE_KEY || !challengeRef.current) return;
    const siteKey = TURNSTILE_SITE_KEY;
    const element = challengeRef.current;
    let cancelled = false;
    loadTurnstile()
      .then((api) => {
        if (cancelled) return;
        widgetId.current = api.render(element, {
          sitekey: siteKey,
          action: "inquiry",
          callback: (token) => setChallengeToken(token),
          "expired-callback": () => setChallengeToken(""),
          "error-callback": () => setChallengeToken(""),
        });
      })
      .catch(() => setChallengeToken(""));
    return () => {
      cancelled = true;
    };
  }, [challengeRequired]);
  const [shipmentVolume, setShipmentVolume] = useState(initialShipmentVolume ?? "");
  const [values, setValues] = useState({
    kind,
    name: "",
    email: "",
    company: "",
    country: "",
    category: "General inquiry",
    automation,
    message: automation === "shipment-readiness" ? "I would like this for my business." : "",
    requirements: automation === "shipment-readiness" ? "I would like to explore Shipment Readiness for my shipments." : "",
    consent: false,
    website: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const requestId = useRef<string | null>(null);
  const lock = useRef(false);
  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (lock.current) return;
    if (!isLive) {
      setError("The inquiry service is temporarily unavailable. Please try again later.");
      return;
    }
    if (kind === "demo" && values.automation === "shipment-readiness" && !shipmentVolume) {
      setErrors({ shipmentVolume: "Select your approximate monthly shipment volume." });
      return;
    }
    const submissionValues = {
      ...values,
      requirements: values.automation === "shipment-readiness" && shipmentVolume
        ? values.requirements + "\nMonthly shipment volume: " + shipmentVolume
        : values.requirements,
    };
    const parsed = inquirySchema.safeParse(submissionValues);
    if (!parsed.success) {
      const issues = parsed.error.issues;
      setErrors(Object.fromEntries(issues.map((i) => [String(i.path[0]), i.message])));
      if (issues.some((i) => i.path[0] === "website"))
        setError("Your submission could not be accepted. Please check the form and try again.");
      return;
    }
    if (challengeRequired && !challengeToken) {
      setError("Please complete the security check before sending.");
      return;
    }
    setErrors({});
    setError("");
    setBusy(true);
    lock.current = true;
    requestId.current ??= crypto.randomUUID();
    const id = requestId.current;
    const elapsedMs = mountedAt.current === null ? 0 : performance.now() - mountedAt.current;
    try {
      const result = await submit({
        data: {
          ...parsed.data,
          requestKey: id,
          elapsedMs,
          turnstileToken: challengeToken || undefined,
        },
      });
      if (result.mode !== "live") {
        throw new Error(
          "The inquiry service is temporarily unavailable. Your details were not saved.",
        );
      }
      // Track only a consented conversion event; never send the form fields or contact details.
      if (hasAnalyticsConsent()) {
        void trackEvent({
          data: {
            eventType: kind === "demo" ? "demo_conversion" : "contact_conversion",
            pagePath: location.pathname,
            automationSlug: parsed.data.automation || undefined,
            consent: true,
          },
        }).catch(() => null);
      }
      // Only navigate after the server confirms persistence and returns its reference.
      await navigate({
        to: "/thank-you",
        search: { reference: result.reference, token: result.confirmationToken ?? undefined },
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Your submission was not saved. Please try again.");
    } finally {
      setBusy(false);
      lock.current = false;
      // Turnstile tokens are single-use: reset after every attempt.
      if (widgetId.current && window.turnstile) window.turnstile.reset(widgetId.current);
      setChallengeToken("");
    }
  }
  function field(
    name: "name" | "email" | "company" | "country",
    label: string,
    placeholder: string,
  ) {
    return (
      <label className="grid gap-2 text-sm" key={name}>
        {label}
        <Input
          name={name}
          autoComplete={
            name === "name"
              ? "name"
              : name === "email"
                ? "email"
                : name === "company"
                  ? "organization"
                  : "country-name"
          }
          value={values[name]}
          placeholder={placeholder}
          type={name === "email" ? "email" : "text"}
          aria-invalid={!!errors[name]}
          aria-describedby={errors[name] ? `${name}-error` : undefined}
          onChange={(e) => setValues({ ...values, [name]: e.target.value })}
        />
        {errors[name] && (
          <span id={`${name}-error`} className="text-destructive">
            {errors[name]}
          </span>
        )}
      </label>
    );
  }
  return (
    <section className="container-page grid gap-12 py-12 lg:grid-cols-[1fr_1.6fr] lg:py-16">
      <aside>
        <p className="eyebrow">A focused conversation</p>
        <h2 className="mt-4 text-2xl font-semibold">Start with your operational challenge.</h2>
        <p className="mt-4 text-muted-foreground">
          Share the workflow you want to improve. Please do not include confidential trade documents
          or sensitive shipment details.
        </p>
        <div className="mt-8 border-t border-border pt-6">
          <ShieldCheck className="mb-3 size-6 text-primary" />
          <p className="text-sm text-muted-foreground">
            Human review stays at the center of consequential trade decisions.
          </p>
        </div>
      </aside>
      <form onSubmit={handleSubmit} noValidate className="space-y-6">
        {!isLive && (
          <div className="flex gap-3 border-l-2 border-warning bg-warning/10 p-4 text-sm">
            <AlertCircle className="size-5 shrink-0 text-warning" />
            <p>
              <strong>Online inquiry form is temporarily unavailable.</strong>
              <br />
              This form has not submitted or stored your details. Please contact our team directly:
              {" "}
              <a
                href={`mailto:${kind === "demo" ? "sales" : "info"}@aethertrade.cloud?subject=${encodeURIComponent(kind === "demo" ? "AETHER-TRADE workflow demo request" : "AETHER-TRADE inquiry")}`}
                className="font-medium text-primary underline underline-offset-4"
              >
                {kind === "demo" ? "sales@aethertrade.cloud" : "info@aethertrade.cloud"}
              </a>
              .
            </p>
          </div>
        )}
        <div className="grid gap-5 sm:grid-cols-2">
          {field("name", "Name *", "Your name")}
          {field("email", "Business email *", "you@company.com")}
          {field("company", "Company *", "Company name")}
          {field("country", "Country *", "Country")}
        </div>
        {kind === "demo" ? (
          <>
            <label className="grid gap-2 text-sm">
              Selected automation
              <select
                aria-label="Selected automation"
                className="h-10 rounded-md border border-input bg-background px-3"
                value={values.automation}
                onChange={(e) => setValues({ ...values, automation: e.target.value })}
              >
                <option value="">General platform demo</option>
                <option value="product-intelligence">Product Intelligence</option>
                <option value="shipment-readiness">Shipment Readiness</option>
                {CATALOGUE_PREVIEW.map((r) => (
                  <option key={r.slug} value={r.slug}>
                    {r.name}
                  </option>
                ))}
              </select>
            </label>
            {values.automation === "shipment-readiness" && (
              <label className="grid gap-2 text-sm">
                Monthly shipment volume *
                <select className="h-10 rounded-md border border-input bg-background px-3" value={shipmentVolume}
                  onChange={(event) => { setShipmentVolume(event.target.value); setErrors((current) => ({ ...current, shipmentVolume: "" })); }}>
                  <option value="">Select monthly volume</option><option value="1–10">1–10</option><option value="11–50">11–50</option><option value="50+">50+</option>
                </select>
                {errors["shipmentVolume"] && <span className="text-destructive">{errors["shipmentVolume"]}</span>}
              </label>
            )}
            <label className="grid gap-2 text-sm">
              Business requirements *
              <Textarea
                value={values.requirements}
                rows={4}
                onChange={(e) => setValues({ ...values, requirements: e.target.value })}
                placeholder="Describe your current workflow and what you want to improve"
              />
              {errors["requirements"] && (
                <span className="text-destructive">{errors["requirements"]}</span>
              )}
            </label>
          </>
        ) : (
          <label className="grid gap-2 text-sm">
            Inquiry category
            <select
              className="h-10 rounded-md border border-input bg-background px-3"
              value={values.category}
              onChange={(e) => setValues({ ...values, category: e.target.value })}
            >
              {[
                "General inquiry",
                "Sales",
                "Platform",
                "Automation",
                "Services",
                "Partnership",
              ].map((x) => (
                <option key={x}>{x}</option>
              ))}
            </select>
          </label>
        )}
        <label className="grid gap-2 text-sm">
          {kind === "demo" ? "Additional message *" : "Message *"}
          <Textarea
            rows={5}
            value={values.message}
            onChange={(e) => setValues({ ...values, message: e.target.value })}
            placeholder="What would you like to discuss?"
          />
          {errors["message"] && <span className="text-destructive">{errors["message"]}</span>}
        </label>
        <label className="hidden" aria-hidden="true">
          Website
          <Input
            tabIndex={-1}
            autoComplete="off"
            value={values.website}
            onChange={(e) => setValues({ ...values, website: e.target.value })}
          />
        </label>
        <label className="flex items-start gap-3 text-sm">
          <input
            type="checkbox"
            className="mt-1 accent-primary"
            checked={values.consent}
            onChange={(e) => setValues({ ...values, consent: e.target.checked })}
          />
          <span>
            I consent to processing these details as described in the{" "}
            <Link to="/privacy-policy" className="text-primary underline">
              Privacy Policy
            </Link>
            . *
          </span>
        </label>
        {errors["consent"] && <p className="text-sm text-destructive">{errors["consent"]}</p>}
        {error && (
          <p role="alert" className="border border-destructive/40 p-3 text-sm text-destructive">
            {error}
          </p>
        )}
        {challengeRequired && <div ref={challengeRef} />}
        <Button
          variant="hero"
          size="lg"
          disabled={busy || !isLive || (challengeRequired && !challengeToken)}
          type="submit"
        >
          {busy ? <Loader2 className="animate-spin" /> : <ArrowRight />}
          {busy
            ? isLive
              ? "Sending…"
              : "Validating…"
            : isLive
              ? "Send inquiry"
              : delivery === undefined
                ? "Checking availability…"
                : "Temporarily unavailable"}
        </Button>
      </form>
    </section>
  );
}
