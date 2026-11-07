# AETHER-TRADE CMS and Admin Audit

Date: 2026-11-07
Scope: repository, read-only production HTTP/browser checks, local tests/builds
Branch: `stabilization/admin-cms-2026-11-06`
Database access: none; staging and production schema state are unverified

## Executive summary

The repository contains a substantial Supabase-backed admin implementation: owner authentication, generic CMS CRUD, publication scheduling, page sections, SEO, inquiry handling, media uploads, audit/revisions, and public readers. This is source-level evidence only; it does not establish that the configured Supabase project has the required schema, grants, RLS, Storage buckets, or matching migration history.

The highest-priority blocker is media deletion. Current code deletes the Storage object before deleting its metadata, while the named recovery migration and its `deletion_status` / `deletion_requested_at` columns are absent from this checkout. No live database was queried, so their presence in staging or production is unknown. Do not test deletion or apply a migration until the owner approves the exact staging operation.

Other verified gaps:

- The source and SQL migration tracks are not reproducible as one history. `docs/migration-drift-2026-11-07.md` records that the ten prepared numbered SQL files are not in `supabase/migrations/`; the `admin_manage_user_role` RPC is not defined in either track.
- Admin analytics reads `analytics_events` with the user's bearer token and silently substitutes an empty list on failure. The repository's prepared grant hardening reserves that table for `service_role`, so the UI can report “no events” when it actually cannot read the table.
- Public-only production builds emitted admin implementation chunks despite `VITE_ENABLE_ADMIN_DEMO` being unset. This is repaired locally in this branch: routes now 404 when disabled, admin modules are behind inline compile-time-guarded imports, and the workspace provider is no longer mounted on public pages.
- No authenticated staging CRUD, publish/draft, media, role, or inquiry workflow was exercised. The public website can be fetched, but no admin credentials were used.

No confirmed Critical vulnerability was found in the inspected source. The main risks are data integrity, schema drift, and unverified runtime authorization rather than an observed exploit.

## Findings and repair plan

