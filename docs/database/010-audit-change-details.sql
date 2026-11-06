-- Prepared migration; do not apply without explicit database approval.
alter table public.audit_logs
  add column if not exists details jsonb not null default '{}'::jsonb;

create or replace function public.audit_content_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  changed_fields jsonb;
begin
  if tg_op in ('UPDATE', 'DELETE') then
    insert into public.content_revisions(record_id, module, snapshot, actor_id)
    values(old.id, old.module, to_jsonb(old), auth.uid());
  end if;

  if tg_op = 'DELETE' then
    select coalesce(jsonb_agg(key order by key), '[]'::jsonb)
    into changed_fields
    from jsonb_object_keys(to_jsonb(old)) as fields(key);

    insert into public.audit_logs(actor_id, action, record_id, module, details)
    values (
      auth.uid(),
      tg_op,
      old.id,
      old.module,
      jsonb_build_object('changed_fields', changed_fields)
    );
    return old;
  end if;

  if tg_op = 'INSERT' then
    select coalesce(jsonb_agg(key order by key), '[]'::jsonb)
    into changed_fields
    from jsonb_object_keys(to_jsonb(new)) as fields(key);
  else
    select coalesce(jsonb_agg(changes.key order by changes.key), '[]'::jsonb)
    into changed_fields
    from (
      select coalesce(new_row.key, old_row.key) as key
      from jsonb_each(to_jsonb(new)) as new_row
      full outer join jsonb_each(to_jsonb(old)) as old_row using (key)
      where new_row.value is distinct from old_row.value
    ) as changes;
  end if;

  insert into public.audit_logs(actor_id, action, record_id, module, details)
  values (
    auth.uid(),
    tg_op,
    new.id,
    new.module,
    jsonb_build_object('changed_fields', changed_fields)
  );
  return new;
end;
$$;
