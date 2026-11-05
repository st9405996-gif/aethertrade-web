# AETHER-TRADE Admin Panel Audit

Updated: 2026-11-05
Scope: repository/source inspection and read-only Supabase schema/policy checks. This is not a full end-to-end browser test.

## Implemented in branch `admin-panel-audit-fixes`

- Replaced the misleading CMS editor action label "Save demo changes" with "Save changes".
- Removed demo-only copy from the connected CMS content and inquiry screens where records are loaded from Supabase.
- Made CMS preview disclaim that preview is not proof of public-site rendering.
- Clarified that revision history snapshots are created by the database trigger on content UPDATE/DELETE (new INSERTs do not have a prior version).
- Disabled Media Library uploads in the UI until a Supabase Storage bucket is provisioned; clarified the storage readiness notice.
- Added UUID validation to inquiry assignment input so invalid text cannot silently be converted to an unassigned inquiry.
- Clarified that the user-role matrix is reference information and requires server-side policy verification before granting team access.

## Findings requiring implementation/configuration

### P0 — CMS public rendering
CMS records persist in Supabase, but the public site must be wired to read/present those records consistently. Confirm page-by-page rendering, publish/draft behavior, and preview/live parity before editors populate content.

### P0 — Media storage
The `media_assets` table exists, but no bucket is configured and the table is empty. Create a bucket, Storage RLS policies, safe upload path, size/type enforcement, durable URL handling, replacement/deletion lifecycle, and then re-enable uploads.

### P1 — Roles and authorization
The UI role-permission matrix is local reference logic. Supabase RLS is the actual enforcement layer. The inspected `has_permission` function currently explicitly restricts permissions to the configured Super Admin user and Super Admin role; therefore, the other listed roles should not be presented as fully operational until the policies/function and role assignment model are implemented and tested. Do not invite users before that work.

### P1 — SEO integration
CMS SEO fields exist, but confirm they populate public HTML title/meta description/canonical/robots/Open Graph, sitemap and robots rules, and scheduled publication behavior. Currently fields alone do not prove the SEO feature works end to end.

### P1 — Audit and revisions
Database triggers exist: content change events are recorded in `audit_logs`; prior snapshots on content UPDATE/DELETE are inserted in `content_revisions`. Audit records contain event metadata, not a comprehensive before/after diff. Add richer actor/action detail only with a migration and policy review.

### P1 — Connections/readiness
Connection statuses must be sourced from actual health checks, not static labels. Add safe server-side checks for Supabase, Storage, inquiry delivery, email provider, and deployed runtime. Never expose secret values.

### P1 — Inquiry handling
Validate inquiry lifecycle end-to-end: secure server submission, duplicate/idempotency handling, bot challenge, RLS, status-history trigger, notes, assignment, follow-up and CSV export. Verify notification email delivery with a controlled test.

### P2 — Missing/partial modules
- Admin invitations: disabled; implement only after authorization model is corrected.
- Analytics: currently no tracked events; add privacy/consent-aware analytics and honest empty states.
- Subscribers: no newsletter collection or delivery; configure consent and a provider before enabling.
- Revision UI: test restore-to-draft end to end and ensure restored snapshots are saved safely.
- Settings/branding: verify protected writes; avoid exposing private settings in public queries.
- UX: loading/error/empty states, accessible form labels, mobile navigation, confirmation dialogs, and meaningful toast outcomes.

## Verification checklist before production merge/deploy

- Run lint, TypeScript, unit tests and production build in a clean environment.
- Test CMS create/edit/delete, draft/publish, slug uniqueness, and rollback.
- Confirm public page output reflects intended published CMS data and not drafts.
- Test roles against Supabase RLS with separate accounts (not just UI gating).
- Test inquiry submission and status change; confirm audit/history records.
- Test Media Storage permissions with anonymous and authenticated users.
- Check SEO output, sitemap, robots, canonical and noindex.
- Verify backups, secrets, error logging and deploy rollback.


## Production incident verification — 2026-11-06

### Confirmed Global SEO save defect

- **Status: FIX IMPLEMENTED IN SOURCE; production deployment pending verification.**
- Browser request evidence: `PATCH /api/admin-supabase/rest/v1/global_seo_settings?id=eq.1` returned HTTP 404 with plain-text `Not found`.
- Read-only database inspection confirmed `public.global_seo_settings` exists and contains the singleton row `id=1`; this was not a missing-table or missing-row issue.
- The deployed Cloudflare Worker source and repository `src/server.ts` both used an explicit `ADMIN_TABLES` allowlist that omitted `global_seo_settings`. The proxy therefore returned 404 before contacting Supabase.
- The allowlist was extracted into a pure helper, the missing table was added, and regression tests now cover Global SEO GET/PATCH, all existing admin tables, unknown-table rejection and media path validation.
- Do not call this production-fixed until the updated Worker is deployed and a real authenticated Global SEO save/read-back succeeds.

### Broader audit boundaries

The existing pre-launch audit remains valid for its stated scope. Source review and database schema checks are not equivalent to browser-driven end-to-end testing. Admin modules requiring external account/provider setup or controlled live actions remain marked blocked/not tested until those checks are completed. No live email, destructive reset, user invitation, or public inquiry has been sent as part of this incident investigation.
