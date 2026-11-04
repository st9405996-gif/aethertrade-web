-- SEARCH GROWTH CENTER — PHASE 1 (PREPARED ONLY; NOT APPLIED)
-- Additive migration proposal. Do not run in production until a restorable backup exists,
-- staging is available, and the existing 74 content_records fingerprint is rechecked.
-- This file deliberately does not insert, update, delete, or reseed existing content.

begin;

alter table public.content_records
  add column if not exists seo_focus_keyword text not null default '',
  add column if not exists seo_search_intent text not null default '',
  add column if not exists seo_og_image text not null default '',
  add column if not exists seo_twitter_title text not null default '',
  add column if not exists seo_twitter_description text not null default '',
  add column if not exists geo_summary text not null default '',
  add column if not exists aeo_questions jsonb not null default '[]'::jsonb,
  add column if not exists author_name text not null default '',
  add column if not exists featured_image_url text not null default '',
  add column if not exists approved_at timestamptz,
  add column if not exists approved_by uuid references auth.users(id),
  add column if not exists published_at timestamptz;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'content_records_aeo_questions_array'
      and conrelid = 'public.content_records'::regclass
  ) then
    alter table public.content_records
      add constraint content_records_aeo_questions_array
      check (jsonb_typeof(aeo_questions) = 'array') not valid;
  end if;
  if not exists (
    select 1 from pg_constraint
    where conname = 'content_records_search_intent_allowed'
      and conrelid = 'public.content_records'::regclass
  ) then
    alter table public.content_records
      add constraint content_records_search_intent_allowed
      check (seo_search_intent in ('', 'informational', 'commercial', 'transactional', 'navigational')) not valid;
  end if;
end $$;

create index if not exists content_records_published_insights_idx
  on public.content_records (published_at desc, slug)
  where module = 'insights' and publication = 'Published' and noindex = false;

create table if not exists public.content_redirects (
  id uuid primary key default gen_random_uuid(),
  from_path text not null unique,
  to_path text not null,
  status_code integer not null default 301
    check (status_code in (301, 302, 307, 308)),
  is_active boolean not null default true,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint content_redirects_paths_nonempty
    check (length(from_path) between 1 and 2048 and length(to_path) between 1 and 2048),
  constraint content_redirects_no_self_loop
    check (from_path <> to_path)
);

alter table public.content_redirects enable row level security;
revoke all on public.content_redirects from anon, authenticated;
grant select on public.content_redirects to anon, authenticated;
grant insert, update, delete on public.content_redirects to authenticated;

drop policy if exists "Public active redirects" on public.content_redirects;
create policy "Public active redirects"
  on public.content_redirects for select to anon, authenticated
  using (is_active = true);

drop policy if exists "Editors read redirects" on public.content_redirects;
create policy "Editors read redirects"
  on public.content_redirects for select to authenticated
  using (public.has_permission('publish'));

drop policy if exists "Publishers insert redirects" on public.content_redirects;
create policy "Publishers insert redirects"
  on public.content_redirects for insert to authenticated
  with check (public.has_permission('publish') and created_by = auth.uid());

drop policy if exists "Publishers update redirects" on public.content_redirects;
create policy "Publishers update redirects"
  on public.content_redirects for update to authenticated
  using (public.has_permission('publish'))
  with check (public.has_permission('publish'));

drop policy if exists "Publishers delete redirects" on public.content_redirects;
create policy "Publishers delete redirects"
  on public.content_redirects for delete to authenticated
  using (public.has_permission('publish'));

commit;

-- POST-MIGRATION VERIFICATION (run separately after staging apply):
-- 1. Confirm content_records row count and original IDs/slugs are unchanged.
-- 2. Confirm anon and ordinary authenticated users can read active redirects only.
-- 3. Confirm authenticated non-publishers cannot read inactive redirects or mutate.
-- 4. Confirm a publisher can read all and create/update/delete redirects.
-- 5. Confirm invalid search intent and non-array aeo_questions are rejected after
--    validating the two NOT VALID constraints in a separate controlled step.
