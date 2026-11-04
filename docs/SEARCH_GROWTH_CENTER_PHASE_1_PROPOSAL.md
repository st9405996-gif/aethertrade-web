# Search Growth Center — Phase 1 foundation proposal

Status: **prepared for review; not applied to staging or production**.

## Preservation and deployment gates

- The production inventory contains 74 `public.content_records` rows. The recorded fingerprint is `543951390241f4ff922b1f5baac5064c`; it is a comparison signal, not a backup.
- Obtain and verify a restorable Supabase backup before any DDL.
- Apply and test the additive SQL on staging first. Do not run it against production from this branch.
- Keep the existing content IDs, slugs, publication values, module assignments and `fields` JSON unchanged.
- Keep admin demo mode disabled. UI role simulation is not an authorization boundary.
- Do not enable scheduled publishing until a trusted server-side publisher and audit trail exist.

## Additive schema proposal

`docs/database/007-search-growth-center.sql` adds explicit fields to the existing `content_records` table for focus keyword, search intent, social metadata, GEO summary, AEO question blocks, author, featured image and approval/publish timestamps. It also proposes a redirect table with RLS and publisher-only writes.

The migration does not create a second CMS table and does not seed or rewrite existing content. Redirect writes require the existing `public.has_permission('publish')` authorization function; this dependency must be verified on staging before applying.

## Known design boundary

The current `content_records` RLS allows public reads of Published records and editor draft access. The client-side admin role simulation is not proof of backend authorization. Before building approval UI, verify the actual production policies, grants, JWT/session validation and role assignments with non-admin and Super Admin test accounts.

## Acceptance checks before staging apply

1. Export a restorable backup and test restore into an isolated project.
2. Confirm staging schema has the expected `content_records` columns and `has_permission(text)` function.
3. Run the migration on staging only.
4. Verify existing row count, IDs, slugs, module, publication and fields are unchanged.
5. Test redirect RLS as anon, authenticated non-publisher, and publisher.
6. Run Supabase security and performance advisors.
7. Only then proceed to the server-side content service and published-only SSR article routes.

## Not implemented in this phase

No database DDL has been applied; no app UI, publishing scheduler, Search Console/Bing OAuth, AI drafting, sitemap changes or production deployment has been enabled.
