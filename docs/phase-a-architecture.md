# AETHER-TRADE — Phase A Architecture Audit and Technical Blueprint

Date: November 2, 2026. Status: proposal for review, not an implementation or production-readiness certificate.

## 1. Executive decision

Preserve Milestones 1–2 and the existing TanStack Start app. Implement the future CMS, accounts, database and storage against the user's own Supabase project. Do not enable Lovable Cloud. No schema, auth, app behavior, account, DNS or deployment changes were made during this audit.

**Hosting limitation:** direct deployment of this Lovable application to the user's Cloudflare Pages/Workers account is unsupported in this environment. No Cloudflare deployment infrastructure or commands will be generated. The supported hosting path here is Lovable Publish; this is an alternative requiring approval, not a silent substitution for the requested Cloudflare hosting. Cloudflare DNS for a Lovable custom domain can be considered separately, after authorization. If Cloudflare-owned hosting is mandatory, Phase G remains blocked here; the current blueprint must not be described as fully deliverable on that basis.

**Backend boundary:** new app-internal backend operations use TanStack `createServerFn`, not Supabase Edge Functions. External callbacks and scheduled requests use authenticated/verified server routes. PostgreSQL, Auth and Storage remain in the user's Supabase account. This preserves the supported TanStack server architecture.

## 2. Existing implementation and audit evidence

| Area | Inspected state | Evidence / limitation |
|---|---|---|
| Framework | React 19, TypeScript, TanStack Start/Router, Query | `package.json`, `src/router.tsx`, `src/routes/__root.tsx` |
| Build configuration | Vite config wrapper; custom SSR error entry; Nitro dependency | `vite.config.ts`, `src/server.ts`. Installed package declares Vite 8, despite older generic template references to Vite 7. No migration proposed. |
| Public pages | 19 page routes plus shared shell | Home, About, Platform, How It Works, Solutions, Industries, Services, Automations, Custom Solutions, Insights, Partnerships, Careers, FAQs, Contact, Request Demo, Thank You, Privacy, Terms, Cookies |
| Visual identity | Semantic theme tokens, Geist Sans/Mono, existing theme bootstrap | `src/styles.css`, shared site components; preserve unchanged |
| Navigation | Header, mobile menu, footer | Currently source-controlled rather than CMS-managed |
| Content | Static platform, solutions, services, FAQs, industries, insight previews, partnership types | `src/content/site-content.ts`; catalogue in `src/lib/catalogue-preview.ts` |
| Forms | Not implemented | Contact and Request Demo use `StubPage`; Thank You is a placeholder, not evidence of receipt |
| Catalogue | Static preview with filtering and demo-request context | Existing `automation` search parameter must be preserved |
| Publishing | Careers unpublished default; insight previews, not full article publishing | No draft database, scheduler or CMS |
| SEO | All 19 content-route files define `head()`; shared/inline metadata includes basic social tags | Source inspection only; rendered metadata, canonical, sitemap, structured data still require testing |
| Error handling | Root error/not-found UI, SSR wrapper, CSRF middleware | Not a replacement for private endpoint authorization |
| Auth/database/storage/admin | Not implemented | No generated Supabase integration, dependency, migrations or admin routes found |
| Analytics | No measured reporting pipeline found | Do not interpret a dependency such as Recharts as implemented analytics |
| Automated checks | Existing routing test passed: one test | `bunx vitest run src/test/app-routing.test.tsx`; checks `/` matches a route, not all pages |
| Build/runtime signals | Available diagnostics were absent or empty | No fresh production build executed; do not report build or production QA as passed |

Local files cannot establish hosted GitHub synchronization, auth settings, external database security, DNS, certificates or Cloudflare account access. The supplied project context reports no published URL or connected backend. GitHub status remains unverified; an `AGENTS.md` sync notice is not proof of a working remote connection.

## 3. Proposed architecture

```text
Public website / protected admin UI
  -> TanStack route loaders + React Query
  -> public-safe or authenticated server functions
  -> user-owned Supabase PostgreSQL / Auth / Storage

Public submission -> server validation + abuse checks
                  -> restricted submission procedure
                  -> inquiry row + reference + history

Admin mutation -> validated session + permission check
               -> RLS-enforced transaction + audit/revision
               -> cache invalidation -> public read-back
```

Public/shareable pages remain top-level SSR routes. Admin lives under a protected pathless layout with named `/admin` descendants. Public `/auth` and `/reset-password` handle access and recovery; no public signup. Every private handler validates the caller independently of the UI gate. Exactly one route claims `/`.

Use generated integration files after External Supabase linking, not invented credentials or manually recreated integration modules. Public SSR reads use a server publishable client created inside a handler; private reads use the authenticated user's RLS context. Privileged clients are reserved for narrowly authorized provisioning or restricted submission operations and are dynamically loaded inside handlers.

