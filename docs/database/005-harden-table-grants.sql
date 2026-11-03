-- APPLIED to staging (aethertrade-staging). Removes Supabase default table privileges from anon and
-- authenticated, then grants only what the design needs. RLS policies stay in force on top.
revoke all on all tables in schema public from anon, authenticated;
alter default privileges in schema public revoke all on tables from anon, authenticated;

grant select on public.content_records to anon;
grant select on public.page_sections to anon;
grant select on public.media_assets to anon;

grant select, update on public.admin_profiles to authenticated;
grant select on public.user_roles to authenticated;
grant select on public.permissions to authenticated;
grant select on public.role_permissions to authenticated;
grant select, insert, update, delete on public.content_records to authenticated;
grant select, insert, update, delete on public.page_sections to authenticated;
grant select, update on public.inquiries to authenticated;
grant select, insert on public.inquiry_notes to authenticated;
grant select on public.inquiry_status_history to authenticated;
grant select on public.content_revisions to authenticated;
grant select on public.audit_logs to authenticated;
grant select, insert, update, delete on public.media_assets to authenticated;
-- analytics_events, job_applications, submission_quotas: service_role only.