| Priority | Severity | Finding / evidence | Recommended action |
|---|---|---|---|
| P0 | High | Media deletion is a two-step hard delete: Storage object first, `media_assets` row second. If the row delete fails, metadata points to a missing object. `20261107100000_media_asset_deletion_recovery.sql`, `deletion_status`, and `deletion_requested_at` are absent from the checkout; base `media_assets` DDL does not include them. | Obtain the migration source and an owner-approved read-only staging schema check. Review the exact migration and rollback/recovery behavior before any staging application. Then test only an explicitly approved synthetic asset. No media/database change was made. |
| P0 | High | Schema history is not reproducible from the two tracked SQL locations. The ten `docs/database/001–010` scripts are prepared external SQL, not timestamped migrations; core definitions such as the owner role RPC are not tracked in either location. | Compare authorized staging migration history/catalog/policies to both source tracks. Produce a reviewed forward/rollback plan; never infer deployed state from the repository. |
| P1 | High | Admin analytics requests `analytics_events` through the browser-facing proxy and catches failures as `[]`. Prepared `005-harden-table-grants.sql` says the table is `service_role` only. The current UI can disguise an authorization/schema failure as a genuinely empty dashboard. Analytics writes are separately paused pending server-verifiable consent. | Keep least privilege. Show “unavailable” distinctly from “no events”; any server-mediated owner-only read requires a narrowly scoped, tested design. Do not grant broad authenticated access or resume writes without approved CMP verification. |
| P1 | Medium | Default production build previously emitted admin/auth implementation chunks while the feature flag was false; the root also mounted `WorkspaceProvider` on every public page. | **Fixed locally:** `/admin`, `/auth`, and `/reset-password` use a 404 guard when disabled; admin/auth components load only through inline `import.meta.env.DEV || __ADMIN_DEMO__` dynamic-import guards; `WorkspaceProvider` is scoped to the enabled admin/auth routes. Verify both build modes before deployment. |
| P1 | Medium | Global SEO and subscribers depend on database objects not defined in the prepared foundation SQL. A Global SEO index exists in a timestamped migration, but no table DDL is tracked; the subscriber table likewise has no tracked table definition or grant in the prepared SQL. Global SEO public reads also fall back silently to defaults on request errors. | Verify actual object definitions/grants read-only on staging. Preserve the existing Global SEO proxy allowlist fix; test a save/read-back only after explicit staging-write approval. Surface unavailable settings distinctly from defaults. |
| P1 | High | Platform, Solutions, Automations, Services, Industries, and FAQs substitute static fallback arrays when their published CMS query returns no rows. Unpublishing the final record therefore does not remove all visible fallback content; the page shell also remains static. | Confirm with the owner whether empty CMS results should show an explicit empty state or intentional editorial defaults. Do not label these modules fully synchronized until that contract and published/unpublished behavior are verified. |
| P2 | Medium | Generic public content and insight readers filter `noindex=false`, meaning noindex content is omitted from public display as well as search indexing. | Confirm whether noindex is intended to suppress display. Separate public visibility from search indexing if noindex should only affect SEO. |
| P2 | Medium | No targeted cache invalidation or revalidation path was found. Public HTML GETs did not expose cache headers in the browser; runtime sitemap source sets 60-second shared max-age while the live response reported `max-age=0, must-revalidate`; public Storage proxy reads use 300-second max-age. | Reconcile deployed CDN/Worker behavior. Define a narrow invalidation or versioned-media path only after staging publish/edit/unpublish freshness tests; avoid a full-site rebuild by default. |
| P2 | Medium | Core CMS forms validate in the client. The proxy uses the user's JWT and database RLS, but direct REST callers can bypass client-only Zod validation. Runtime constraints and policies have not been verified. | Confirm database constraints/RLS on staging. If server-side validation is required, route mutations through a narrow server function without bypassing RLS. |
| P2 | Medium | Admin searches and filters operate on loaded client data; provider queries do not implement pagination. PostgREST limits may truncate larger collections. The roadmap marks pagination as a product decision. | Ask the owner which collections need pagination and the desired size before changing the UX or query contract. |
| P2 | Medium | Several optional workspace reads (inquiry notes, revisions, analytics, subscribers, Global SEO) suppress errors to empty values. Audit reads already distinguish failure from empty. | Give each module explicit unavailable/error states; do not convert access/schema errors into success-shaped empty data. |
| P3 | Low | A production browser check found CSP errors blocking ConsentManager and Google Tag Manager scripts declared by the root route. | Review the required exact origins and consent behavior; only add narrowly scoped CSP sources after verification. No CSP change was made. |
| P3 | Low | The production `sitemap.xml` response identifies itself as generated from `content/seo.json`; dynamic CMS sitemap behavior was not demonstrated. | Verify the deployed Worker route and configured Supabase connection using a published staging-only synthetic page; do not change production content. |

## CMS module audit

All rows below distinguish source implementation from live persistence. Generic admin records are read from and written to `content_records`; the browser uses the same-origin proxy and a user's JWT. Draft/public visibility depends on Supabase RLS and publication checks. No live CRUD or RLS tests were run.

