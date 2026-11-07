# Migration reproducibility check — 2026-11-07

Read-only comparison of `docs/database/` and `supabase/migrations/`. No SQL was
applied, no staging or production database was contacted.

## Inventory

| Location | Files | Notes |
|---|---|---|
| `supabase/migrations/` | 7 timestamped files (2026-11-05 to 2026-11-06) | Public policies, settings view, CMS metadata, FK indexes, public career listing view |
| `docs/database/` | 001 to 010 | Foundation, existing content, inquiry delivery, submission quota, grant hardening, trigger execute revokes, search growth center, owner-only access, permission-check execution, audit change details |

## Gap

- None of `docs/database/001–010` exists in `supabase/migrations/`. Those files
  carry the core RLS policies, `has_permission`, the audit triggers and the
  owner-only role model that the admin code depends on.
- Repo notes (`AGENT.md`) state that the staging schema and repository migrations
  differ. This document cannot confirm which set is live.

## Required before any schema change

1. Export the staging migration history (`list_migrations`) and the live policy
   list (`pg_policies`) from the database owner's account.
2. Diff them against `docs/database/001–010` and `supabase/migrations/`.
3. Convert only the missing pieces into timestamped migrations, reviewed and
   approved. Do not apply to production without authorization and a rollback plan.

Status: BLOCKED on database access. Not applied.
