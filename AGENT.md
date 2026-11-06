# AETHER-TRADE — Admin Portal & CMS Stabilization

## Mission
Stabilize the existing Admin Portal and CMS without redesigning the public frontend. Make CMS operations truthful, persistent, secure, and correctly reflected on public pages. This is a sequential execution plan, not permission to make broad unreviewed changes.

## Non-negotiable execution rules
1. Work only on `stabilization/admin-cms-2026-11-06`; never commit directly to `main`.
2. One numbered task at a time. Verify it, update this ledger, report evidence, then proceed.
3. Never deploy, modify production, or write to production databases.
4. Before any staging write/upload/migration, state the exact operation, records, test data, and cleanup; obtain explicit approval.
5. Preserve existing frontend layout, styling, and working behaviour.
6. Do not weaken auth, authorization, RLS, CSP, validation, rate limits, or secrets handling.
7. Distinguish source inspection, unit tests, integration tests, and real browser/staging verification. Never claim a feature works based only on static code.
8. Re-check earlier audit findings against the current branch before changing code.
9. Make the smallest scoped change; add tests; review the diff; document rollback.
10. Stop when a product decision, credential, local runtime, or authorization is required.

## Prior audit findings to re-check
- CMS save/remove and other mutations may report success without confirming affected rows.
- Workspace loading reads content, inquiries, notes, media, revisions, audit, analytics, subscribers and global SEO; some secondary reads silently fall back to empty arrays.
- Media URLs use the Supabase public storage origin via the same-origin admin proxy; CSP currently says `img-src 'self' data: blob:`. Verify actual public image URL path and CSP interaction before changing it.
- Careers public reader/RLS may be incomplete.
- Admin route currently gates access to Super Admin only. Do not broaden roles without owner decision.
- Dynamic public CMS page route/slug support may be incomplete; root route has a fixed pathname-to-slug map.
- Public catalogue content may be split between CMS and `src/content/site-content.ts`.
- Logo is reportedly URL-based; favicon is hardcoded in `src/routes/__root.tsx`; font setting may be unused.
- Inquiry email delivery status, subscribers, revisions/restore, audit viewer, analytics, exports, filters, sorting, pagination, preview and connection health need practical verification.
- Anonymous insert policies for analytics and job applications require security review.
- Repository migrations and staging schema reportedly differ; do not apply migrations/reset staging without approval.
- Session data is stored in localStorage; review risk and alternatives without casually changing auth architecture.
- Earlier baseline reported 113/113 tests passing, 131 TypeScript errors and about 1,262 lint errors. These are historical, not current measurements.

## Product decisions — do not assume
1. Should non-Super-Admin roles enter the portal according to a permission matrix, or remain excluded?
2. Can admins create arbitrary public CMS pages, or edit only a fixed route set?
3. Is Careers intended to be a public live module?
4. Which modules genuinely require realtime updates rather than save-and-refresh?
5. Should logo and favicon be editable through Media Library?
6. Is per-inquiry email delivery status/history required?

## Roadmap

### Phase 0 — Baseline and project protection
- 0.1 Confirm branch, commit, clean/dirty working tree, and staging-only environment. Create/use dedicated branch.
- 0.2 Run existing tests, build, typecheck and lint; record exact output. Do not mass-fix unrelated debt.

### Phase 1 — Persistence correctness (P0)
- 1.1 Enumerate every mutation and audit HTTP status, error payload, returned rows and affected-row semantics.
- 1.2 Correct CMS content save/remove semantics and add success, zero-row, RLS, network and malformed-response tests.
- 1.3 Audit inquiry, media, role, subscriber, revision/restore and other mutation paths.
- 1.4 With explicit staging-write approval, verify save → database → reload → public reader → public refresh → fresh session; clean up exact test records.

### Phase 2 — Public synchronization and routing (P1)
- 2.1 Map public routes/fields to CMS records, tables, readers, components, fallbacks and cache behaviour.
- 2.2 Resolve conflicting CMS/static content sources field-by-field; retain intentional static content.
- 2.3 Verify Careers reader and RLS after confirming public Careers intent.
- 2.4 Implement approved fixed-route or dynamic-page model, slug validation, published-only reads, not-found and redirect behaviour.
- 2.5 Ensure sitemap and llms.txt contain only public, published, routable pages.

### Phase 3 — Media and branding (P1)
- 3.1 Verify real image URL path and CSP; use a narrow secure policy/proxy, never wildcard.
- 3.2 Audit picker, alt text, MIME/size validation, upload proxy, storage policies and partial-failure cleanup.
- 3.3 Verify media listing, selection persistence and public rendering.
- 3.4 Prevent deletion of referenced media or require explicit replacement; avoid orphaned metadata/objects.
- 3.5 Implement logo/favicon Media Library controls only after approval; verify font setting or mark unsupported after approval.