| Module | Current admin/public behavior | Related files and database objects | Status / severity / recommended fix |
|---|---|---|---|
| Branding & Contact | Generic record list/create/edit/delete. The public footer reads the first published branding record's email, phone, address, and social fields. | `src/components/admin/admin-workspace.tsx`, `src/components/site/footer.tsx`, `src/lib/public-content-records.functions.ts`; `content_records` (`branding`) | Source integration exists; RLS/public read and persistence are unverified. Medium: verify the deployed branding policy and saved-record behavior on staging. |
| Global SEO | Dedicated editor saves singleton `id=1` in `global_seo_settings`; public root and runtime SEO read only published settings. | `src/components/admin/global-seo-panel.tsx`, `src/lib/global-seo.functions.ts`, `src/server.ts`; `global_seo_settings` | UI/read/write paths exist, but table DDL is not in the prepared foundation and live grants are unknown. A genuinely empty published settings result uses defaults; missing configuration, HTTP errors, and malformed payloads now fail explicitly. High until schema/grants and save/read-back are verified. |
| Platform | Generic CRUD and publication controls; `/platform` reads published platform records and page-level CMS content. | `src/routes/platform.tsx`, `src/lib/public-content-records.functions.ts`; `content_records` (`platform`) | Code path exists. Empty published results now show an explicit empty state instead of sample fallback records; static hero/sections remain. Medium: verify staged save, publish, and public rendering. |
| Solutions | Generic CRUD; `/solutions` reads published solution records and page-level CMS content. | `src/routes/solutions.tsx`; `content_records` (`solutions`) | Empty published results now show an explicit empty state; page shell remains static. Live persistence/public sync unverified. Medium. |
| Automations | Generic CRUD; `/automations` reads published automation records, alongside static page shell content. | `src/routes/automations.tsx`, `src/content/site-content.ts`; `content_records` (`automations`) | Empty published results no longer use the disconnected catalogue preview; route intro/CTA remain static. Keep intentionally static workflow copy unless owner approves conversion. Medium. |
| Services | Generic CRUD; `/services` reads published service records and page-level CMS content. | `src/routes/services.tsx`; `content_records` (`services`) | Empty published results now show an explicit empty state; page shell remains static. Live persistence/public sync unverified. Medium. |
| Industries | Generic CRUD; `/industries` reads published industry records and page-level CMS content. | `src/routes/industries.tsx`; `content_records` (`industries`) | Empty published results now show an explicit empty state; page shell remains static. Live persistence/public sync unverified. Medium. |
| FAQs | Generic CRUD; `/faqs` reads published FAQ records and shared FAQ structured-data logic. | `src/routes/faqs.tsx`, `src/lib/public-faqs.ts`; `content_records` (`faqs`) | Empty published results no longer substitute static FAQ records. Live persistence/public sync unverified. Medium. |
| Insights | Generic CRUD plus published index/detail readers with publication and `noindex` SEO handling. | `src/routes/insights.tsx`, `src/routes/insights.$slug.tsx`, `src/lib/public-insights.functions.ts`; `content_records` (`insights`) | Published `noindex` entries are now visible but receive a noindex directive on detail pages; sitemap remains indexability-filtered. Live persistence/public sync unverified. Medium. |
| Navigation & Footer | Published navigation records drive public header/footer; branding fields drive footer contact details. | `src/components/site/header.tsx`, `src/components/site/footer.tsx`; `content_records` (`navigation`, `branding`) | Static navigation/footer fallback links were removed. Empty results and failed reads have explicit status messages rather than stale defaults; staging visibility and publication checks remain unverified. Medium. |
| Pages & Sections | Generic pages CRUD; ordered sections are serialized into `content_records.fields.sections`. Fixed routes load page content; extra pages use `/pages/:slug`. Drafts are excluded by the public reader/RLS design. | `src/components/admin/admin-workspace.tsx`, `src/lib/public-cms.functions.ts`, `src/routes/pages.$slug.tsx`, `src/components/site/cms-page-renderer.tsx`; `content_records` (`pages`, fields JSON) | Source flow and tests exist. The prepared schema also has `page_sections`, but this UI stores sections in `fields`; no live schema/round-trip verification. Medium. |

## Other Admin workflows

