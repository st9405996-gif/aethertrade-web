# AETHER-TRADE — Phase A Architecture Approval

## Preserve the website
Keep the completed public pages, visual identity, theme switching and catalogue interactions. No rebuild, framework migration, production launch or DNS changes.

The complete audit and schema proposal is saved in `docs/phase-a-architecture.md`. This plan proposes later work; none of the database, login, admin or form features has been implemented.

## Audit findings
- The website has 19 public page routes with basic metadata in source.
- Public content and the automation catalogue are currently static.
- Contact, Request a Demo and Thank You remain placeholders; no submissions are saved.
- No connected database, login, roles, admin dashboard, CMS, media management or measured analytics was found.
- The existing homepage routing test passed: **one test**, not a full website or security test.
- Hosted GitHub synchronization, external account settings, DNS and deployment state are unverified.

## Required infrastructure decisions
**Use your own Supabase:** keep PostgreSQL, administrator accounts and file storage in your project. Do not enable Lovable Cloud. You connect your project through **Settings → General → External Supabase → Connect** when Phase B is authorized.

**Cloudflare hosting limitation:** direct deployment of this app to your Cloudflare Pages/Workers account is unsupported here. Lovable Publish is the supported alternative and requires your approval; it will not be silently substituted. Cloudflare DNS for a Lovable custom domain is separate. If Cloudflare-owned hosting is mandatory, production preparation remains blocked here. No Cloudflare deployment scaffolding will be generated.

**Rate limiting:** there is no standard backend limiter here. An atomic database-backed submission counter is an ad-hoc option that requires explicit acceptance of its limitations before implementation; it is not DDoS protection.

## Proposed database
- Identity: admin profiles, roles, permissions, user-role and role-permission joins. Roles never live on profiles.
- Website: pages, typed ordered sections, navigation/footer, validated settings and media.
- Product content: platform modules/features/categories, automations/categories/capabilities/status history, services, solutions, industries and FAQs.
- Publishing: articles/categories/tags, revisions, draft previews and publication controls.
- Leads: a common inquiry record with contact/demo/partnership extensions, notes, assignment, follow-up and status history.
- Careers: listings and minimal application data; disabled by default.
- Governance/reporting: immutable redacted audits, content revisions and consent-aware minimal analytics events.

Use unique slugs/references, foreign keys, transactional updates, explicit grants and row-level access policies. Seed only audited existing public content in migrations; never fabricate leads, partners or visitor metrics.

## Proposed permissions
| Role | Default access |
|---|---|
| Super Admin | Full approved capabilities, account provisioning and role management; protect the last Super Admin |
| Administrator | Content publishing, media, inquiries and reporting; no Super Admin grants or private infrastructure credentials |
| Content Editor | Draft content/media editing and protected preview; no publishing or inquiry PII |
| Sales Manager | Inquiry management and authorized exports; no content publishing or user provisioning |
| Viewer | Read-only reporting; inquiry PII withheld |

Provision the first Super Admin securely after verifying ownership; no public registration. Provide login, sign-out, password recovery and independent server-side authorization for every private operation.

## Admin and CMS
Build protected `/admin` views for Overview, Pages, Media, Navigation/Footer, Platform, Automations, Services/Solutions/Industries, Insights, Inquiries, Partnerships, Careers, FAQs, SEO, Branding, Users/Roles, Audit and System Settings.

Use searchable lists and focused edit forms, drafts/preview, audited publication, revision restore and safe media reuse. CMS controls approved content and theme choices, never arbitrary scripts/CSS or secret credentials. Verify every saved edit through the public website.

## Forms and integrity
Contact and Demo collect the fields in your blueprint and required consent. Preserve automation preselection, validate server-side, save atomically, prevent accidental duplicates and show a real reference only after persistence. Do not accept public trade-document attachments or claim emailed delivery until notifications are configured and tested.

Keep availability labels distinct, Careers unpublished, Cookie Policy a legal-review draft and prototype claims truthful. A discrepancy is a review finding; consequential decisions remain with human reviewers.

## Technical details
- Preserve TanStack Start, React Query, existing UI components and semantic theme tokens.
- Use TanStack server functions for internal backend work rather than new Supabase Edge Functions; verified server routes handle external callbacks.
- Use generated integration clients after connection. Ordinary authenticated reads enforce the user's row-level policies; privileged clients are reserved for separately authorized operations.
- Public SSR reads expose only published safe fields. Editors have protected draft-read paths. Private data is never cached publicly.
- Existing form/validation/chart dependencies can be reused; add the official Supabase integration only after connection.
- Public/private storage buckets have validated upload types/sizes and object policies. Secrets remain server-only and outside CMS.
- GitHub connection is user-managed in Project settings → Git; source backup and database/storage backup are separate.

## Controlled sequence after approval
1. **B — Foundation:** connect your project, migrations, seed content, grants/policies, secure provisioning, login/recovery and permission tests.
2. **C — Leads:** Contact/Demo persistence, approved abuse controls, confirmation and inquiry management.
3. **D — Admin:** protected modules, role checks, audit and revisions.
4. **E — CMS:** connect existing public pages, catalogue/articles/media, preview/publish and SEO.
5. **F — QA:** authenticated real-data tests, denied-access tests, public page checks, mobile/desktop themes, accessibility, consent reporting and backup/recovery documentation.
6. **G — Hosting preparation:** only after the hosting decision; no production launch without explicit approval.

Report every later feature as complete and tested, implemented but not fully tested, partially implemented or not implemented. Architecture approval does not authorize deployment, DNS changes, a different hosting provider or an ad-hoc limiter.