### Phase 4 — Roles and users (P0/P2)
- 4.1 Document complete role/action permission matrix; compare UI, server checks and RLS.
- 4.2 Enforce approved permissions at route, module and server-function levels; test direct URL and unauthorized writes.
- 4.3 Review hardcoded owner identity and replace only with approved secure model.
- 4.4 Audit invite, accept, role change, revoke and deactivation lifecycle.

### Phase 5 — Remaining modules (P2/P3)
Test and repair independently: inquiries and notifications; subscribers; insights/articles lifecycle; revisions and restore; audit log; analytics/consent; global settings; SEO; CSV exports; search/filters; sorting/pagination; draft preview; truthful connection readiness. Document expected behaviour and evidence for each.

### Phase 6 — Security and schema reproducibility (P0)
- 6.1 Review anonymous analytics/job-application insert policies, consent trust, abuse controls and rate limits.
- 6.2 Compare repository migrations with staging history/schema; produce drift/reproducibility plan. No reset/apply without approval and backup/rollback plan.
- 6.3 Review session storage/refresh and leaked-password protection; separate dashboard-only changes from code changes.

### Phase 7 — End-to-end acceptance
For every implemented feature record expected result, role, test data, operation, database evidence, UI evidence, refresh/fresh-session result, cleanup and status. Cover content lifecycle, routing, media, branding if approved, inquiries, notifications, subscribers, roles, revisions, analytics, exports, filters and pagination. Do not claim realtime unless demonstrated without manual refresh.

## Priority
- P0: data integrity, authorization/RLS, destructive data-loss/security risks.
- P1: core CMS persistence, public synchronization, media, routing.
- P2: admin operations, roles, revisions, SEO, settings, exports.
- P3: pagination, sorting, search, health indicators, genuinely required realtime.
- P4: unrelated type/lint debt after core functionality.

## Progress ledger
Allowed statuses: NOT STARTED, IN PROGRESS, PASS, FAIL, PARTIAL, BLOCKED, NEEDS DECISION, NOT TESTED.

| Task | Status | Evidence / files | Blocker / next action |
|---|---|---|---|
| 0.1 Branch and baseline | PARTIAL | Remote branch created from `b4219ca1104ccdca8b1c409c7c481774974d52a5`; repository `main` confirmed | Local working tree and environment target not visible; inspect local workspace |
| 0.2 Recheck baseline | BLOCKED | Package scripts identified: `npm test`, `npm run build`, `npm run lint`, `npm run seo:check` | Need local checkout/runtime to run commands |
| 1.1 Mutation audit | NOT STARTED | — | Start only after Phase 0 |
| 1.2 CMS mutation semantics | NOT STARTED | — | Depends on 1.1 |
| 1.3 Other mutation paths | NOT STARTED | — | Depends on 1.1 |
| 1.4 Persistence E2E | BLOCKED | — | Explicit staging-write approval required |
| 2.1 Source-of-truth map | NOT STARTED | — | — |
| 2.2 Public content sync | NOT STARTED | — | Depends on 2.1 |
| 2.3 Careers integration | NEEDS DECISION | — | Confirm public Careers intent |
| 2.4 Dynamic page routing | NEEDS DECISION | — | Arbitrary pages or fixed routes |
| 2.5 Sitemap and llms.txt | NOT STARTED | — | Depends on 2.4 |
| 3.1 CSP/image source | NOT STARTED | Static inspection: current CSP img-src is self/data/blob | Verify actual asset delivery before change |
| 3.2 Upload flow | NOT STARTED | — | Staging upload approval before live test |
| 3.3 Media selection/rendering | NOT STARTED | — | — |
| 3.4 Safe media deletion | NOT STARTED | — | — |
| 3.5 Branding | NEEDS DECISION | Favicon currently declared in root route | Confirm logo/favicon CMS control |
| 4.1 Permission matrix | NEEDS DECISION | Admin route currently checks Super Admin | Confirm intended role access |
| 4.2 Route/module guards | NOT STARTED | — | Depends on 4.1 |
| 4.3 Owner identity | NOT STARTED | — | — |
| 4.4 User lifecycle | NOT STARTED | — | — |
| 5.x Remaining Admin modules | NOT STARTED | — | — |
| 6.1 Anonymous write policies | NOT STARTED | — | — |
| 6.2 Migration reproducibility | NOT STARTED | — | Approval required for schema changes |
| 6.3 Authentication/password security | NOT STARTED | — | — |
| 7 End-to-end acceptance | NOT STARTED | — | Requires test access and approvals |

## Completion criteria
Production-ready only when all implemented features have documented behaviour; every mutation reports the real backend result; required data survives refresh/fresh sessions; CMS-managed public fields have one authoritative source; media operations are safe and verified; permissions match approved policy at UI/server/database; no known critical/high data-integrity or security defect remains; important workflows have practical staging evidence; untested items are disclosed; and build/tests/typecheck/lint are reported honestly. Never claim 100% based on an estimate.

## Session resume protocol
At session start: read this whole file, inspect branch/working tree/latest commit, review the last task evidence, and resume at the first incomplete dependency. At session end: update this ledger, list files/tests/results/blockers and state the exact next task. Never silently skip tasks.
