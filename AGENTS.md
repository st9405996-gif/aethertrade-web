<!-- LOVABLE:BEGIN -->

> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.

<!-- LOVABLE:END -->

# AETHER-TRADE — Technical Rules

- **Stack is TanStack Start (Lovable), not Next.js.** The Build Pack's
  TECHNICAL_ARCHITECTURE.md recommends Next.js but allows a compatible
  alternative with a documented trade-off. Lovable runs TanStack Start v1:
  SSR for SEO pages, `createServerFn` server logic, Tailwind v4 and shadcn/ui.
  Backend connection is user-owned External Supabase through project settings;
  preserve generated integration boundaries rather than hand-building clients.
  Do not port the project to Next.js.
- **Design system lives in `src/styles.css`** — all colors are oklch semantic
  tokens (midnight navy dark / warm white light themes, `.dark`/`.light`
  classes on `<html>`). Never hardcode colors in components; add new tokens
  to both theme blocks and `@theme inline`.
- **Typography is Geist Sans + Geist Mono** via `@fontsource` packages,
  imported in `src/routes/__root.tsx`. Mono (`eyebrow` utility) is for
  technical labels, data and catalogue metadata.
- **Theme switching**: pre-hydration bootstrap script sets the initial class
  (system preference first visit, `aether-theme` in localStorage after).
  Don't add another theme mechanism.
- **Product truthfulness in all copy**: availability statuses (Available /
  In Development / Custom Build / Planned) must label every capability and
  catalogue entry; never invent customers, testimonials, statistics,
  certifications, customs clearance or government-integration claims. Sample
  data in demos must be marked illustrative.
- **Launch-scope excludes** customer portal, shipment console, customer
  automation controls, proposal/order portal, support portal, live regulatory
  tracker and public upload of trade documents — don't add them.
- The full content spec is the uploaded Build Pack (page blueprint, sitemap,
  functional requirements, SEO plan, QA checklist); `roadmap.md` tracks the
  milestone plan.
- App-internal backend logic uses TanStack server functions; external callbacks
  use verified server routes, not new Supabase Edge Functions, to preserve the
  platform's supported server boundaries.
- Keep architecture audit documents under `docs/` and approval plans under
  `.lovable/`; proposals must remain distinct from implemented capabilities.
- Disconnected administration uses the shared WorkspaceProvider browser-only
  adapter; it is never an auth authority or a substitute for connected RLS.
  Public inquiry submissions run through `submitInquiry` (src/lib/inquiry.functions.ts),
  which validates on the server (honeypot, elapsed time, idempotency key). Persistence and
  email run only from `src/lib/inquiry-delivery.server.ts` when every setting in
  `.env.example` is present; otherwise the site stays in demo mode and stores nothing.
  The browser learns the mode from `getInquiryDeliveryMode`. Never import the delivery module
  from client code. Live submissions require a Turnstile token and pass a server-side quota
  (docs/database/004); any unavailable check fails closed. The thank-you page never trusts the URL:
  it calls `verifyInquiryConfirmation`, which checks an HMAC token signed with CONFIRMATION_SECRET.
  `/api/inquiry-health` is hidden unless OPS_HEALTH_TOKEN is presented; it reports categories only.
- Keep unapplied external database SQL under `docs/database`; migrate
  to generated integration clients only after the official account connection.
- Security fixes for transitive packages use `overrides` in `package.json`; keep them until upstream TanStack/Tailwind releases include the fixed versions, then remove.
- Public-only mode: the admin demo and its `/auth` and `/reset-password` previews are compiled out of
  production builds via the `__ADMIN_DEMO__` constant (vite.config.ts, from the build environment
  variable `VITE_ENABLE_ADMIN_DEMO`). Dev preview keeps them. Routes also return 404 at runtime.
  Admin components are loaded only through dynamic imports guarded by `import.meta.env.DEV || __ADMIN_DEMO__`
  written inline, so the bundler can remove them. Do not move that condition into a separate variable.
  Inquiry live mode: see the abuse-protection and health rules above; never enable without staging tests.
