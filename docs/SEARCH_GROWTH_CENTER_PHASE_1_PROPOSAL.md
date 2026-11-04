# Search Growth Center — Phase 1 foundation proposal

Status: **prepared for review; not applied to staging or production**.

## Preservation and deployment gates

- Production inventory: 74 `public.content_records` rows. Baseline fingerprint: `543951390241f4ff922b1f5baac5064c`; this is not a restorable backup.
- Obtain and verify a restorable Supabase backup before any DDL.
- Apply and test additive SQL on staging first. Do not run it against production from this branch.
- Keep existing content IDs, slugs, publication values, module assignments and `fields` JSON unchanged.
- Keep admin demo mode disabled. UI role simulation is not an authorization boundary.
- Do not enable scheduled publishing until a trusted server-side publisher and audit trail exist.

## Verified authorization baseline

Read-only inspection on 2026-11-04 confirmed:
- `public.has_permission(text)` exists and is **SECURITY INVOKER** (not SECURITY DEFINER).
- Existing `content_records` RLS separates Published public reads from editor draft access and restricts branding/settings through a separate permission.
- Existing `content_revisions` and `audit_logs` have RLS enabled.
- All 74 content records remain present at the time of this read-only inspection.

The proposed redirect policies therefore rely on the already-existing `has_permission('publish')` function. The policy for active redirects covers both `anon` and `authenticated` roles, while the additional publisher policy allows publishers to inspect inactive redirects. This dependency still must be exercised in staging with distinct role sessions.

## Additive schema proposal

`docs/database/007-search-growth-center.sql` adds explicit fields to the existing `content_records` table for focus keyword, search intent, social metadata, GEO summary, AEO question blocks, author, featured image and approval/publish timestamps. It also proposes a redirect table with RLS and publisher-only writes.

The migration does not create a second CMS table and does not seed or rewrite existing content. New checks are initially `NOT VALID`; after reviewing existing data on staging, validate them in a separate controlled step.

## Current advisor findings (read-only baseline)

Security:
- `public.submission_quotas` has RLS enabled with no policies (existing informational finding; confirm it remains service-role-only).
- Supabase Auth leaked-password protection is disabled (existing warning).

Performance:
- 12 foreign keys lack covering indexes.
- 4 RLS policies have auth init-plan warnings.
- 6 multiple-permissive-policy warnings, including existing `content_records` policies.

These are pre-existing project findings. Do not bundle unrelated security/performance changes into the CMS migration without a separate review.

## Acceptance checks before staging apply

1. Export a restorable backup and test restore into an isolated project.
2. Confirm staging schema has expected `content_records` columns and `has_permission(text)` function.
3. Run the migration on staging only.
4. Verify existing row count, IDs, slugs, module, publication and fields are unchanged.
5. Test redirect RLS as anon, authenticated non-publisher, and publisher.
6. Validate the two `NOT VALID` constraints after checking existing values.
7. Run Supabase security and performance advisors.
8. Only then proceed to the server-side content service and published-only SSR article routes.

## Not implemented in this phase

No database DDL has been applied; no app UI, publishing scheduler, Search Console/Bing OAuth, AI drafting, sitemap changes or production deployment has been enabled.
