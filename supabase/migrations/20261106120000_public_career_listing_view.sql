-- Deliberate, narrow owner-backed read path. The base content_records RLS
-- policy continues to deny anon access to module='careers'. This view exposes
-- only published, indexable listings while the latest public Careers setting
-- is true, and only the fields required by the public listing UI.
alter view public.public_website_settings owner to postgres;
alter view public.public_website_settings set (security_barrier = true, security_invoker = false);

create or replace view public.public_career_listings
with (security_barrier = true, security_invoker = false)
as
select
  jobs.id,
  jobs.title,
  jobs.body,
  nullif(btrim(jobs.fields ->> 'location'), '') as location,
  nullif(btrim(jobs.fields ->> 'type'), '') as type,
  jobs.position
from public.content_records as jobs
where jobs.module = 'careers'
  and jobs.publication = 'Published'::public.publication_status
  and jobs.noindex = false
  and exists (
    select 1
    from public.public_website_settings as settings
    where settings.careers_enabled is true
  );

alter view public.public_career_listings owner to postgres;
revoke all on public.public_career_listings from public, anon, authenticated, service_role;
grant select on public.public_career_listings to anon;
