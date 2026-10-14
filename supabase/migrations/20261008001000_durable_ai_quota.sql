create table if not exists public.ai_usage_buckets (
  organization_id uuid not null,
  scope text not null,
  window_started_at timestamptz not null,
  window_seconds integer not null check (window_seconds > 0),
  request_count integer not null default 0 check (request_count >= 0),
  updated_at timestamptz not null default now(),
  primary key (organization_id, scope, window_started_at, window_seconds)
);

alter table public.ai_usage_buckets enable row level security;

create index if not exists ai_usage_buckets_org_updated_idx
  on public.ai_usage_buckets (organization_id, updated_at desc);

create or replace function public.consume_ai_quota(
  p_organization_id uuid,
  p_scope text,
  p_limit integer,
  p_window_seconds integer
)
returns table (
  allowed boolean,
  remaining integer,
  retry_after_seconds integer,
  window_started_at timestamptz
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_now timestamptz := clock_timestamp();
  v_window_start timestamptz;
  v_count integer;
begin
  if p_organization_id is null
     or coalesce(trim(p_scope), '') = ''
     or p_limit <= 0
     or p_window_seconds <= 0 then
    raise exception 'invalid ai quota configuration';
  end if;

  v_window_start := to_timestamp(
    floor(extract(epoch from v_now) / p_window_seconds) * p_window_seconds
  );

  insert into public.ai_usage_buckets (
    organization_id,
    scope,
    window_started_at,
    window_seconds,
    request_count,
    updated_at
  )
  values (
    p_organization_id,
    p_scope,
    v_window_start,
    p_window_seconds,
    1,
    v_now
  )
  on conflict (organization_id, scope, window_started_at, window_seconds)
  do update
    set request_count = public.ai_usage_buckets.request_count + 1,
        updated_at = v_now
  where public.ai_usage_buckets.request_count < p_limit
  returning request_count into v_count;

  if v_count is null then
    select request_count
      into v_count
      from public.ai_usage_buckets
     where organization_id = p_organization_id
       and scope = p_scope
       and window_started_at = v_window_start
       and window_seconds = p_window_seconds;

    return query
    select
      false,
      0,
      greatest(
        1,
        ceil(extract(epoch from (v_window_start + make_interval(secs => p_window_seconds) - v_now)))::integer
      ),
      v_window_start;
    return;
  end if;

  return query
  select
    true,
    greatest(0, p_limit - v_count),
    greatest(
      1,
      ceil(extract(epoch from (v_window_start + make_interval(secs => p_window_seconds) - v_now)))::integer
    ),
    v_window_start;
end;
$$;

revoke all on function public.consume_ai_quota(uuid, text, integer, integer) from public;
revoke all on function public.consume_ai_quota(uuid, text, integer, integer) from anon;
revoke all on function public.consume_ai_quota(uuid, text, integer, integer) from authenticated;
grant execute on function public.consume_ai_quota(uuid, text, integer, integer) to service_role;
