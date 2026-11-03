-- CANDIDATE migration. NOT APPLIED. Review and test on a staging Supabase project first.
-- Depends on 001-foundation.sql (inquiries table, request_key unique constraint, grants).
--
-- The server stores the catalogue slug selected on Request a Demo here. The existing
-- automation_id column references content_records by UUID and is left unused by the form.
alter table public.inquiries
  add column if not exists automation_slug text
  check (automation_slug is null or length(automation_slug) <= 160);

-- No insert policy is added for anon or authenticated roles. Public submissions are written
-- only by the server using the service role key, after server-side validation.
-- Verify after applying:
--   1. anon cannot select or insert into public.inquiries;
--   2. a second insert with the same request_key returns 409 (idempotency);
--   3. reference values are unique.
