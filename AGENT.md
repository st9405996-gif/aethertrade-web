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
- An earlier audit note reported 113/113 tests passing, 131 TypeScript errors and about 1,262 lint errors. That separate estimate was not reproduced and is superseded by the measured ZIP and Git-checkout baselines below.

## Baseline records

### Historical ZIP-extraction baseline (2026-11-06)
- The extracted project had no Git metadata.
- `bun run test`: PASS, 14 test files and 110 tests.
- `bun run build`: PASS.
- `bun run tsc --noEmit`: FAIL, 162 TypeScript errors.
- `bun run lint`: FAIL, 1,260 errors and 11 warnings.
- These are measurements of the ZIP extraction, not proof of the state of a Git checkout.

### Git-connected stabilization-branch baseline (2026-11-06)
- Repository: `st9405996-gif/aethertrade-web`; branch: `stabilization/admin-cms-2026-11-06`.
- Baseline commit: `d807cf71ccb01b3bf41c009b7004ac314fc75725` (`docs: add admin CMS stabilization execution plan and baseline ledger`).
- `bun install --frozen-lockfile`: PASS, 530 installs checked across 584 packages; no changes.
- `bun run test`: PASS, 14 test files and 110 tests.
- `bun run build`: PASS, exit code 0.
- `bun run tsc --noEmit`: FAIL, exit code 2, 162 TypeScript errors.
- `bun run lint`: FAIL, exit code 1, 1,260 errors and 11 warnings.
- Comparison with the historical ZIP baseline: test count, build result, TypeScript error count, and lint error/warning counts are identical.
- Read-only tree comparison before checkout found 206 matching blobs among 208 remote tracked files; the remote additionally contains `AGENTS.md`, and the local generated `src/routeTree.gen.ts` was newer. The exact ZIP extraction is preserved in the local-only `zip-import-snapshot-2026-11-06` branch at `9186af3`; it was not pushed.
- The production build regenerated `src/routeTree.gen.ts` to include the insights slug route. This is the only tracked working-tree change after baseline checks; it is retained for review and kept separate from the baseline documentation change.
- No staging or production credentials/environment were verified; no database or non-GitHub service was contacted. GitHub access was read-only for branch, history, and tree inspection.

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
| 0.1 Branch and baseline | PARTIAL | Verified origin matches `st9405996-gif/aethertrade-web`; branch `stabilization/admin-cms-2026-11-06` checked out at `d807cf71ccb01b3bf41c009b7004ac314fc75725`; clean before baseline build; ZIP preserved locally at `9186af3` | Staging-only environment/credentials are not present or verified; do not make external writes |
| 0.2 Recheck baseline | PASS | `bun install --frozen-lockfile` passed; `bun run test` 14 files/110 tests passed; `bun run build` passed; `bun run tsc --noEmit` 162 errors; `bun run lint` 1,260 errors/11 warnings. Results match measured ZIP baseline. | Preserve generated `src/routeTree.gen.ts` update; address general type/lint debt only after core tasks |
| 1.1 Mutation audit | PASS | Read-only inventory of workspace, server-function, auth, inquiry, analytics/quota, admin-user and proxy writes; findings below | Proceed to 1.2; keep other mutation defects scoped to 1.3 |
| 1.2 CMS mutation semantics | PASS | `src/components/admin/workspace-provider.tsx`, `src/lib/admin-mutations.ts`, `src/test/admin-mutations.test.ts`; focused tests 9/9; full suite 15 files/119 tests; production build passed; focused ESLint passed | `bun run tsc --noEmit` still fails with 131 project errors, including pre-existing errors in `workspace-provider.tsx`; no database/staging write was performed |
| 1.3 Other mutation paths | PASS | Inquiry/media/subscriber writes now validate returned rows; subscriber state uses the returned ID; media cleanup and invite compensation failures are explicit. Focused tests 16/16; full suite 16 files/126 tests; production build and focused ESLint passed | Full project checks remain non-green: TypeScript 131 errors; lint 1,265 errors/11 warnings versus the 1,260/11 baseline. No live database, storage, email, or authentication operations were performed; media-reference protection remains for 3.4 |
| 1.4 Persistence E2E | BLOCKED | — | Explicit staging-write approval required |
| 2.1 Source-of-truth map | PASS | Route, module, field, fallback, page override, SEO settings and cache behavior mapped below from `src/routes`, public readers, site components and static content. | Static source audit complete; no external access or live persistence was needed. Proceed to 2.2 to resolve verified synchronization inconsistencies without removing intentional static copy. |
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