## 4. Normalized database proposal

All tables below are proposed, not created. UUID keys unless a natural key is explicitly suitable. Each mutable business row includes timestamps and actor IDs where appropriate; slugs are unique; relationships use foreign keys and explicit delete behavior. All public-schema table migrations must include grants, then RLS, then policies.

| Domain | Tables and relationships | Core data / constraints |
|---|---|---|
| Identity | `admin_profiles` -> `auth.users`; `roles`; `permissions`; `user_roles`; `role_permissions` | Profile contains display name only as needed, never roles. User-role joins unique; permissions have stable capability keys. Profile automatically created for provisioned users. |
| Pages | `pages`; `page_sections` -> page | Slug, title, SEO fields, publication state; typed section key, validated content, position. Unique page/section key. No executable content. |
| Navigation | `navigation_items`; `footer_sections` | Parent link, destination, order, visibility; validate same-origin/approved external destinations. |
| Settings | `site_settings` | Typed allowlisted keys for branding, contact, publishing and notifications; secrets excluded. Public/private read projections separated. |
| Media | `media_assets` | Bucket, object path, type, size, alt text, owner, visibility; no private signed URLs stored permanently. |
| Platform | `platform_modules`; `product_features` -> module/category; `product_categories`; `feature_status_history` | Title, description, availability, publishing, order, previous/current status and actor. |
| Catalogue | `automations`; `automation_categories`; `automation_capabilities` -> automation; `automation_status_history` | Unique slug, category, description, feature list, availability, publication, featured flag, image, SEO. |
| Services/solutions | `services`; `service_categories`; `solutions`; `solution_challenges`; `solution_benefits` | Preserve existing public content and per-capability availability. Normalize ordered repeatable items. |
| Industries | `industries` | Slug, title, description, publication, SEO, order. |
| Articles | `articles`; `article_categories`; `article_tags`; `article_tag_links`; `article_revisions` | Author profile, slug, safe structured content, image, SEO, publish time. Join links unique. |
| FAQs | `faqs`; `faq_categories` | Question, answer, position, publishing. |
| Partnerships | `partnership_types`; `partnership_inquiries` -> inquiry | Inquiry extension only; never seed imaginary partner relationships. |
| Careers | `job_listings`; `job_applications` -> job | Disabled by default; minimal contact/application data; no public trade-document upload. Applicant attachments deferred unless separately approved. |
| Leads | `inquiries`; `contact_submissions` -> inquiry; `demo_requests` -> inquiry | Common name, email, company, country, consent/time, source, type, selected automation/service, status, unique reference and idempotency key. One subtype per inquiry. |
| Lead workflow | `inquiry_notes`; `inquiry_status_history`; assignments/follow-up on inquiry | Private notes, status transition, actor, assigned user, follow-up date. |
| Governance | `content_revisions`; `audit_logs` | Before/after content with version/actor; immutable audit entries; sensitive values redacted. No duplicate revision stores for articles. |
| Reporting | `analytics_events`; consent configuration | Minimal event type, page, catalogue slug, timestamp; no raw email/message data or tracking before applicable consent. Retention-defined aggregates. |

Publication enum: Draft, Published, Scheduled, Archived. Careers additionally requires explicit site-level enablement. Availability enum: Available, In Development, Custom Build, Planned. Inquiry enum: New, Contacted, Qualified, In Progress, Closed, Rejected.

Scheduled rows become public only when both publication authorization and due time satisfy the public-read rule. Database transactions protect status changes, revision creation and audit logging together. A separately verified scheduling mechanism handles actual release/cache invalidation; until tested, scheduling is not advertised as complete.

Content rows for the current public website must be literal seed INSERTs in migrations, not runtime seed code. Import audited current copy, preserve labels, and do not manufacture company facts. No sample inquiries or visitor metrics in production.

## 5. Authentication and permission model

Admin profiles are needed because the blueprint requires named authors, assignments and audit identities. Roles remain separate from profiles. Secure first-user bootstrap occurs only after ownership is established and the account is verified; no hardcoded admin credentials, anonymous bootstrap endpoint or public registration. Subsequent accounts are provisioned/invited by authorized administrators. Keep email confirmation settings unchanged unless explicitly approved.

Proposed least-privilege matrix:

