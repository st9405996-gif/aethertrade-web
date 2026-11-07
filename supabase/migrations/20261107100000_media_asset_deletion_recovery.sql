-- Persist media cleanup intent before Storage deletion so partial failures are
-- recoverable from the authenticated Media Library. This migration is not applied
-- automatically and must be reviewed against the target Supabase schema first.

alter table public.media_assets
  add column if not exists deletion_status text not null default 'active',
  add column if not exists deletion_requested_at timestamptz;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.media_assets'::regclass
      and conname = 'media_assets_deletion_status_check'
  ) then
    alter table public.media_assets
      add constraint media_assets_deletion_status_check
      check (deletion_status in ('active', 'pending'));
  end if;
end
$$;

create index if not exists idx_media_assets_pending_deletion
  on public.media_assets (deletion_requested_at, id)
  where deletion_status = 'pending';

-- This restrictive policy composes with existing permissive public-read policies.
-- It only narrows anonymous SELECT and does not grant access to any role.
drop policy if exists "Hide pending media from public" on public.media_assets;
create policy "Hide pending media from public"
  on public.media_assets
  as restrictive
  for select
  to anon
  using (deletion_status = 'active');

-- Serialize the transition to pending against CMS writes, then check live content
-- and revision snapshots while those tables are locked against writes.
create or replace function public.guard_media_asset_deletion_request()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if old.deletion_status = 'active' and new.deletion_status = 'pending' then
    lock table public.content_records, public.content_revisions in share mode;

    if exists (
      select 1
      from public.content_records c
      where position(new.object_path in c.fields::text) > 0
         or position(replace(new.object_path, '/', '%2F') in c.fields::text) > 0
    ) or exists (
      select 1
      from public.content_revisions r
      where position(new.object_path in r.snapshot::text) > 0
         or position(replace(new.object_path, '/', '%2F') in r.snapshot::text) > 0
    ) then
      raise exception 'Media asset is referenced by CMS content or a saved revision'
        using errcode = '23514';
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists guard_media_asset_deletion_request on public.media_assets;
create trigger guard_media_asset_deletion_request
  before update of deletion_status on public.media_assets
  for each row
  execute function public.guard_media_asset_deletion_request();

-- Once an asset is pending, reject new CMS references. This closes the race
-- between the reference scan and an editor saving content concurrently.
create or replace function public.reject_pending_media_references()
returns trigger
language plpgsql
set search_path = public
as $$
declare
  row_text text := to_jsonb(new)::text;
begin
  if exists (
    select 1
    from public.media_assets m
    where m.deletion_status = 'pending'
      and (
        position(m.object_path in row_text) > 0
        or position(replace(m.object_path, '/', '%2F') in row_text) > 0
      )
  ) then
    raise exception 'CMS content cannot reference a media asset pending deletion'
      using errcode = '23514';
  end if;
  return new;
end;
$$;

drop trigger if exists reject_pending_media_references on public.content_records;
create trigger reject_pending_media_references
  before insert or update on public.content_records
  for each row
  execute function public.reject_pending_media_references();

drop trigger if exists reject_pending_media_revision_references on public.content_revisions;
create trigger reject_pending_media_revision_references
  before insert or update on public.content_revisions
  for each row
  execute function public.reject_pending_media_references();

comment on column public.media_assets.deletion_status is
  'active assets are available; pending assets are hidden publicly and retained for retryable cleanup';
comment on column public.media_assets.deletion_requested_at is
  'Timestamp of the latest persisted media deletion request';