## Actionable task checklist

Statuses below reflect the checked-out branch and evidence recorded above. A source change is not complete until its regression tests pass and the ledger is updated. Staging-only acceptance stays blocked until the precise operation and cleanup are approved.

| Task / status | Root cause or reason; affected files | Approach, regression evidence, and acceptance criteria |
|---|---|---|
| 0.1 / PARTIAL | Establish correct work branch and protect the extracted files; Git metadata, `AGENT.md`. | Keep work on the verified stabilization branch. Verify commit/status before each write; keep the local ZIP snapshot unpushed. Complete only when the permitted staging-only target is established without exposing credentials. |
| 0.2 / PASS | Baseline debt was previously historical/unverified; `package.json`, test/build/typecheck/lint configuration. | Run frozen install and all requested checks; recorded results above. Acceptance: commands and outcomes are recorded as ZIP vs Git-checkout results, without treating failing type/lint as passing. |
| 1.1 / PASS | Mutation handlers may ignore HTTP success-with-empty-result; audited `src/components/admin/workspace-provider.tsx`, `src/components/admin/admin-workspace.tsx`, `src/lib/admin-users.functions.ts`, `src/lib/inquiry.functions.ts`, `src/lib/inquiry-delivery.server.ts`, `src/lib/analytics.functions.ts`, `src/lib/submission-quota.server.ts`, and `src/server.ts`. | Read-only method/status/payload/returned-row/UI-path inventory is recorded below. Acceptance met for the source audit; backend/RLS behavior remains unverified without isolated staging. |
| 1.2 / PASS | CMS `save`/`remove` ignored returned rows and updated UI before confirming affected rows; `src/components/admin/workspace-provider.tsx`, `src/lib/admin-mutations.ts`, `src/test/admin-mutations.test.ts`. | Added shared validation for HTTP success, JSON shape, exactly one returned row, and matching ID. CMS create/update/delete now validate the backend representation before updating local state; save maps the returned row. Regression tests cover POST/PATCH/DELETE success, zero rows, RLS error, network failure, malformed successful JSON, and mismatched ID (9/9 focused tests). `bun run test`: 15 files/119 tests passed; `bun run build` passed; focused ESLint passed. `bun run tsc --noEmit` remains failing with 131 project errors; no diagnostic points to the new helper or test, while existing diagnostics remain in the provider. No live persistence was tested; 1.4 remains blocked pending explicit staging-write approval. |
| 1.3 / PASS | The audit found unchecked inquiry/media/subscriber returned rows, locally fabricated IDs after subscriber inserts, swallowed media-upload cleanup failures, media deletion before database confirmation, and an administrator invite error that claimed revocation without checking compensation. Changed `src/components/admin/workspace-provider.tsx`, `src/lib/admin-mutations.ts`, `src/lib/admin-users.functions.ts`, `src/lib/admin-user-compensation.ts`; added `src/test/admin-mutations.test.ts` and `src/test/admin-user-compensation.test.ts`. | Inquiry status and note writes, media metadata create/update/delete, and subscriber create/re-subscribe/unsubscribe now validate returned rows before local state changes. Subscriber state uses the database ID/consent result rather than a generated ID. Failed upload cleanup and post-metadata media cleanup report the partial outcome; failed invite compensation no longer claims revocation. Focused tests 16/16; full suite 16 files/126 tests; production build and focused ESLint passed. `bun run tsc --noEmit` still reports 131 project errors. Full lint reports 1,265 errors/11 warnings (baseline 1,260/11). No external services were contacted. Media reference detection and recoverable cleanup remain for 3.4; actual data persistence remains unverified under blocked task 1.4. |
| 1.4 / BLOCKED | End-to-end persistence needs a real isolated staging backend; admin CMS and public readers. | After explicit staging-write approval, use a unique test record, document exact fields/cleanup first, then verify save, database read, reload, public reader/refresh, fresh session, and cleanup. Acceptance: evidence for every step and no production access. |
| 2.1 / PASS | CMS-to-public source-of-truth and cache behavior were previously undocumented; inspected `src/routes`, `src/lib/public-cms.functions.ts`, `src/lib/public-content-records.functions.ts`, `src/lib/public-insights.functions.ts`, `src/lib/global-seo.functions.ts`, `src/lib/public-website-settings.functions.ts`, `src/components/site`, `src/content/site-content.ts`, `src/router.tsx`, and `src/server.ts`. | Route/module/field/readers/fallback/override/cache mapping is recorded below. Confirmed fixed CMS page slug set, separate module-record and insights pipelines, header/footer dynamic fallbacks, and hardcoded page sections. Acceptance met for static mapping. Live row-level visibility and CDN cache behavior remain unverified without configured Supabase/staging. |
| 2.2 / NOT STARTED | CMS and static catalogue/site content can overlap; `src/content/site-content.ts`, public routes/components, public content readers. | Compare field-by-field and retain intentionally static copy. Add rendering/source precedence tests. Acceptance: approved CMS fields have one authoritative source and published updates render without removing intentional static behavior. |
| 2.3 / NEEDS DECISION | Careers currently has static content and CMS page handling; `src/routes/careers.tsx`, `src/content/site-content.ts`, public settings reader, database policies. | Confirm whether Careers and job applications are intended live public modules. Then test enabled/disabled, published/draft and RLS behavior. Acceptance: behavior matches the owner decision; no inferred public exposure. |
| 2.4 / NEEDS DECISION | Public CMS page support uses a fixed route-to-slug map; `src/routes/__root.tsx`, `src/lib/public-cms.functions.ts`, `src/components/site/cms-page-renderer.tsx`, route tree. | Confirm fixed-route vs arbitrary-page model. Test valid/invalid slugs, draft/scheduled content, unknown route, not-found, canonical and redirect behavior. Acceptance: only approved routable published pages render. |
| 2.5 / NOT STARTED | Sitemap/llms generation must align with public, indexable, routable records; `src/server.ts`, `src/lib/seo-runtime.ts`, SEO scripts and public files. | Test draft, noindex, scheduled, invalid and non-routable records against both generated documents. Acceptance: only currently public/indexable/routable URLs are emitted. |
| 3.1 / NOT STARTED | Static CSP may block remote Storage images; `src/lib/security-headers.ts`, `src/server.ts`, `src/components/site/cms-page-renderer.tsx`, media URL builder. | Confirm actual URL flow using local/browser evidence before changing policy; test allowed same-origin proxy and disallowed arbitrary origins. Acceptance: required images load under a narrow CSP without wildcard sources. |
| 3.2 / NOT STARTED | Upload, metadata, and cleanup are multi-step and need validation; admin media UI/provider, `src/server.ts`, storage policy docs. | Test MIME/size/alt/path validation, auth, upload response, metadata response, and cleanup failure behavior. Acceptance: no false success or silent orphan; live upload only with explicit staging approval. |
| 3.3 / NOT STARTED | Media selection/URL persistence and public render are not proven by unit tests; admin media UI/provider and CMS renderer. | Add focused selection/serialization/render tests; verify local proxy URL and reload. Acceptance: selected media URL/alt text survive CMS reload and render under CSP. |
| 3.4 / NOT STARTED | Deleting referenced or partially deleted media can break pages or orphan objects; media provider, content fields, storage/database policies. | Determine reference detection and deletion order; test referenced/unreferenced objects and storage/metadata failure combinations. Acceptance: referenced media is protected/replaced, and partial failures are reported and recoverable. |
| 3.5 / NEEDS DECISION | Favicon is hardcoded and branding support may be incomplete; `src/routes/__root.tsx`, logo component, media UI/settings. | Confirm whether logo/favicon should be Media Library-managed and whether font settings are in scope. Test rendering only after decision. Acceptance: implement only approved controls and preserve existing media. |
| 4.1 / NEEDS DECISION | Admin route gates Super Admin while UI lists other roles; route, workspace model/provider, SQL policies. | Get approved role/action matrix; compare UI, server verification, and RLS. Add matrix tests. Acceptance: documented intended permissions agree at all three layers. |
| 4.2 / NOT STARTED | UI restrictions alone do not prove direct route/server/RLS authorization; admin route, server functions, role policies. | After 4.1 approval, enforce approved checks at route/module/server/database layers. Test direct URLs and unauthorized read/write for each role. Acceptance: denied actions stay denied regardless of UI. |
| 4.3 / NOT STARTED | Owner UUID is hardcoded in user-management server code and SQL; `src/lib/admin-users.functions.ts`, relevant database docs. | Trace all identity dependencies and propose approved owner identity model before changing it. Test owner/non-owner and unavailable config. Acceptance: no broadening or weakening of owner controls; no unapproved identity migration. |
| 4.4 / NOT STARTED | Invite/accept/role-change/revoke/deactivation is a multi-step lifecycle; `src/lib/admin-users.functions.ts`, auth/reset routes, role policies. | Test each lifecycle response, idempotency, rate limits, role assignment failure and cleanup. Acceptance: UI reflects verified account/role state and partial failure is explicit. |
| 5.1 / NOT STARTED | Inquiry status/assignment/notes and delivery visibility need backend-result verification; inquiry functions, delivery server, admin workspace/provider. | Test valid/invalid updates, note persistence, delivery errors and notification state. Acceptance: no false update/email-success indication; privacy and consent fields stay truthful. |
| 5.2 / NOT STARTED | Subscriber consent, re-subscribe, status and exports need lifecycle checks; workspace provider/admin workspace and subscriber policies. | Test valid consent, duplicate, unsubscribe, re-consent, RLS and returned-row behavior. Acceptance: no subscription without fresh consent and every status reflects database state. |
| 5.3 / NOT STARTED | Insights create/publish/slug/public-reader synchronization needs lifecycle evidence; admin editor, public insights functions/routes, publication helpers. | Test draft/published/scheduled/archived, slug validation, SEO and public visibility. Acceptance: only eligible content is publicly readable at the approved slug. |
| 5.4 / NOT STARTED | Revision snapshot and restore can silently fail or restore wrong fields; provider, revision UI, revision triggers/schema docs. | Test snapshot on update/delete and restore-as-draft with zero-row/RLS failures. Acceptance: restore creates a verified draft and preserves historical snapshot. |
| 5.5 / NOT STARTED | Audit viewer and mutation audit completeness need verification; admin workspace/provider, audit schema/triggers. | Test event creation, authorization, read ordering and unavailable-data state. Acceptance: successful mutations have accurate audit entries; access remains restricted. |
| 5.6 / NOT STARTED | Client consent and anonymous analytics write policy require trust-boundary review; analytics functions/rate limit/tracker, SQL policies. | Test consent absent/withdrawn, malformed input, rate limit, origin and insert-policy outcomes. Acceptance: only consent-valid, validated events are accepted; no policy weakening. |
| 5.7 / NOT STARTED | Website settings fallback can mask backend failure; settings functions, admin panel/provider, SQL view. | Test configured/unconfigured, non-2xx, malformed JSON and valid response states. Acceptance: unavailable/error is distinguishable from a genuine disabled setting. |
| 5.8 / NOT STARTED | SEO editor, root metadata, canonical/noindex and runtime documents may disagree; SEO functions/model, root route, server, sitemap scripts. | Test save/publish, metadata merge, canonical validation, robots and generated URL consistency. Acceptance: public metadata matches published settings and indexability rules. |
| 5.9 / NOT STARTED | CSV exports need safety and access verification; admin workspace/export helpers and role policy. | Test quoting, formula-leading cells, Unicode, filtered rows, disabled permissions and empty data. Acceptance: exported rows match authorized filters and CSV cells are safe. |
| 5.10 / NOT STARTED | Search/filter behavior and state combinations need coverage; admin workspace module views and workspace model. | Test combined search/status/category/type filters and empty/reset cases. Acceptance: result counts and displayed rows match the active filter. |
| 5.11 / NOT STARTED | Sorting/pagination are listed but not yet practically verified; admin tables and workspace readers. | Test stable ordering, page boundaries, empty and large result sets. Acceptance: no skipped/duplicated rows; expose only if intended and approved. |
| 5.12 / NOT STARTED | Admin preview may differ from public rendering; preview/editor and public CMS renderer. | Test representative fields/sections/images against public renderer and draft visibility. Acceptance: preview is clearly labeled and accurately represents the supported content schema without exposing drafts publicly. |
| 5.13 / NOT STARTED | “Connected” indicators may not represent live backend readiness; workspace status/admin connections and server health readers. | Test missing config, auth expiry, database errors and successful health. Acceptance: status is based on actual checks and never hardcoded success. |
| 5.14 / NEEDS DECISION | Careers/job applications public reader and RLS are reportedly incomplete; careers route/content, application functions/schema/policies. | Confirm Careers intent first. If live, test listing, submission validation, consent, spam controls and admin access using isolated data. Acceptance: only approved public/application behavior is exposed; staging writes require approval. |
| 6.1 / NOT STARTED | Anonymous analytics/job-application insert policies and consent trust need security review; foundation SQL, later grants/policies, analytics/application handlers and rate limits. | Trace grants, RLS, validation, abuse controls and secrets. Add policy/handler tests; do not apply SQL. Acceptance: least privilege and server-validated consent/abuse controls are evidenced from source and tests. |
| 6.2 / BLOCKED | Repository SQL and applied staging history/schema may drift; all `docs/database/*.sql` and `supabase/migrations/*.sql`. | Compare only with approved read-only staging schema/history access; produce drift and reproducibility plan. Acceptance: exact differences and rollback plan documented; no migration/reset without separate approval. |
| 6.3 / NOT STARTED | Session is stored in localStorage; expiry/refresh and password protection need review; workspace provider, auth/reset UI, server env docs. | Trace token lifecycle and leaked-password settings; test expiry, refresh, sign-out, recovery and invalid tokens. Acceptance: documented risk/control assessment; architectural/auth changes require approval. |
| 7 / BLOCKED | End-to-end acceptance requires isolated staging access and test identities/data; all touched workflows and approved modules. | For each workflow record role, test data, operation, DB/UI evidence, refresh/fresh-session result and cleanup. Acceptance: all approved workflows verified and all untested/blocked items disclosed; never infer production behavior from local checks. |

