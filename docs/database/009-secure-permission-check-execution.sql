-- Keep the permission helper callable by authenticated policy checks only.
-- SECURITY INVOKER means the lookup respects the caller's RLS on user_roles.
begin;
alter function public.has_permission(text) security invoker;
revoke all on function public.has_permission(text) from public, anon;
grant execute on function public.has_permission(text) to authenticated, service_role;
commit;