- **Authentication/session:** Supabase password sign-in, refresh, recovery/invite setup, local sign-out cleanup, and a Super Admin route gate exist. Session tokens remain in `localStorage` by design; replacing this with HttpOnly cookies/BFF is an architectural decision documented in `AGENT.md`. Auth configuration and deployed RLS were not checked.
- **Authorization:** content/inquiry/media writes use the user's bearer token through a path/table allowlist; database RLS is the real data boundary. Administrator invite/role/revoke functions use server-only service credentials and verify the owner. The `admin_manage_user_role` RPC implementation is not in tracked SQL. Do not broaden roles; the role matrix is a recorded owner decision.
- **Dashboard:** overview uses loaded CMS/operation counts; readiness labels are explicitly limited to checks actually performed. Analytics has the empty-vs-unavailable issue above.
- **Inquiries:** public submission uses server validation, anti-abuse controls, and a server-only delivery path. Admin status/assignment/follow-up and notes are separate writes; partial note failures are surfaced. No live inquiry or email was sent.
- **Media:** upload restricts client files to JPG/PNG/WebP, 2 MB, and requires alt text; owner-scoped paths, same-origin proxy, metadata response checks, and upload rollback exist. Reference checks include content/revision snapshots. MIME is client-declared; server/storage bucket enforcement was not checked. Deletion remains the P0 recovery blocker above.
- **Subscribers:** UI supports manual subscribe/unsubscribe and consent confirmation; storage definition/grants are absent from the tracked foundation sources and the provider suppresses lookup errors. Runtime CRUD is unverified.
- **Revisions/Audit:** restore creates a Draft; audit reads have explicit error state. Prepared triggers/policies are not confirmed deployed; inquiry status history is separate and mutation audit coverage is incomplete.
- **Search/filters/exports:** content/inquiry searches and filters, deterministic content ordering, and CSV escaping exist. Pagination and connected authorization are not verified; export permissions currently include UI checks plus database constraints where available.
- **Careers:** public careers listing uses a filtered view and fails closed unless settings explicitly enable it. The view migration is tracked; its deployment/RLS is not verified. No application form was added.

## Public website integration and responsive checks

- CMS readers are wired for platform, solutions, automations, services, industries, FAQs, insights, navigation, branding, Global SEO, and pages. Some routes retain hardcoded sections or fallbacks; no new CMS modules are recommended until the owner decides which existing fields are insufficient.
- Home-page marketing sections and interactive workflow content remain static; the existing `pages` record can override page text/sections under current rendering conditions. Inquiry forms, fixed route behavior, and editorial static copy should not be converted wholesale.
- Read-only production browser checks later confirmed public routes render and an administrator session can load the dashboard and CMS records. No unique content was created/published, and no public page was verified against a newly written value. This does not establish CMS-to-live synchronization.
- The signed-in Admin navigation exposes 24 routes. Public routes such as `/platform`, `/faqs`, `/insights`, `/contact`, and CMS page routes load, but reading pages alone does not prove persistence, publish/unpublish behavior, or cache freshness.

## CMS-to-live synchronization and cache audit

This is a source-level wiring map plus read-only browser observations. **No module qualifies as FULLY CONNECTED** under the requested acceptance criteria because actual persistence, staging RLS, unique-record publication, public endpoint draft isolation, and edit/unpublish/cache tests could not safely be performed without authorized isolated staging access.

