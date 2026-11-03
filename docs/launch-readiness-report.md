# AETHER-TRADE — Launch Readiness Report

Decision: **NOT SAFE TO PUBLISH.** Nothing has been deployed, published, or connected to any real account. Live inquiry delivery is disabled by default and must stay disabled until the staging runbook in section 5 passes.

## 1. Verified in this environment

| Check | Result |
|---|---|
| Unit tests (`bunx vitest run`) | 89 of 89 pass (9 files) |
| Typecheck (`tsc --noEmit`) | Pass |
| Production build (`vite build`) | Pass; Cloudflare Worker output generated |
| Bundle leak check | No server-only names (`CONFIRMATION_SECRET`, `TURNSTILE_SECRET_KEY`, `ABUSE_HASH_SECRET`, `OPS_HEALTH_TOKEN`, `SUPABASE_SERVICE`, provider URLs, quota RPC) in `.output/public` |
| Admin bundle | No `admin-workspace`, `auth-preview` or `reset-preview` chunks in production output; no admin or sign-in UI strings in public assets |
| Production dependency audit (`bun audit --production`) | 0 advisories across 287 packages |
| Full dependency audit | 1 moderate, dev-only (minimatch 3.x via ESLint's dependency chain). Accepted; see section 4 |
| Browser QA, final build, Workers runtime | 38 of 38 public responses 200 at 1280px and 390px; no horizontal overflow; no console or CSP errors; all nav/footer links 200; `/admin`, `/admin/inquiries`, `/auth`, `/reset-password`, unknown paths 404 |
| Demo form behaviour | Fast submission rejected (3-second rule); honeypot bot-style submission rejected with the generic message and no navigation; valid submission saved locally with a DEMO reference; demo notice visible |
| Forged confirmations (browser, both runtimes) | `token` forgeries, malformed tokens, wrong reference formats and the legacy `status=received` parameter all show "not confirmed" or "no saved inquiry"; never "received" |
| Live submission without challenge token | Rejected with the generic message; zero database writes to the mock |
| Health endpoint | Hidden (404) without a token and with a wrong token; with the correct token returns 503 and category-only fields; output checked for secret, domain, email and error-text leakage |
| Rate-limit SQL (`docs/database/004`) | Run against a real PostgreSQL 16.15 server with simulated Supabase roles: 5 allowed then refused; independent keys; window reset; exactly 5 of 20 concurrent calls allowed; `anon` and `authenticated` denied function and table; `service_role` allowed |
| Security headers | CSP, HSTS, frame denial, nosniff, referrer, permissions and COOP present on every Worker response; CSP checked in a real browser |

## 2. Not verified (do not claim these)

- **Real Supabase project:** no project connected. Migrations 001–004 not applied to any real database. Row-level security, anon denial in the real project, and service-role writes are untested there.
- **Real Resend account:** the sandbox cannot reach the Resend API. Team notification, submitter confirmation, and the sender-domain check are untested. The sender-domain parser assumes Resend's domain list shape (`data[].name`, `data[].status`) and must be confirmed against a real response.
- **Turnstile in a browser:** the widget path (script loading, rendering, token handoff) is implemented but untested, because the sandbox cannot reach Cloudflare. Server-side verification is tested only with mocked responses.
- **Successful live confirmation:** the "received" page is verified only for the negative cases. A positive end-to-end submission (valid challenge, quota, stored row, email, signed token accepted) has not been run.
- **Cloudflare deployment:** the Worker has run only under local workerd. Whether production exposes Worker secrets through `process.env` is unverified. If it does not, live mode stays off (fail-closed).
- **Mobile layout:** verified by viewport overflow checks only; no visual review of the forms at 390px.

## 3. What changed in this round

- **Thank-you verification:** the URL `status=received` parameter was removed. The page verifies an HMAC token (`CONFIRMATION_SECRET`, 24-hour expiry) through `verifyInquiryConfirmation`, which returns only a boolean and no inquiry data.
- **Abuse protection:** Turnstile (server-side verification of success, action `inquiry` and hostname), then an atomic per-client quota (5 per 10 minutes; salted hash of the client address). Both fail closed when unavailable. Missing tokens are rejected before any provider call. `elapsedMs` is documented as a weak heuristic only.
- **Live-mode readiness:** configuration validation is separated from delivery proof. `/api/inquiry-health` is token-protected, reports categories only, and states that it does not prove delivery.
- **CSP:** `connect-src 'self'` is correct for the current architecture, where the browser calls only same-origin server functions. Turnstile is the only external origin added (script, frame, connect). Supabase, Resend and the health check are server-to-server. Add a Supabase origin only if browser SDK access is adopted.
- **Admin bundle:** admin and sign-in UI moved behind a build-time `__ADMIN_DEMO__` constant injected from `VITE_ENABLE_ADMIN_DEMO` in the build environment. Dev preview keeps the demo. Route-shell metadata (titles) for `/admin/` remains in the public bundle; this is not UI code.
- **Robots:** `/api/` disallowed.

## 4. Accepted residual risks

- `'unsafe-inline'` remains in `script-src` and `style-src` because of the server-rendered hydration payload and theme bootstrap. Replace with nonces or hashes before launch if the framework supports it in this build.
- Minimatch 3.x (dev-only, via ESLint) carries a moderate denial-of-service advisory. Its fix is a major-version change to a transitive dependency, so an override is not made. Not in the deployed Worker.
- The confirmation token proves the server issued a reference, not that a database row exists. Adding a database existence check would strengthen this at the cost of a Supabase call on the thank-you page.
- `Cf-Connecting-IP` is trusted because the Worker runs behind Cloudflare. If the Worker is ever reachable without Cloudflare in front, rate limiting can be bypassed by header spoofing.
- Lint: pre-existing Prettier formatting issues remain in code outside this change. New files pass ESLint.

## 5. Go-live gates (in order; none passed yet)

1. **Staging Supabase:** apply `001`, `002`, `003`, `004`. Verify anon and authenticated cannot read or write `inquiries` or `submission_quotas` or call `consume_submission_quota`. Verify a duplicate `request_key` returns 409.
2. **Staging Resend:** verify a sending domain. Send a real team notification and a real confirmation. Confirm the health check's `sender_domain` reads `verified` against the real response shape.
3. **Staging Turnstile:** create a widget for the production hostname with action `inquiry`. Build with `VITE_TURNSTILE_SITE_KEY`. Confirm a valid submission passes and an invalid token is rejected.
4. **Staging Cloudflare Worker:** deploy a private build with secrets set (`CONFIRMATION_SECRET`, `TURNSTILE_SECRET_KEY`, `PUBLIC_SITE_HOSTNAME`, `ABUSE_HASH_SECRET`, `OPS_HEALTH_TOKEN`, Supabase and Resend values). Confirm secrets are visible at runtime, the health endpoint returns `healthy`, and HTTPS, HSTS and headers apply.
5. **End-to-end staging run:** one live submission produces a stored row, a team email, a confirmation email, and a thank-you page that verifies the signed token. Test a rate-limit trip (sixth submission from one client) and an unavailable-provider case.
6. **Legal:** rewrite the privacy, terms and cookie copy for live delivery (currently states forms store nothing). Complete legal review and publish a monitored privacy contact.
7. **WAF:** Cloudflare rate-limit rule on the form path as defence in depth. Set the production Worker name and domain.
8. **Sign-off:** re-run the full QA suite on the deployed staging host. Only then set `INQUIRY_DELIVERY_ENABLED=true` in production, with explicit approval.

## Staging database status (aethertrade-staging, ref mwzrbjeehhtcphxljgtd, ap-south-1)

Applied in order: 001_foundation, 002_existing_content, 003_inquiry_delivery, 004_submission_quota, 005_harden_table_grants, 006_revoke_trigger_function_execute.

Verified with real queries on the staging database:
- 14 public tables, all with RLS enabled.
- anon cannot read inquiries (permission denied), cannot call consume_submission_quota (permission denied).
- anon reads 68 published content rows and 0 draft rows.
- service_role quota function: allows 2 calls, refuses the 3rd (limit 2 test).
- Supabase security advisors: 3 INFO (service-only tables with RLS and no policies, by design) and 1 WARN (has_permission callable by authenticated, by design, scoped to auth.uid()).

Not yet done on staging: admin user provisioning, sign-in test, CMS editor UI, public pages reading from the database, Cloudflare Worker deployment.
