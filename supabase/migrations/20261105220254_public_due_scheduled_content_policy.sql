do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'content_records'
      and policyname = 'Public can read due scheduled content'
  ) then
    create policy "Public can read due scheduled content"
      on public.content_records for select to anon, authenticated
      using (
        publication = 'Scheduled'::publication_status
        and scheduled_at is not null
        and scheduled_at <= now()
        and coalesce(noindex, false) = false
        and module = any (array[
          'pages','platform','automations','services','solutions',
          'industries','insights','faqs','partnerships','navigation','branding'
        ]::text[])
      );
  end if;
end
$$;