| Public area | Data source and rendering path | Static behavior / synchronization risk | Current evidence status |
|---|---|---|---|
| Home | `content_records` module `pages`, slug `home`; `getPublishedCmsPage` → `/` loader → `CmsPageSections` / root CMS rendering; `mergeCmsHead` applies page SEO when present. | Hero, challenges, approach, workflow demo, and CTA are coded in the route. CMS body/sections supplement or may override through root rendering conditions; the page is not wholly CMS-driven. | Source-wired only. No controlled CMS change was compared with the live page. |
| Branding and contact | `content_records` module `branding`; `getPublishedContentRecords` → Footer email, phone, address, social links. | Logo/identity and primary Contact-page wording/form remain in code. The footer has no contact details if there is no published branding record. | Source-wired only; live save/read-back unverified. |
| Header navigation | `content_records` module `navigation`, category `header`; published rows become links in `Header`. | No static navigation fallback. Link order follows public reader order (`position`, then title); empty/error states are visible. No reorder/publish round trip was tested. | Source-wired; no cache invalidation or live reordering test. |
| Footer navigation | `content_records` module `navigation`, category `footer`; `group` creates columns. Branding contact fields are rendered separately. | No static `COLUMNS` fallback. Empty/error states are visible. | Source-wired; no live update/unpublish test. |
| Global SEO | Published singleton `global_seo_settings` row `id=1`; root loader reads global defaults; `server.ts` also reads settings for runtime sitemap/LLMs. | Defaults apply only when the published settings result is empty; configuration/HTTP/malformed-response failures now throw or return 503 for dynamic SEO documents. Admin Global SEO still depends on a table whose base DDL was not found in the prepared foundation SQL. | Source-wired only; deployed schema, saved values, and metadata read-back unverified. |
| Platform | `content_records` module `platform`; `/platform` loader → CMS card fields (`title`, `body`, `availability`, `capabilities`) and optional page sections. | Empty published records now render an explicit empty state rather than `PLATFORM_MODULES`; page hero and other sections remain in code. | Hybrid / NOT fully connected; no staged publication lifecycle tested. |
| Solutions | `content_records` module `solutions`; `/solutions` maps title/body/challenges/benefits. | Empty published records render an explicit empty state; route hero, headings, and CTA remain static. | Hybrid / NOT fully connected; no staged publication lifecycle tested. |
| Automations | `content_records` module `automations`; `/automations` maps problem/workflow/deployment/integrations and supports category filtering. | Empty published records no longer use `CATALOGUE_PREVIEW`; route intro and CTA are static. | Hybrid / NOT fully connected; no staged publication lifecycle tested. |
| Services | `content_records` module `services`; `/services` maps title/body/deliverables/availability. | Empty published records render an explicit empty state; page shell and CTA remain static. | Hybrid / NOT fully connected; no staged publication lifecycle tested. |
| Industries | `content_records` module `industries`; `/industries` maps title/body. | Empty published records render an explicit empty state; page hero and CTA remain static. | Hybrid / NOT fully connected; no staged publication lifecycle tested. |
| FAQs | `content_records` module `faqs`; `/faqs` renders `title` and `body`, including FAQ structured data. | Empty published records no longer fall back to static FAQs; route hero and CTA remain static. | Hybrid / NOT fully connected; no staged publication lifecycle tested. |
| Insights list and detail | `content_records` module `insights`; `getPublishedInsights` / `getPublishedInsight` → `/insights` and `/insights/$slug`; list is ordered by position/slug, detail returns 404 if not found. | Article reader selects title/body/category/SEO/author/geo summary/Q&A, but not image fields; image changes are not represented in this public insight type. The reader also excludes `noindex=true` records from the public list and detail, not merely from indexing. | Source-wired; no unique article, edit, unpublish, or direct-reader exposure test. Confirm intended `noindex` display semantics. |
| Fixed public pages and page sections | `content_records` module `pages`, slug-specific `getPublishedCmsPage`; fixed route loaders and `CmsPageSections`; custom routable slugs use `/pages/$slug` and `CmsPageRenderer`. Sections parse ordered `fields.sections`, including supported media URLs. | Fixed route layout/hero/form and much editorial copy remain hardcoded; their CMS sections supplement those surfaces. Custom-page route requires a published matching record and returns not-found otherwise. Prepared SQL also mentions `page_sections`, while current UI stores sections in `content_records.fields`. | Source-wired; no database round-trip, image, ordering, publication, or stale-cache test. |
| SEO metadata / sitemap | Route `head` merges page and insight metadata. Runtime `/sitemap.xml` and `/llms.txt` query published, indexable `pages` and `insights` using the publishable key. | Runtime sitemap source sets `public, max-age=0, s-maxage=60`; a live GET returned 200 with `public, max-age=0, must-revalidate`, `cf-cache-status: MISS`. Deployed handler/cache path differs from source expectation or is normalized; requires deployment-side verification. | Read-only response checked; no newly published record was checked for inclusion/removal. |
| Public careers | `public_website_settings` and filtered careers view, separate from generic CMS records. | Fails closed unless careers are enabled; view/migration deployment and RLS remain unverified. | Source-only. |

