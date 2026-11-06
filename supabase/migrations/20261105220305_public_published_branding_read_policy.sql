do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'content_records'
      and policyname = 'Public can read published branding'
  ) then
    create policy "Public can read published branding"
      on public.content_records for select to anon, authenticated
      using (
        module = 'branding'
        and publication = 'Published'::publication_status
        and coalesce(noindex, false) = false
      );
  end if;
end
$$;