| Role | Permissions |
|---|---|
| Super Admin | All approved capabilities; administrator provisioning, role grants, protected settings and audit access. Last-super-admin removal/demotion prohibited transactionally. |
| Administrator | Website editing/publishing, media, inquiries and reporting; cannot grant Super Admin or alter privileged infrastructure/secrets. |
| Content Editor | Content/media drafts and previews; no publishing, lead PII, exports or user management by default. |
| Sales Manager | Inquiry read/update/notes/assignment and authorized CSV export; no content publishing or administrator provisioning. |
| Viewer | Read-only operational dashboard/reporting; inquiry PII withheld by default. |

These are proposed defaults for approval, not active permissions. Server checks read authoritative role assignments; neither browser storage nor UI visibility authorizes access. Roles/permission helpers must remain callable by authenticated clients without recursive RLS. User-role tables have no anonymous grants.

Register a single root auth subscriber for identity changes. Protect admin routes with the integration-managed client-only gate; protect every private function separately. Signed-in controls reflect session state. Sign-out cancels requests, clears private caches, signs out, then replaces history with `/auth`. Recovery route validates recovery context and changes the password; normal signed-in password changes collect current password. Verify hosted auth settings and actual sessions before claiming login tests passed.

## 6. Admin information architecture and CMS behavior

Preserve AETHER-TRADE tokens; use a dense sidebar/table-oriented admin layout rather than public-page promotional layout. Modules: Overview, Pages, Media, Navigation/Footer, Platform, Automations, Services/Solutions/Industries, Insights, Inquiries, Partnerships, Careers, FAQs, SEO, Branding/Website Settings, Users/Roles, Audit, System Settings. Only approved modules appear for each role.

Shared patterns: server-filtered lists, pagination, search, permission-aware actions, validated edit forms, dirty state, optimistic-concurrency versions, draft preview, confirmation for destructive operations, explicit empty/loading/error states. Public readers never see drafts; editors can read their permitted drafts and preview them through protected fetchers. Revision restore creates a new audited revision, not a deletion of history.

CMS governs typed content, ordering and approved media references. Source config governs section renderer types and integration boundaries. CSS tokens govern themes; settings expose validated token/font choices, not raw CSS/script injection. Private integration credentials stay outside CMS. Public pages read persisted edits after invalidation; verify each edit through the real public UI.

## 7. Forms and abuse protection

Contact: name, business email, company, country, inquiry category, message, privacy consent. Demo: same identity fields plus selected automation, business requirements and additional message. Preserve catalogue slug preselection; validate the selected record server-side. No attachments on either form.

Server Zod schemas enforce required values, length/type bounds and consent; bounds will be documented and tested before implementation. Use server-generated references, unique request keys and atomic insert behavior. Retry the same request safely; do not conflate distinct legitimate inquiries. Show success only after persistence, then read back the authorized confirmation. Public confirmation must not leak contact data through guessable reference lookup.

Honeypot, minimum completion time and a verified challenge service can supplement server validation. **Rate limiting limitation:** there is no standard backend rate-limiting primitive here. A database-backed, atomic, bounded submission counter is an ad-hoc option, not platform-level DDoS protection; it requires separate explicit acceptance before implementation. Thresholds/retention will be agreed and tested. Never use per-process memory as durable rate limiting. Do not connect Cloudflare merely to supply an unrequested infrastructure workaround.

Notification delivery remains unconfigured until an approved service is linked and tested. Saved-to-database confirmation and emailed notification are separate states.

## 8. Data, storage and security controls

- Anonymous SELECT only for safe published content; no anonymous read of inquiries, roles, profiles, application data, audit or private settings.
- Explicit grants for every table; RLS on all appropriate tables. Owner/editor read paths must include hidden drafts where permitted; write permission alone does not grant draft reads.
- Authenticated server functions use the user's RLS client, not admin bypass for ordinary reads. Verify privileges before privileged imports/operations.
- Public submission writes go through a narrowly scoped procedure/handler; callers cannot choose inquiry status, actor or assigned role.
- Audit records are append-only through trusted transactions; redact tokens and unnecessary PII; user-facing errors never disclose secrets.
- Public media bucket for approved website assets; private bucket for restricted internal files. Use Storage API to create buckets and policy migrations for object access. Validate allowed type, extension, signature and size server-side; reject executable/active content; prohibit arbitrary SVG/HTML uploads unless safely processed. Signed private links are short-lived and permission-gated.
- Sanitize rendered rich text; no raw scripts or arbitrary HTML. Defend exported CSV against formula injection. Parameterized data access, optimistic concurrency and transactional permission changes.
- Same-origin server functions preserve existing CSRF handling; external endpoints verify signatures/session/challenge and do not use permissive CORS as authorization.
- Retention and deletion policies for inquiries, applications, analytics and abuse counters must be documented before launch; backups must protect PII and credentials.

## 9. Dependencies and environment configuration

