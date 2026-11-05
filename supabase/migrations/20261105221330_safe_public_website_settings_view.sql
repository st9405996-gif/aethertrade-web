create or replace view public.public_website_settings
with (security_barrier = true)
as
select
  case when fields->>'careersEnabled' = 'true' then true else false end as careers_enabled
from public.content_records
where module = 'settings'
  and publication = 'Published'::publication_status
order by updated_at desc
limit 1;

revoke all on public.public_website_settings from public;
grant select on public.public_website_settings to anon, authenticated;
