-- Run ONCE in Supabase SQL Editor. No existing trips are modified.
begin;
create table if not exists public.ai_membership_usage (
 user_id uuid primary key references auth.users(id) on delete cascade,
 trip_key text not null,
 requests integer not null default 0 check(requests>=0)
);
create table if not exists public.trip_passes (
 id uuid primary key default gen_random_uuid(),
 user_id uuid not null references auth.users(id) on delete cascade,
 trip_key text not null,
 expires_at timestamptz not null,
 requests integer not null default 0,
 request_limit integer not null default 20,
 payment_reference text unique not null
);
alter table public.ai_membership_usage enable row level security;
alter table public.trip_passes enable row level security;
revoke all on public.ai_membership_usage, public.trip_passes from anon, authenticated;
-- Entitlements may only be granted by a trusted, verified payment backend.
create or replace function public.claim_ai_request(p_trip_key text) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare u uuid:=auth.uid(); r public.ai_membership_usage; p public.trip_passes;
begin
 if u is null then raise exception 'Authentication required'; end if;
 if length(p_trip_key)<3 or length(p_trip_key)>200 then raise exception 'Invalid trip'; end if;
 -- One per-user lock serializes even concurrent first requests.
 perform pg_advisory_xact_lock(hashtextextended(u::text,0));
 select * into p from public.trip_passes where user_id=u and trip_key=p_trip_key and expires_at>now() and requests<request_limit order by expires_at desc limit 1 for update;
 if found then
  update public.trip_passes set requests=requests+1 where id=p.id;
  return jsonb_build_object('allowed',true,'plan','trip_pass','remaining',p.request_limit-p.requests-1);
 end if;
 select * into r from public.ai_membership_usage where user_id=u for update;
 if not found then
  insert into public.ai_membership_usage values(u,p_trip_key,1);
  return jsonb_build_object('allowed',true,'plan','basic','remaining',1);
 end if;
 if r.trip_key<>p_trip_key or r.requests>=2 then
  return jsonb_build_object('allowed',false,'plan','basic','remaining',greatest(0,2-r.requests));
 end if;
 update public.ai_membership_usage set requests=requests+1 where user_id=u;
 return jsonb_build_object('allowed',true,'plan','basic','remaining',1-r.requests);
end; $$;
revoke all on function public.claim_ai_request(text) from public, anon;
grant execute on function public.claim_ai_request(text) to authenticated;
commit;