## Phase 1.1 — Read-only mutation audit

Static source audit only; no API write, email, storage operation, migration, or database request was performed. The same-origin proxy forwards the upstream HTTP response and does not establish affected-row semantics itself.

| Write path | Current response handling | Finding / disposition |
|---|---|---|
| CMS content create/update/delete (`workspace-provider.tsx` `save`/`remove`, `admin-workspace.tsx` editor/delete UI) | `call()` checks non-2xx and throws, but successful JSON/body shape is not checked by these callers. Requests ask PostgREST for `return=representation`; caller immediately updates local state and schedules a non-awaited reload. | **Confirmed P0 data-integrity bug for 1.2:** PostgREST can return an empty array for zero affected rows (including stale ID/RLS-hidden update/delete), yet UI reports success and removes/updates local state. |
| Global SEO update | Checks for an array with exactly one returned row before updating local settings. | Correctly rejects zero/multiple rows in source; keep as reference behavior. |
| Inquiry status update and internal note insert | `call()` rejects non-2xx, but returned arrays are ignored. Status update and one or more note inserts are sequential; a later note failure can follow an already-persisted status/earlier note. | 1.3: verify affected rows and expose/handle partial completion truthfully; no atomicity claim. |
| Media upload and catalogue insert | Upload checks HTTP status; catalogue insert checks returned row and ID. On catalogue failure it attempts object cleanup, but suppresses cleanup failure. | Success response is gated on catalogue ID. 1.3/3.2: failed cleanup can leave an orphaned object without a distinct cleanup-failure report. |
| Media metadata update and deletion | Metadata PATCH/DELETE checks HTTP failure through `call()` but not returned-row count. Delete removes Storage object before the catalogue DELETE is confirmed. | 1.3/3.4: zero-row metadata delete can be presented as success after object deletion; partial failure can orphan the catalogue row. |
| Subscriber insert, re-subscribe, and unsubscribe | `call()` rejects non-2xx, but response rows are ignored; new subscriber state may use a locally generated UUID rather than the database-returned row. | 1.3: zero-row update or malformed/empty successful insert can be presented as success with fabricated local state. |
| Administrator invite | Verifies owner, invite HTTP status and invited user ID; requires role RPC HTTP success and `{success:true}`. Compensating user DELETE is caught/ignored, while the error claims the invitation was revoked. | 1.3/4.4: verify and report compensation outcome; do not claim revocation if cleanup failed. Role update/revoke RPCs do require `{success:true}`. |
| Public inquiry persistence and notifications | Inquiry insert uses `return=minimal`; non-2xx throws, duplicate 409 performs a checked lookup and requires a reference. Email delivery is separately reported as booleans. | HTTP acceptance is checked, but returned-row/database reread is not part of this flow; local tests do not verify real persistence or email delivery. Keep this distinction in 1.3/7. |
| Analytics event and submission-quota RPC | Analytics requires HTTP success (`return=minimal`); quota requires HTTP success plus strict JSON boolean `true`/`false`, otherwise fails closed. | Response handling is explicit for their minimal/RPC contracts. Policy/security review remains in 6.1; no live writes tested. |
| Auth/password/recovery | Auth endpoints check HTTP success before updating client state; sign-out ignores remote logout failure but clears local session. | Review session lifecycle in 6.3; local sign-out is not proof of server revocation. |
| Job applications | Table/grants appear in SQL documentation; no application submit/read implementation was found under `src/`. | Incomplete surface for 5.14/6.1; do not claim job-application workflow works. |

