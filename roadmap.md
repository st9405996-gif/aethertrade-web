# AETHER-TRADE Website — Task Roadmap

Source of truth: original Build Pack + the uploaded "Complete Website Expansion &
Fully Manageable Admin CMS" brief + the latest "Complete Technical Blueprint".
The latest blueprint supersedes earlier permission to continue through M6:
Phase A architecture approved on November 2, 2026. Phase B is authorized,
with disconnected demo development authorized while accounts are deferred. No production,
DNS, hosting substitution or ad-hoc rate-limiter approval is implied.

## Current request — Technical Blueprint Phase A
## Current request — Final pre-launch audit
- [ ] Inspect all public pages, admin modules, forms, security, SQL, SEO and deployment readiness
- [ ] Run existing tests and fresh browser checks; document verified results and limitations
- [ ] Present the complete audit report before any recommended fixes
- [ ] Recommended fixes and deployment preparation — blocked until explicit audit approval

## Previous request — Technical Blueprint Phase A
- [x] Audit existing website, dependencies, metadata and test coverage
- [x] Prepare architecture report, schema, admin permissions, security and testing plan
- [x] Explain user-owned Supabase connection and supported hosting limitations
- [x] Architecture approved; website and infrastructure preserved during Phase A
- [ ] Phase B foundation — blocked until the user connects their own Supabase
      in Settings → General → External Supabase → Connect

## Current request — Disconnected application build
- [x] Demo Admin Dashboard and management views with editing workflows
- [x] Browser-only demo CMS, revisions, publishing/preview and inquiry management
- [x] Contact and Demo forms with validation, honest confirmation and error states
- [x] Media library, SEO/settings and connection-readiness/auth preview screens
- [x] Unapplied database migration candidates, grants/RLS, environment template and connection guide
- [x] Tests and desktop/mobile flow checks; complete/demo/connection-dependent report
- [ ] Live authentication, CMS public publishing, database persistence, storage,
      notifications and production tests — blocked on external connections

## Milestone 1 — Audit + Visual Identity (done)
- [x] Audit existing implementation (design tokens, routes, components)
- [x] Visual identity finalized: deep navy foundation, muted teal accent,
      warm off-white light theme, glow effects toned down
- [x] Hero + globe imagery regenerated in the muted teal identity
- [x] Verified: build OK, routing tests pass, dark + light screenshots checked

## Milestone 2 — Complete Public Pages (implementation paused for Phase A approval)
- [x] Shared default content module written (platform modules, solutions, industries,
      services, FAQs, insights, partnerships, careers default unpublished)
- [x] Flesh out the 6 stub pages: Platform, How It Works, Solutions, Services,
      Automations (Catalogue), Insights
- [x] New pages: Industries, Partnerships, Careers (configurable publishing
      state), FAQs, Cookie Policy, custom 404
- [ ] Complete, truthful content on every page; clearly marked placeholders
      where verified info is unavailable; availability labels on capabilities
- [ ] Contact/Request a Demo forms still wired in M3/M4
- [ ] Every internal link resolves; metadata on every route

## Milestone 3 — Database-Backed CMS and Content Model
- [ ] Connect user-owned Supabase (not Lovable Cloud); schema migrations (pages/sections, blog, catalogue,
      services, solutions, industries, FAQs, settings, navigation, media, SEO,
      inquiries, subscribers, revisions/audit)
- [ ] RLS policies + grants
- [ ] Server-side form handling, validation, spam protection, reference IDs
- [ ] Structured content model: DB content vs static config vs theme tokens
      vs protected admin settings, clearly separated

## Milestone 4 — Secure Admin Panel
- [ ] Admin auth + roles (Owner / Admin / Editor), server-side checks,
      protected admin routes
- [ ] All 20 CMS modules from the brief (dashboard, pages/sections, theme
      settings, navigation, footer, blog, catalogue, solutions/industries,
      FAQ, contact info, social links, media library, SEO, inquiries,
      subscribers, admin users, website settings, revisions/audit, analytics)
- [ ] Draft/preview, publish/unpublish/schedule, revision restore

## Milestone 5 — Inquiry Management, SEO and Analytics
- [ ] Inquiry management (search/filter, status, notes, assignment, export,
      notification recipients)
- [ ] SEO: editable per-page metadata, canonical, sitemap.xml, robots,
      structured data, social-sharing images
- [ ] Analytics overview for admins

## Milestone 6 — Testing and Quality
- [ ] All pages, forms, admin permissions, theme settings, mobile layouts,
      database operations, error states
- [ ] Accessibility (keyboard nav, contrast, alt text), loading/empty/error
      states, custom 404/500
- [ ] Backup and recovery guidance

## Standing rules
- Product truthfulness: never invent customers, testimonials, stats,
  certifications, customs clearance claims, government approvals, office
  addresses or social accounts. Marked placeholders where unverified.
- No confidential document upload through public forms.
- Launch-scope excludes customer portal, shipment console, customer automation
  controls, proposal/order portal, support portal, live regulatory tracker.
