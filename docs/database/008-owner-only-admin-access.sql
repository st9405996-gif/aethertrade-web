-- OWNER-ONLY ADMIN ACCESS
-- The existing, verified Super Admin account is the sole administrator.
-- Keep this owner UUID in sync with the Supabase migration applied to production.
-- This migration is intentionally restrictive and does not create/delete users or roles.

begin;

create or replace function public.has_permission(requested text)
returns boolean
language sql
stable
set search_path to 'public'
as $function$
  select coalesce(auth.uid() = 'bfc5b3bb-aa5d-496a-ad0b-ac14834ea690'::uuid, false)
    and exists (
      select 1
      from public.user_roles ur
      join public.role_permissions rp on rp.role = ur.role
      where ur.user_id = auth.uid()
        and ur.role = 'Super Admin'
        and rp.permission = requested
    );
$function$;

revoke all on function public.has_permission(text) from public, anon;
grant execute on function public.has_permission(text) to authenticated;

drop policy if exists "Read own roles" on public.user_roles;
create policy "Owner reads admin roles"
  on public.user_roles
  for select
  to authenticated
  using (
    user_id = auth.uid()
    and auth.uid() = 'bfc5b3bb-aa5d-496a-ad0b-ac14834ea690'::uuid
  );

drop policy if exists "Read own profile" on public.admin_profiles;
create policy "Owner reads admin profile"
  on public.admin_profiles
  for select
  to authenticated
  using (
    id = auth.uid()
    and auth.uid() = 'bfc5b3bb-aa5d-496a-ad0b-ac14834ea690'::uuid
  );

drop policy if exists "Update own profile" on public.admin_profiles;
create policy "Owner updates admin profile"
  on public.admin_profiles
  for update
  to authenticated
  using (
    id = auth.uid()
    and auth.uid() = 'bfc5b3bb-aa5d-496a-ad0b-ac14834ea690'::uuid
  )
  with check (
    id = auth.uid()
    and auth.uid() = 'bfc5b3bb-aa5d-496a-ad0b-ac14834ea690'::uuid
  );

commit;
