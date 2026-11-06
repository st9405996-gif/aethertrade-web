update public.content_records
set fields = coalesce(fields, '{}'::jsonb) || jsonb_build_object(
  'group',
  case slug
    when 'industries' then 'Platform'
    when 'faqs' then 'Company'
    when 'partnerships' then 'Company'
    when 'privacy-policy' then 'Legal'
    when 'cookie-policy' then 'Legal'
    when 'terms' then 'Legal'
    else coalesce(fields->>'group', 'Company')
  end
),
position = case slug
  when 'industries' then 3
  when 'partnerships' then 9
  when 'faqs' then 11
  when 'privacy-policy' then 14
  when 'terms' then 15
  when 'cookie-policy' then 16
  else position
end,
title = case when slug='terms' then 'Terms of Use' else title end
where module='navigation' and category='Footer';

insert into public.content_records
  (module, slug, title, body, category, publication, availability, position, noindex, fields)
values
  ('navigation','platform-footer','Platform','/platform','Footer','Published','Available',0,false,'{"visible":"true","group":"Platform"}'::jsonb),
  ('navigation','how-it-works-footer','How It Works','/how-it-works','Footer','Published','Available',1,false,'{"visible":"true","group":"Platform"}'::jsonb),
  ('navigation','solutions-footer','Solutions','/solutions','Footer','Published','Available',2,false,'{"visible":"true","group":"Platform"}'::jsonb),
  ('navigation','automation-catalogue-footer','Automation Catalogue','/automations','Footer','Published','Available',4,false,'{"visible":"true","group":"Services"}'::jsonb),
  ('navigation','custom-solutions-footer','Custom Solutions','/custom-solutions','Footer','Published','Available',5,false,'{"visible":"true","group":"Services"}'::jsonb),
  ('navigation','services-footer','Services','/services','Footer','Published','Available',6,false,'{"visible":"true","group":"Services"}'::jsonb),
  ('navigation','insights-footer','Insights','/insights','Footer','Published','Available',7,false,'{"visible":"true","group":"Services"}'::jsonb),
  ('navigation','about-footer','About','/about','Footer','Published','Available',8,false,'{"visible":"true","group":"Company"}'::jsonb),
  ('navigation','careers-footer','Careers','/careers','Footer','Published','Planned',10,false,'{"visible":"true","group":"Company"}'::jsonb),
  ('navigation','contact-footer','Contact','/contact','Footer','Published','Available',12,false,'{"visible":"true","group":"Company"}'::jsonb),
  ('navigation','operations-audit-footer','Book an Operations Audit','/request-demo','Footer','Published','Available',13,false,'{"visible":"true","group":"Company"}'::jsonb)
on conflict (module,slug) do update set
  title=excluded.title, body=excluded.body, category=excluded.category,
  publication=excluded.publication, availability=excluded.availability,
  position=excluded.position, noindex=excluded.noindex,
  fields=excluded.fields;