Already available: React Hook Form, Zod, resolvers, TanStack Query, shadcn/Radix primitives, Sonner, Recharts and date-fns. Add the official Supabase integration/client only after connection. Use a supported, sanitizable structured article editor only when CMS scope needs it; no premature page-builder dependency. No Wrangler/Cloudflare deployment scaffolding in this environment.

Expected integration variables (verify actual generated names after linking):

| Variable | Scope |
|---|---|
| `VITE_SUPABASE_URL` | Public browser database/storage endpoint |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Public key, protected by grants/RLS |
| `SUPABASE_URL` / `SUPABASE_PUBLISHABLE_KEY` | Server-side public reads |
| `SUPABASE_SERVICE_ROLE_KEY` | Server-only privileged operations; never browser/route data |
| Optional approved notification/challenge credentials | Server-only secret configuration; never CMS-visible |

Do not request private keys in chat, print env files or infer hosted credentials. User-owned project connection must be completed by the user in **Settings → General → External Supabase → Connect**. Hosted email/password signup/login configuration must be verified for that external project; account provisioning will not use open public signup.

Git sync connection/status is controlled through **Project settings → Git** and cannot be verified or connected by this audit. Connecting creates a new private repository, not a link to an arbitrary existing repository. Source backup does not include database/storage backup; those need separate verified recovery procedures.

## 10. Hosting, deployment and recovery gates

The local Nitro/Cloudflare-target comments show compatibility intent, not tested self-hosting or a deployment in the user's Cloudflare account. Direct Cloudflare hosting remains unsupported here. Supported alternative, only if approved: Lovable Publish with user-owned Supabase, then custom-domain connection. No deployment performed. `bun run build` is the declared project build script; this audit did not run it, and the platform runs project builds automatically. There is no verified Cloudflare deployment command or adapter configuration to supply.

For approved Lovable publishing: verify SSR, protected functions, environment variables, migrations, DNS and certificate state in a staging review before launch. Cache only safe public responses; never private admin/lead data. Domain changes require exact inventory/change approval; security/trust changes require additional impact approval. Keep independent database/storage backups, reversible migrations where possible, and document release identifiers and restore drills. Rollback app code and database schema are separate operations; neither Git sync nor republishing restores lost database data.

## 11. Phases, tests and acceptance

1. **A — Architecture:** this report and approval plan only.
2. **B — Foundation:** external connection, ownership/bootstrap, migrations/grants/RLS, seed current content, login/recovery and role-denial tests. No production data mutations before consent to migrations.
3. **C — Leads:** public forms, validation/idempotency, approved abuse controls, secure confirmations; inquiry management with real save/read-back tests.
4. **D — Admin:** permission matrix, editor/admin flows, protected modules, audit and revision transactions.
5. **E — CMS:** migrate public readers without redesign; editing/publishing/preview, media, articles and SEO; test public read-back for each content family.
6. **F — QA/reporting:** consent-aware events, role/access tests, public routes, keyboard/accessibility, desktop/mobile dark/light states, empty/error/recovery cases, export safety, storage permissions, backup drill and honest final status inventory.
7. **G — Production preparation:** blocked on hosting decision; no Cloudflare-owned deployment here. Explicit launch approval required even if an alternative is accepted.

Test concrete availability states, publication visibility, role capabilities, inquiry states, required consent, limits, duplicate handling, last-super-admin protection and private-data denials. Run authenticated multi-role integration tests using authorized sessions and real database/storage read-back. Verify reset-password and signed-out access separately. Metadata source coverage is not rendered SEO QA; add rendered checks, canonical/sitemap/robots validation and noindex behavior. No unexecuted test may be marked passed.

### Current delivery status

| Deliverable | Status |
|---|---|
| Phase A audit and proposed architecture/schema/security | Delivered for review; proposal only |
| Existing public site | Partially implemented against full production blueprint; one routing test passed |
| Database/migrations/RLS/auth/admin/forms/CMS/media management | Not implemented |
| Editable SEO and analytics reporting | Not implemented |
| GitHub synchronization and backup recovery | Unverified / not established by this audit |
| Cloudflare-owned deployment | Not implemented; unsupported here |
| Production QA/launch | Not executed |

## 12. Decisions required before implementation

- Approve or revise the architecture and proposed permission matrix.
- Complete user-owned External Supabase linking when Phase B is authorized; do not enable Lovable Cloud.
- Decide whether supported Lovable hosting is acceptable or Cloudflare-owned hosting remains mandatory; the latter blocks Phase G here.
- Before implementing rate limiting, explicitly accept the ad-hoc database-counter trade-off and agree limits/retention.
- Confirm real business facts and legal approval before replacing draft legal text or labeling capabilities differently. The existing rules-based pre-submission checker prototype is the only supplied product-proof baseline.