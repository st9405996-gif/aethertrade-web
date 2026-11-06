-- PREPARED ONLY: not applied, not connected, not a security certification.
-- Review and test on staging before any production use.
begin;
create type public.availability_status as enum ('Available','In Development','Custom Build','Planned');
create type public.publication_status as enum ('Draft','Published','Scheduled','Archived');
create type public.inquiry_status as enum ('New','Contacted','Qualified','In Progress','Closed','Rejected');
create type public.app_role as enum ('Super Admin','Administrator','Content Editor','Sales Manager','Viewer');
create table public.admin_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null default '', created_at timestamptz not null default now()
);
grant select, update on public.admin_profiles to authenticated;
grant all on public.admin_profiles to service_role;
alter table public.admin_profiles enable row level security;
create policy "Read own profile" on public.admin_profiles for select to authenticated using (id=auth.uid());
create policy "Update own profile" on public.admin_profiles for update to authenticated using (id=auth.uid()) with check (id=auth.uid());
create table public.user_roles (
  user_id uuid references auth.users(id) on delete cascade not null,
  role public.app_role not null, primary key(user_id,role)
);
grant select on public.user_roles to authenticated;
grant all on public.user_roles to service_role;
alter table public.user_roles enable row level security;
create policy "Read own roles" on public.user_roles for select to authenticated using (user_id=auth.uid());
create table public.permissions (key text primary key, description text not null);
grant select on public.permissions to authenticated;
grant all on public.permissions to service_role;
alter table public.permissions enable row level security;
create policy "Read permission catalog" on public.permissions for select to authenticated using (true);
create table public.role_permissions (
  role public.app_role not null, permission text references public.permissions(key) not null,
  primary key(role,permission)
);
grant select on public.role_permissions to authenticated;
grant all on public.role_permissions to service_role;
alter table public.role_permissions enable row level security;
create policy "Read permission definitions" on public.role_permissions for select to authenticated using (true);
insert into public.permissions values ('draft','Edit draft content'),('publish','Publish content'),('inquiries','Manage leads'),('export','Export leads'),('users','Provision administrators'),('settings','Manage website settings'),('report','Read aggregate reports');
insert into public.role_permissions select 'Super Admin', key from public.permissions;
insert into public.role_permissions select 'Administrator', key from public.permissions where key <> 'users';
insert into public.role_permissions values ('Content Editor','draft'),('Sales Manager','inquiries'),('Sales Manager','export'),('Sales Manager','report'),('Viewer','report');
create function public.has_permission(requested text) returns boolean language sql stable security definer set search_path=public as $$
  select exists (select 1 from public.user_roles ur join public.role_permissions rp on rp.role=ur.role where ur.user_id=auth.uid() and rp.permission=requested)