### Completed first persistence fix (1.2)

Root cause: `call()` requested PostgREST representations for writes and threw on non-2xx, but `save()` and `remove()` discarded successful payloads. They updated React state before confirming affected rows, allowing false success for zero-row writes. `writeAdminRecord()` now validates HTTP status, response JSON, exactly one returned row, and matching ID for CMS create/update/delete; `save()` maps the returned row and `remove()` changes local state only after validation. Added focused response tests for POST/PATCH/DELETE success, empty arrays, RLS failure, network rejection, malformed successful JSON, and mismatched IDs. Verification: focused tests 9/9, full suite 15 files/119 tests, production build and focused ESLint passed. TypeScript remains non-green at 131 project errors; existing diagnostics include the provider but none point to the helper/tests or the changed mutation call sites. No staging/database writes were performed, so persistence across reloads/public readers is still unverified and belongs to blocked task 1.4.

## Phase 2.1 — Public content source-of-truth map

Static inspection only; no Supabase request, staging write, or public deployment was used.

| Surface | Authoritative source and route | Fallback/precedence and limitations |
|---|---|---|
| CMS pages | `getPublishedCmsPage()` reads `content_records` where `module=pages` and slug matches. Public/now-scheduled status is checked in the query and `isPublicAt`; the publishable key leaves visibility to RLS. Fields: title/body, SEO title/description, canonical, noindex, `fields.sections` (title/body/image URL/alt). `src/routes/__root.tsx` maps a fixed 18-slug set: `home`, `about`, `platform`, `how-it-works`, `solutions`, `industries`, `services`, `automations`, `custom-solutions`, `insights`, `partnerships`, `careers`, `faqs`, `contact`, `request-demo`, `privacy-policy`, `terms`, `cookie-policy`. | No arbitrary CMS route is generated. When a matching page has body/sections, the root renders its generic CMS page instead of the route component, except `contact`, `request-demo`, and `insights`, which render route content and append CMS sections. When content is empty, the route’s hardcoded page remains. A CMS page may still affect metadata without replacing route content. |
| Module records | `getPublishedContentRecords()` reads the same table with module allowlist `platform`, `services`, `solutions`, `industries`, `navigation`, `branding`, `automations`, `faqs`, `partnerships`; only Published/currently Scheduled and `noindex=false`, ordered by position/title, capped at 200. Platform uses title/body/availability and `fields.capabilities`; services uses title/body/availability and `fields.deliverables`; solutions uses slug/title/body plus `fields.challenges`/`benefits`; industries and partnerships use title/body; automations uses slug/title/category/body/availability and `fields.problem`, `workflow`, `deployment`, `integrations`; FAQs uses title/body. | `platform`, `services`, `solutions`, `industries`, `automations`, `faqs`, and `partnerships` routes use records when the returned array is nonempty, otherwise hardcoded arrays (`src/content/site-content.ts` or `src/lib/catalogue-preview.ts`). An empty published set therefore cannot currently suppress its static fallback. Most route hero/CTA copy remains hardcoded. |
| Insights | `getPublishedInsights()` reads `content_records` with `module=insights`, Published/currently Scheduled, `noindex=false`, ordered by position/slug, limit 100. `fields.author`, `geoSummary`, `aeoQuestions`, plus category/body/SEO, feed `/insights` and `/insights/$slug`; the slug reader returns not-found for ineligible records. | No public static fallback is rendered when there are no published insights. `INSIGHTS` from `site-content.ts` seeds draft demo workspace records; it is not the public fallback. |
| Header/footer navigation and branding | Header/Footer query module `navigation`; header uses category `header`, footer uses `footer`, `fields.visible`, footer `fields.group`, title label and body path. Footer separately uses first `branding` record for email/phone/address/social and `getPublicWebsiteSettings()` for Careers visibility. | Header/footer fall back to hardcoded `NAV_ITEMS`/`COLUMNS` only when there are no valid configured links. Branding details have no hardcoded fallback. `getPublicWebsiteSettings()` maps missing config, HTTP/parse/network errors to `careersEnabled=false`; the static footer fallback still contains Careers. The logo and favicon remain static. |
| Global SEO | Root loader reads the published `global_seo_settings` row (`id=1`, `is_published=true`) via `getGlobalSeoSettings()`; settings populate root metadata and organization/site JSON-LD. | Missing config, non-2xx, malformed data, and network errors all return `DEFAULT_GLOBAL_SEO`, so actual settings unavailability is indistinguishable from defaults. Per-page `mergeCmsHead()` layers CMS metadata over route metadata. |
| Cache/error behavior | `getRouter()` sets route preload stale time to zero; Header/Footer React Query calls do not set a custom stale time. Public reader fetches set no explicit cache TTL. `server.ts` applies `public, max-age=0, s-maxage=60` to generated sitemap/llms documents and `public, max-age=300` only to public media reads; admin proxy responses are `no-store`. | Route-loader content errors surface through the root error UI; Header/Footer queries fall back while query data is undefined. CDN behavior and server-function/hosting cache semantics require staging or deployment evidence. |