### Publication, API, and cache behavior

- The generic public content reader queries `content_records` with the publishable key and filters to `Published` or `Scheduled` rows whose schedule time has passed; the parser repeats the publication check. Insight/page readers apply similar checks. Public RLS remains a required independent boundary and was not verified against the live database.
- Generic content readers no longer filter on `noindex`; insights preserve the flag and emit `robots: noindex, nofollow` on noindex detail pages. Sitemap generation continues to exclude noindex records. Direct public RLS isolation remains unverified.
- `getPublishedCmsPage` uses the public `pages` module/slug and filters publication state in application code. Public image URLs are restricted to the configured public `website-media` bucket and routed through the same-origin Storage proxy. The proxy sets `public, max-age=300`, so replaced objects at the same path can remain cached for up to five minutes; no media replacement was tested.
- No tag-based/ISR invalidation or admin-triggered public-cache purge was found. TanStack Router is configured with `defaultPreloadStaleTime: 0`; client query reads do not declare a longer `staleTime`. Normal public HTML responses inspected in the browser exposed no `Cache-Control` or Cloudflare cache-status headers; this observation does not establish Supabase subrequest caching behavior.
- Public server-function Supabase fetches now request `cache: "no-store"`; Worker-generated responses default to `Cache-Control: no-store` unless a specific policy is already set. Dynamic sitemap/LLMs responses are no-store and return 503 rather than static fallback when configured reads fail. This does not invalidate already cached public media objects or prove deployed CDN behavior.
- CMS-backed public listings now show explicit empty states rather than disconnected static fallback records. Hardcoded page shells/sections remain intentionally unchanged. Navigation/footer records likewise no longer fall back to static link arrays.

### End-to-end synchronization status

For every CMS-backed module, the requested uniquely identifiable staging create → persist → publish → public render → edit → verify changed render → unpublish → verify removal/direct-reader rejection sequence is **BLOCKED**. There is no authorized staging connection or isolated staging dataset in this session. No production writes, CMS/API direct write requests, cache purges, or test-data cleanup were attempted. Public GET checks and visible Admin counts are not substitutes for this lifecycle test.

## Database and security report

- Local inventory: seven timestamped files in `supabase/migrations/`; ten numbered external SQL scripts in `docs/database/`. They are separate source tracks; the numbered foundation and permission/RLS SQL is not a one-to-one migration history.
- The requested `20261107100000_media_asset_deletion_recovery.sql` is not present in the checkout. Neither `deletion_status` nor `deletion_requested_at` appears in the tracked schema/code. The prepared `media_assets` table has no such columns.
- Staging and production migration histories, columns, foreign keys, indexes, policies, grants, Storage bucket configuration, and Security Advisor findings were not queried. No service-role key, database password, or API secret was read or exposed.
- Prepared SQL shows RLS policies and least-privilege intent, including `service_role`-only analytics writes; it is not proof of deployed policy state. The migration drift report remains blocked pending authorized read-only staging access.
- No production environment, RLS policy, Storage object, CMS record, or database row was changed.

## Validation

| Check | Result |
|---|---|
| Baseline Vitest | 39 files / 278 tests passed |
| Post-change Vitest | 40 files / 285 tests passed |
| TypeScript (`npx tsc --noEmit`) | Passed after all source changes |
| ESLint | 0 errors; 11 existing React Hook/Fast Refresh warnings |
| SEO checks | Passed for 15 configured public URLs |
| Production build, flag unset | Passed; Admin implementation chunks absent from public assets |
| Production build, `VITE_ENABLE_ADMIN_DEMO=true` | Passed; Admin workspace/auth route chunks emitted |
| Post-push Cloudflare check | Workers preview build succeeded for commit `851357bb65f84ba995ca33707a6680ef4501bb8a`; the preview site itself was not opened. |
| GitHub Actions | No run for this commit; the checked-in workflow excludes this stabilization branch. GitHub CLI was unauthenticated; public GitHub status APIs were used. |
| Browser | Production public and signed-in Admin responsive checks completed; see matrix below. Physical Android device not tested. |
| Supabase CRUD/publish/RLS/Storage | Not tested; no authorized connection |
| Production write/deployment | Not performed |