$$;
revoke all on function public.has_permission(text) from public, anon;
grant execute on function public.has_permission(text) to authenticated;
create function public.create_admin_profile() returns trigger language plpgsql security definer set search_path=public as $$
begin insert into public.admin_profiles(id) values(new.id); return new; end $$;
create trigger on_auth_user_created after insert on auth.users for each row execute function public.create_admin_profile();
-- No public signup page or bootstrap endpoint; role provisioning is out-of-band until verified.
create table public.content_records (
  id uuid primary key default gen_random_uuid(), module text not null,
  slug text not null check(slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'), title text not null check(length(title) between 1 and 160),
  body text not null default '', category text not null default '', fields jsonb not null default '{}',
  publication public.publication_status not null default 'Draft', availability public.availability_status not null default 'Planned',
  position integer not null default 0 check(position>=0), scheduled_at timestamptz,
  seo_title text not null default '', seo_description text not null default '', canonical text not null default '',
  noindex boolean not null default false, version integer not null default 1,
  created_by uuid references auth.users(id), updated_at timestamptz not null default now(),
  unique(module,slug), check(publication <> 'Scheduled' or scheduled_at is not null)
);
grant select on public.content_records to anon;
grant select,insert,update,delete on public.content_records to authenticated;
grant all on public.content_records to service_role;
alter table public.content_records enable row level security;
-- Scheduled rows are not public until a verified publisher promotes them to Published.
create policy "Published content only" on public.content_records for select to anon,authenticated using (publication='Published' and module in ('pages','platform','automations','services','solutions','industries','insights','faqs','partnerships','navigation'));
create policy "Editor hidden content reads" on public.content_records for select to authenticated using ((public.has_permission('draft') or public.has_permission('publish')) and module not in ('branding','settings'));
create policy "Draft writes" on public.content_records for insert to authenticated with check ((public.has_permission('publish') or (public.has_permission('draft') and publication='Draft')) and module not in ('branding','settings'));
create policy "Edit content" on public.content_records for update to authenticated using ((public.has_permission('publish') or (public.has_permission('draft') and publication='Draft')) and module not in ('branding','settings')) with check ((public.has_permission('publish') or (public.has_permission('draft') and publication='Draft')) and module not in ('branding','settings'));
create policy "Delete content" on public.content_records for delete to authenticated using (public.has_permission('publish') and module not in ('branding','settings'));
create policy "Private settings reads" on public.content_records for select to authenticated using (module in ('branding','settings') and public.has_permission('settings'));
create policy "Private settings writes" on public.content_records for all to authenticated using (module in ('branding','settings') and public.has_permission('settings')) with check (module in ('branding','settings') and public.has_permission('settings'));
create table public.page_sections (
  id uuid primary key default gen_random_uuid(), page_id uuid references public.content_records(id) on delete cascade not null,
  section_key text not null, title text not null default '', body text not null default '', position integer not null default 0,
  unique(page_id,section_key)
);
grant select on public.page_sections to anon;
grant select,insert,update,delete on public.page_sections to authenticated;
grant all on public.page_sections to service_role;
alter table public.page_sections enable row level security;
create policy "Visible page sections" on public.page_sections for select to anon,authenticated using (exists(select 1 from public.content_records p where p.id=page_id and p.module='pages' and p.publication='Published'));
create policy "Editable page sections" on public.page_sections for all to authenticated using (public.has_permission('publish') or (public.has_permission('draft') and exists(select 1 from public.content_records p where p.id=page_id and p.publication='Draft'))) with check (public.has_permission('publish') or (public.has_permission('draft') and exists(select 1 from public.content_records p where p.id=page_id and p.publication='Draft')));
create table public.inquiries (
  id uuid primary key default gen_random_uuid(), request_key uuid not null unique,
  reference text not null unique default ('AT-' || upper(substr(gen_random_uuid()::text,1,8))),
  kind text not null check(kind in ('contact','demo','partnership')),
  contact_name text not null check(length(contact_name) between 2 and 100),
  email text not null check(length(email)<=254), company text not null check(length(company) between 1 and 160),
  country text not null check(length(country) between 1 and 100), category text not null default '',
  automation_id uuid references public.content_records(id), message text not null check(length(message) between 10 and 4000),
  requirements text not null default '' check(length(requirements)<=4000),
  consent boolean not null check(consent=true), consent_at timestamptz not null default now(),
  status public.inquiry_status not null default 'New', assigned_to uuid references auth.users(id), follow_up date,
  created_at timestamptz not null default now()
);
grant select,update on public.inquiries to authenticated;
grant all on public.inquiries to service_role;
alter table public.inquiries enable row level security;
create policy "Sales read inquiries" on public.inquiries for select to authenticated using(public.has_permission('inquiries'));
create policy "Sales update inquiries" on public.inquiries for update to authenticated using(public.has_permission('inquiries')) with check(public.has_permission('inquiries'));
create table public.inquiry_notes (
  id uuid primary key default gen_random_uuid(), inquiry_id uuid references public.inquiries(id) on delete cascade not null,
  body text not null check(length(body) between 1 and 4000), author_id uuid references auth.users(id) not null default auth.uid(), created_at timestamptz not null default now()
);
grant select,insert on public.inquiry_notes to authenticated;
grant all on public.inquiry_notes to service_role;
alter table public.inquiry_notes enable row level security;
create policy "Sales notes read" on public.inquiry_notes for select to authenticated using(public.has_permission('inquiries'));
create policy "Sales notes create" on public.inquiry_notes for insert to authenticated with check(public.has_permission('inquiries') and author_id=auth.uid());
create table public.inquiry_status_history (
  id uuid primary key default gen_random_uuid(), inquiry_id uuid references public.inquiries(id) on delete cascade not null,
  previous_status public.inquiry_status, status public.inquiry_status not null,
  actor_id uuid references auth.users(id), created_at timestamptz not null default now()
);
grant select on public.inquiry_status_history to authenticated;
grant all on public.inquiry_status_history to service_role;
alter table public.inquiry_status_history enable row level security;
create policy "Sales history read" on public.inquiry_status_history for select to authenticated using(public.has_permission('inquiries'));
create function public.record_inquiry_status() returns trigger language plpgsql security definer set search_path=public as $$
begin
  if tg_op='INSERT' then insert into public.inquiry_status_history(inquiry_id,status,actor_id) values(new.id,new.status,auth.uid());
  elsif old.status is distinct from new.status then insert into public.inquiry_status_history(inquiry_id,previous_status,status,actor_id) values(new.id,old.status,new.status,auth.uid()); end if;
  return new;
end $$;
create trigger inquiry_status_audit after insert or update on public.inquiries for each row execute function public.record_inquiry_status();
create table public.content_revisions (
  id uuid primary key default gen_random_uuid(), record_id uuid not null,
  module text not null, snapshot jsonb not null, actor_id uuid references auth.users(id), created_at timestamptz not null default now()
);
grant select on public.content_revisions to authenticated;
grant all on public.content_revisions to service_role;
alter table public.content_revisions enable row level security;
create policy "Editors read content history" on public.content_revisions for select to authenticated using((module not in ('branding','settings') and (public.has_permission('draft') or public.has_permission('publish'))) or (module in ('branding','settings') and public.has_permission('settings')));
create table public.audit_logs (
  id uuid primary key default gen_random_uuid(), actor_id uuid references auth.users(id), action text not null,
  record_id uuid, module text, details jsonb not null default '{}'::jsonb, created_at timestamptz not null default now()
);
grant select on public.audit_logs to authenticated;
grant all on public.audit_logs to service_role;
alter table public.audit_logs enable row level security;
create policy "Administrators read audit" on public.audit_logs for select to authenticated using(public.has_permission('publish'));
create function public.audit_content_change() returns trigger language plpgsql security definer set search_path=public as $$
declare changed_fields jsonb;
begin
 if tg_op in ('UPDATE','DELETE') then insert into public.content_revisions(record_id,module,snapshot,actor_id) values(old.id,old.module,to_jsonb(old),auth.uid()); end if;
 if tg_op='DELETE' then
  select coalesce(jsonb_agg(key order by key),'[]'::jsonb) into changed_fields from jsonb_object_keys(to_jsonb(old)) as fields(key);
  insert into public.audit_logs(actor_id,action,record_id,module,details) values(auth.uid(),tg_op,old.id,old.module,jsonb_build_object('changed_fields',changed_fields));
  return old;
 end if;
 if tg_op='INSERT' then
  select coalesce(jsonb_agg(key order by key),'[]'::jsonb) into changed_fields from jsonb_object_keys(to_jsonb(new)) as fields(key);
 else
  select coalesce(jsonb_agg(changes.key order by changes.key),'[]'::jsonb) into changed_fields
  from (select coalesce(n.key,o.key) as key from jsonb_each(to_jsonb(new)) as n full outer join jsonb_each(to_jsonb(old)) as o using(key) where n.value is distinct from o.value) as changes;
 end if;
 insert into public.audit_logs(actor_id,action,record_id,module,details) values(auth.uid(),tg_op,new.id,new.module,jsonb_build_object('changed_fields',changed_fields));
 return new;
end $$;
create trigger content_change_audit after insert or update or delete on public.content_records for each row execute function public.audit_content_change();
create table public.media_assets (
  id uuid primary key default gen_random_uuid(), bucket_id text not null, object_path text not null,
  filename text not null, content_type text not null check(content_type in ('image/jpeg','image/png','image/webp','application/pdf')),
  file_size bigint not null check(file_size>0 and file_size<=10485760), alt_text text not null default '',
  owner_id uuid references auth.users(id), is_public boolean not null default false, unique(bucket_id,object_path)
);
grant select on public.media_assets to anon;
grant select,insert,update,delete on public.media_assets to authenticated;
grant all on public.media_assets to service_role;
alter table public.media_assets enable row level security;
create policy "Public approved asset metadata" on public.media_assets for select to anon,authenticated using(is_public);
create policy "Editors manage media" on public.media_assets for all to authenticated using(public.has_permission('draft')) with check(public.has_permission('draft'));
create table public.analytics_events (
 id uuid primary key default gen_random_uuid(), event_type text not null check(event_type in ('page_view','cta_click','demo_conversion','contact_conversion','automation_interest')),
 page_path text not null, automation_slug text, consent boolean not null check(consent=true), created_at timestamptz not null default now()
);
grant all on public.analytics_events to service_role;
alter table public.analytics_events enable row level security;
-- No browser analytics writes or raw event reads; an approved consent handler and aggregate report must be added before use.
create table public.job_applications (
 id uuid primary key default gen_random_uuid(), listing_id uuid references public.content_records(id),
 contact_name text not null, email text not null, message text not null, consent boolean not null check(consent=true), created_at timestamptz not null default now()
);
grant all on public.job_applications to service_role;
alter table public.job_applications enable row level security;
-- No public career application writes until explicitly published and verified.
-- Buckets must be created via Storage API, not SQL.
create policy "Editors read managed storage" on storage.objects for select to authenticated using(bucket_id in ('website-media','internal-media') and public.has_permission('draft'));
create policy "Editors upload managed storage" on storage.objects for insert to authenticated with check(bucket_id in ('website-media','internal-media') and public.has_permission('draft') and (storage.foldername(name))[1]=auth.uid()::text);
create policy "Editors update own storage" on storage.objects for update to authenticated using(bucket_id in ('website-media','internal-media') and public.has_permission('draft') and (storage.foldername(name))[1]=auth.uid()::text) with check(bucket_id in ('website-media','internal-media') and public.has_permission('draft') and (storage.foldername(name))[1]=auth.uid()::text);
create policy "Editors delete own storage" on storage.objects for delete to authenticated using(bucket_id in ('website-media','internal-media') and public.has_permission('draft') and (storage.foldername(name))[1]=auth.uid()::text);
commit;
