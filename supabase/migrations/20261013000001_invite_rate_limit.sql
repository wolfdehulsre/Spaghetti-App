-- Keep invitation throttling shared across Edge Function instances.
create table private.invite_attempts (
  user_id uuid not null references auth.users(id) on delete cascade,
  attempted_at timestamptz not null default pg_catalog.clock_timestamp()
);
create index invite_attempts_user_time_idx on private.invite_attempts(user_id, attempted_at desc);
create index invite_attempts_expiry_idx on private.invite_attempts(attempted_at);
alter table private.invite_attempts enable row level security;
revoke all on table private.invite_attempts from public, anon, authenticated, service_role;

create or replace function public.consume_invite_rate_limit(target_user_id uuid)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  request_time timestamptz := pg_catalog.clock_timestamp();
  recent_count integer;
begin
  if target_user_id is null then
    return false;
  end if;
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(target_user_id::text, 0));
  delete from private.invite_attempts
  where attempted_at < request_time - interval '1 hour';
  select count(*)::integer into recent_count
  from private.invite_attempts
  where user_id = target_user_id
    and attempted_at >= request_time - interval '1 hour';
  if recent_count >= 5 then
    return false;
  end if;
  insert into private.invite_attempts(user_id, attempted_at) values (target_user_id, request_time);
  return true;
end;
$$;
revoke all on function public.consume_invite_rate_limit(uuid) from public, anon, authenticated;
grant execute on function public.consume_invite_rate_limit(uuid) to service_role;

