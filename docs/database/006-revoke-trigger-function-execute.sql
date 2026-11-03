-- APPLIED to staging. Trigger functions must not be callable through the public API.
revoke execute on function public.audit_content_change() from public, anon, authenticated;
revoke execute on function public.create_admin_profile() from public, anon, authenticated;
revoke execute on function public.record_inquiry_status() from public, anon, authenticated;
-- has_permission stays executable by authenticated (RLS depends on it); revoked from anon.
revoke execute on function public.has_permission(text) from public, anon;
