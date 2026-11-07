# Migration reproducibility check — 2026-11-07 (updated)

Scope: repository migrations, `docs/database/`, and read-only checks on the
`aethertrade-staging` Supabase project. No production access. One staging write is
recorded below and was made with explicit approval.

## Repository inventory

| Location | Files | Notes |
|---|---|---|
| `supabase/migrations/` | 7 timestamped files (2026-11-05 to 2026-11-06) | Public policies, settings view, CMS metadata, FK indexes, public career listing view |
| `docs/database/` | 001 to 010 | Foundation, existing content, inquiry delivery, submission quota, grant hardening, trigger execute revokes, search growth center, owner-only access, permission-check execution, audit change details |

None of `docs/database/001–010` exists in `supabase/migrations/`. Repo notes say those
files are unapplied reference SQL.

## Staging migration history (read-only, `list_migrations`)

Applied on staging before this work: `001_foundation`, `002_existing_content`,
`003_inquiry_delivery`, `004_submission_quota`, `005_harden_table_grants`,
`006_revoke_trigger_function_execute`, `secure_public_submission_tables`,
`make_permission_check_security_invoker`, `owner_only_admin_access`,
`admin_media_audit_subscribers_analytics`, `grant_analytics_event_access`,
`enable_role_permission_matrix`, `owner_only_audited_admin_role_management`,
`secure_permission_check_execution`, `create_isolated_global_seo_settings`, and the six
November timestamped migrations that match the repository.

Not present on staging: `007_search_growth_center` (no `content_redirects` table) and
`010_audit_change_details` as a named entry. The `audit_logs.details` column does exist, so
its effect is present even though no named migration records it.

## Verified on staging (read-only)

- RLS is enabled on every public table. Only `submission_quotas` has no policy, which is
  intended because it is service-role only.
- `has_permission` exists. `content_records` has the expected published, scheduled,
  draft, write, delete and private-settings policies.
- `public_website_settings` exists and returns only `careers_enabled`.
- The only role in `user_roles` is `Super Admin`, so non-owner role behaviour is untested.
- Security advisor: leaked-password protection is disabled. This is a dashboard setting.

## Change made to staging (approved)

- Applied `supabase/migrations/20261106120000_public_career_listing_view.sql` as
  `public_career_listing_view`. Verified that the anon role can query
  `public_career_listings` (0 rows, because no Careers records exist on staging).
- Verified that anon cannot read `content_records` rows directly for careers.
- Not verified: a positive careers listing. That needs a published careers record and
  `careers_enabled = true`.

## Consistency checks added

`src/test/migration-consistency.test.ts` checks the 14-digit naming convention, unique
versions, the presence and grants of the careers view, and that no migration grants anon
direct select on `content_records`.

## Remaining blockers

1. Full comparison of staging `pg_policies`, functions and triggers against
   `docs/database/001–010` is BLOCKED. It requires the database owner's export.
2. Staging `007` (search growth center) is missing. The app does not use it, so nothing
   breaks today. Decide whether it is needed before applying it.
3. No production verification has been performed.

No migration was applied to production. Any further schema change needs approval and a
rollback plan.