## Supplemental responsive browser validation

Production browser testing was read-only. No CMS record, setting, user, inquiry, subscriber, or media asset was saved, published, deleted, uploaded, or otherwise changed.

| Surface | Viewports / coverage | Result |
|---|---|---|
| Public pages | 17 primary navigation/legal routes at 1440×900 and 390×844 | 34/34 returned HTTP 200, had a main heading and footer, and showed no document-level horizontal overflow. |
| Public layouts | Home, Contact, Request an Operations Audit, Insights, and FAQs at all eight requested sizes | 40/40 rendered with no document-level horizontal overflow. |
| Public navigation | Desktop header links and mobile menu at 360×800 | Menu opened; tapping Contact navigated successfully. Dropdown behavior was not separately tested. |
| Public form layout | Contact form at 1280×720 and all four requested Android viewport sizes | Controls fit the viewport; form was not submitted. Text inputs measured 36 px high and submit button 40 px high. |
| Admin routes | All 24 Admin navigation routes at all eight requested sizes | 192/192 route checks reached the expected route and heading with no document-level horizontal overflow. This verifies rendering/navigation, not each route's backend workflow. |
| Admin dashboard and pages list | All eight requested sizes | Dashboard and Pages & sections rendered without page-level overflow. At mobile widths the 640 px table is inside a horizontally scrollable container; 18 rows were visible. Search and publication filtering worked in a read-only check. |
| Admin create-record modal | All eight requested sizes | Opened and closed without saving. Modal had internal vertical scrolling where needed, no page-level horizontal overflow, and Save remained reachable after scrolling. Inputs/actions measured 32–36 px high. |
| Admin media library | Signed-in mobile check | Empty-library state rendered. Upload was disabled until required alt text was entered and disabled again when cleared. No file was selected or uploaded. |
| Login/logout and mutations | Production | Not tested end-to-end. No credentials were entered, no sign-out was triggered, and no create/edit/publish/delete or message-send action was submitted. |
| Device coverage | Browser viewport emulation | Android-sized viewports were emulated; no physical Android handset/browser was available. |
| Browser console | Public and Admin pages | Repeated CSP errors blocked ConsentManager, Google Tag Manager, and Cloudflare Insights scripts. Turnstile also logged cross-origin `postMessage` warnings during form-page checks. No CSP or production configuration change was made. |

These checks do not certify every visual detail, dropdown, touch target, or backend workflow. In particular, observed 32–36 px CMS controls may benefit from larger touch targets. Production CRUD and persistence must remain BLOCKED pending an approved isolated staging environment; login/logout, publish/draft, upload, and user-management workflows remain NOT TESTED.

## Remaining owner approvals / manual work

1. Provide an authorized read-only staging connection through the approved environment integration (do not paste secrets into chat) so migration history, schema, RLS, grants, and Storage can be compared.
2. Review and approve the exact media-recovery migration before applying it to isolated staging. Production application remains separately unapproved.
3. Decide the role matrix, analytics CMP/server-verifiable-consent integration, and whether/where pagination is wanted.
4. Approve isolated staging test data and cleanup for CRUD, publish/draft, media upload/deletion, inquiry, role, and subscriber workflows.
5. Before deployment, confirm the build's `VITE_ENABLE_ADMIN_DEMO` setting. The default public-only build now intentionally returns 404 for admin/auth routes.

This audit is not a production-readiness certification. Core workflows cannot be declared end-to-end operational until the blocked staging checks pass.
