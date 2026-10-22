-- Owner applies this additive migration in the intended Supabase project.
-- Only usage counts are stored, never route content, keys or user locations.
begin;
create table if not exists public.google_routes_usage (
 scope text not null,
 period_start date not null,
 requests integer not null default 0 check (requests >= 0),
 primary key (scope, period_start)
);
alter table public.google_routes_usage enable row level security;
revoke all on public.google_routes_usage from public, anon, authenticated;
grant all on public.google_routes_usage to service_role;

create or replace function public.consume_google_route_budget(
 p_user uuid, p_daily integer, p_monthly integer, p_user_daily integer
) returns jsonb language plpgsql security definer set search_path = public as $$
declare
 day_key date := (now() at time zone 'Asia/Jakarta')::date;
 -- Google's free monthly usage resets at midnight US Pacific, including DST.
 month_key date := date_trunc('month', now() at time zone 'America/Los_Angeles')::date;
 day_count integer;
 month_count integer;
 user_count integer;
 user_scope text := 'user:' || p_user::text;
begin
 if p_user is null or p_daily is null or p_monthly is null or p_user_daily is null or p_daily < 1 or p_daily > 1000 or p_monthly < 1 or p_monthly > 9000 or p_user_daily < 1 or p_user_daily > 50 then
  return jsonb_build_object('allowed',false);
 end if;
 -- Serialize reservation across Worker instances before any billable Google call.
 perform pg_advisory_xact_lock(714031500);
 select requests into day_count from public.google_routes_usage where scope='global-day' and period_start=day_key;
 select requests into month_count from public.google_routes_usage where scope='global-month' and period_start=month_key;
 select requests into user_count from public.google_routes_usage where scope=user_scope and period_start=day_key;
 if coalesce(day_count,0)>=p_daily or coalesce(month_count,0)>=p_monthly or coalesce(user_count,0)>=p_user_daily then
  return jsonb_build_object('allowed',false);
 end if;
 insert into public.google_routes_usage(scope,period_start,requests)
 values ('global-day',day_key,1),('global-month',month_key,1),(user_scope,day_key,1)
 on conflict(scope,period_start) do update set requests=google_routes_usage.requests+1;
 return jsonb_build_object('allowed',true,'dailyRemaining',p_daily-coalesce(day_count,0)-1,'monthlyRemaining',p_monthly-coalesce(month_count,0)-1,'userDailyRemaining',p_user_daily-coalesce(user_count,0)-1);
end;
$$;
revoke all on function public.consume_google_route_budget(uuid,integer,integer,integer) from public, anon, authenticated;
grant execute on function public.consume_google_route_budget(uuid,integer,integer,integer) to service_role;
commit;
