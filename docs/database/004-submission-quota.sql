-- CANDIDATE migration. NOT APPLIED. Review and test on a staging Supabase project first.
-- Depends on 001 (roles, grants conventions). Used by src/lib/submission-quota.server.ts.
--
-- Fixed-window quota keyed by a salted HMAC of the client address (never the raw IP).
-- The counter update is one atomic statement, so concurrent requests cannot both pass
-- a limit that only one of them should consume.

create table if not exists public.submission_quotas (
  quota_key text primary key check (length(quota_key) between 1 and 200),
  window_start timestamptz not null,
  hits integer not null default 0 check (hits >= 0)
);

alter table public.submission_quotas enable row level security;
revoke all on public.submission_quotas from public, anon, authenticated;
grant select, insert, update, delete on public.submission_quotas to service_role;

create or replace function public.consume_submission_quota(p_key text, p_limit integer, p_window_seconds integer)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_now timestamptz := clock_timestamp();
  v_allowed boolean;
begin
  if p_limit < 1 or p_window_seconds < 1 or p_window_seconds > 86400 then
    raise exception 'invalid quota parameters';
  end if;

  insert into public.submission_quotas as q (quota_key, window_start, hits)
  values (p_key, v_now, 1)
  on conflict (quota_key) do update set
    window_start = case
      when q.window_start <= v_now - make_interval(secs => p_window_seconds) then v_now
      else q.window_start end,
    hits = case
      when q.window_start <= v_now - make_interval(secs => p_window_seconds) then 1
      else q.hits + 1 end
  returning hits <= p_limit into v_allowed;

  return v_allowed;
end;
$$;

revoke all on function public.consume_submission_quota(text, integer, integer) from public, anon, authenticated;
grant execute on function public.consume_submission_quota(text, integer, integer) to service_role;

-- Retention: quota rows older than the longest window carry no information. Run from a scheduled
-- job with the service role; no public endpoint deletes rows.
-- delete from public.submission_quotas where window_start < now() - interval '1 day';

-- Verify after applying (staging):
--   1. anon and authenticated cannot select, insert or call consume_submission_quota;
--   2. with limit 5, the sixth call inside the window returns false;
--   3. after the window passes, the counter resets and a call returns true.