Verified synchronization follow-ups for 2.2/2.3/5.7: the FAQ page component falls back to static FAQs when its CMS record list is empty, but its head builder uses `items?.map(...) || FAQS`, where an empty array is truthy, yielding empty FAQ structured data while visible static FAQs render. Footer fallback includes Careers even though the settings reader may report disabled/unavailable. CMS pages can override whole hardcoded routes while their separate module-record loaders still run. The old `site-content.ts` header comment says content has not moved into the CMS, although several routes already use CMS records as nonempty overrides. No policy/owner decision was inferred; Careers enablement and fallback semantics remain for their listed decision tasks.

## Completion criteria
Production-ready only when all implemented features have documented behaviour; every mutation reports the real backend result; required data survives refresh/fresh sessions; CMS-managed public fields have one authoritative source; media operations are safe and verified; permissions match approved policy at UI/server/database; no known critical/high data-integrity or security defect remains; important workflows have practical staging evidence; untested items are disclosed; and build/tests/typecheck/lint are reported honestly. Never claim 100% based on an estimate.

## Session resume protocol
At session start: read this whole file, inspect branch/working tree/latest commit, review the last task evidence, and resume at the first incomplete dependency. At session end: update this ledger, list files/tests/results/blockers and state the exact next task. Never silently skip tasks. Task 1.4 remains blocked pending explicit approval for exact isolated staging writes and cleanup. Phase 2.1 is complete; next is 2.2, while 1.4 remains blocked.
