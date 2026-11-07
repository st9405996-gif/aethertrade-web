# Search Growth Center — Phase 0 Audit Baseline

Date: 2026-11-04
Repository: `st9405996-gif/aethertrade-web`
Production Supabase project: `mwzrbjeehhtcphxljgtd`

## Scope

This document records a read-only baseline before implementing the integrated SEO, GEO, AEO and scheduled Blog CMS. No production database rows, schema, Auth users, secrets, or deployment settings were changed during this audit.

## Verified CMS baseline

The production database reports exactly **74 rows** in `public.content_records`.

| Module       |   Rows |
| ------------ | -----: |
| automations  |      6 |
| branding     |      1 |
| faqs         |      7 |
| industries   |      6 |
| insights     |      3 |
| navigation   |     12 |
| pages        |     18 |
| partnerships |      3 |
| platform     |      7 |
| services     |      5 |
| settings     |      1 |
| solutions    |      5 |
| **Total**    | **74** |

A deterministic row fingerprint was recorded for later before/after comparison:

`543951390241f4ff922b1f5baac5064c`

The fingerprint is not a backup. Before any production migration or content write, obtain a restorable database backup/export through the project owner workflow and compare the fingerprint after deployment.

## Existing database capabilities

The existing `content_records` table already has:

- `publication`: Draft, Published, Scheduled, Archived
- `scheduled_at`
- `seo_title`, `seo_description`, `canonical`, `noindex`
- `fields jsonb`, `version`, `created_by`, `updated_at`

Existing `content_revisions` and `audit_logs` tables are present. Existing CMS rows must be extended in place; do not reseed, truncate, replace IDs, or recreate the table.

Existing migration history includes the foundation, initial content, inquiry delivery, quota, grants, and RLS hardening migrations. New schema work must be additive and must not re-run seed inserts.

## Existing application architecture

- TanStack Start + React + TypeScript; retain the existing stack.
- Supabase Auth and Postgres RLS are the authority for connected admin access.
- Existing CMS workspace provider reads/writes Supabase REST endpoints.
- Existing `scripts/build-seo.mjs` generates `sitemap.xml` and `llms.txt` from `content/seo.json`.
- Existing `/insights` route currently renders a static preview from `INSIGHTS`; it is not yet a full public article route driven by published database records.
- Existing CMS model already supports scheduled status and timestamps, but a trusted server-side scheduler/publisher still needs implementation and tests.
- `demoCan()` in the client model is explicitly UI simulation only; it must never authorize API writes.

## Deployment and admin safety findings

- `AGENTS.md` says the repository is connected to Lovable and commits on its connected branch sync back to the Lovable editor. The connected branch and production auto-publish behavior still need verification.
- Vercel deployment context lookup returned no teams; do not assume Vercel is the active deployment provider.
- `AGENTS.md` says production builds compile out the admin preview unless `VITE_ENABLE_ADMIN_DEMO` is enabled. Do not enable this flag merely to expose the panel; first complete and verify production authentication, RLS, server authorization and admin routes.
- The live inquiry delivery feature flag remains outside this project scope and must stay disabled until its separate end-to-end test is approved.

## Supabase security advisor baseline

The security advisor currently reports:

1. `public.submission_quotas` has RLS enabled with no policies (informational; review whether access should remain service-role-only).
2. Leaked-password protection is disabled (warning; enable through Auth configuration after reviewing project settings).

These are pre-existing findings and should be addressed or explicitly accepted in the security phase.

## Required implementation guardrails

1. Preserve all 74 existing `content_records` rows, IDs, slugs, content, publication values and module assignments.
2. Use additive migrations only; no table recreation, destructive migration, or reseeding.
3. Scheduled publication must be server-side, idempotent, timezone-explicit, audited and retry-safe.
4. Public routes must expose only Published content. Draft and Scheduled content must remain private.
5. Admin permissions must be enforced server-side and by RLS; client UI role checks are not security.
6. AI output must remain a draft until a Super Admin explicitly approves and schedules it.
7. Do not invent AETHER-TRADE customer claims, regulatory integrations, certifications, or product capabilities.
8. Do not publish automatically to production until tests, preview deployment, and owner approval are complete.

## Phase gate status

| Phase                                           | Status at audit                                                      |
| ----------------------------------------------- | -------------------------------------------------------------------- |
| 0 — backup, inventory and preservation baseline | Inventory and fingerprint recorded; restorable backup still required |
| 1 — additive CMS/data foundation                | Not started                                                          |
| 2 — public SSR article integration              | Not started                                                          |
| 3 — SEO manager and technical SEO               | Existing foundation only; admin integration not started              |
| 4 — GEO and AEO tooling                         | Not started                                                          |
| 5 — blog editor and workflow                    | Not started                                                          |
| 6 — trusted scheduled publisher                 | Not started                                                          |
| 7 — Search Console/Bing integrations            | Not started                                                          |
| 8 — security, tests and production QA           | Baseline findings recorded; not passed                               |

This file is an audit record, not a claim that the phases are implemented.
