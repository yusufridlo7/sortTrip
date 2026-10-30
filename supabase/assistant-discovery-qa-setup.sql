-- OWNER ONLY. QA project aytrcvfncsklhqozreyk. Review before applying.
-- Atomic setup for currently missing subscription tables/functions.
-- No payment, entitlement grant, usage reset or change to the Meta USD10 ledger.
begin;
-- Source: supabase/ai-access.sql
-- Run ONCE in Supabase SQL Editor. No existing trips are modified.

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
 request_limit integer not null default 10,
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

-- Source: supabase/ai-quota-v2.sql
-- Apply after ai-access.sql. Owner review required; no existing usage is reset.

create table if not exists public.ai_request_reservations (
 id uuid primary key, user_id uuid not null references auth.users(id), pass_id uuid references public.trip_passes(id),
 expires_at timestamptz not null, status text not null default 'pending' check(status in ('pending','success','failed'))
);
alter table public.ai_request_reservations enable row level security;
revoke all on public.ai_request_reservations from public,anon,authenticated;
create or replace function public.reserve_ai_request(p_user uuid,p_trip_key text,p_request uuid) returns jsonb
language plpgsql security definer set search_path='' as $$
declare p public.trip_passes; used integer; pending integer;
begin
 perform pg_advisory_xact_lock(hashtextextended(p_user::text,0));
 select * into p from public.trip_passes where user_id=p_user and expires_at>now() and requests<request_limit order by expires_at desc limit 1 for update;
 if found then
  select count(*) into pending from public.ai_request_reservations where pass_id=p.id and status='pending' and expires_at>now();
  if p.requests+pending>=p.request_limit then return jsonb_build_object('allowed',false,'busy',pending>0); end if;
 else
  select coalesce(requests,0) into used from public.ai_membership_usage where user_id=p_user;
  used:=coalesce(used,0);
  select count(*) into pending from public.ai_request_reservations where user_id=p_user and pass_id is null and status='pending' and expires_at>now();
  if used+pending>=2 then return jsonb_build_object('allowed',false,'busy',used<2); end if;
 end if;
 insert into public.ai_request_reservations(id,user_id,pass_id,expires_at) values(p_request,p_user,p.id,now()+interval '3 minutes');
 return jsonb_build_object('allowed',true);
end; $$;
create or replace function public.finish_ai_request(p_user uuid,p_request uuid,p_success boolean) returns jsonb
language plpgsql security definer set search_path='' as $$
declare r public.ai_request_reservations; n integer;
begin
 perform pg_advisory_xact_lock(hashtextextended(p_user::text,0));
 select * into r from public.ai_request_reservations where id=p_request and user_id=p_user for update;
 if not found then return jsonb_build_object('ok',false); end if;
 if r.status<>'pending' then return jsonb_build_object('ok',r.status='success'); end if;
 if not p_success or r.expires_at<=now() then
  update public.ai_request_reservations set status='failed' where id=r.id;
  return jsonb_build_object('ok',not p_success);
 end if;
 if r.pass_id is null then
  insert into public.ai_membership_usage(user_id,trip_key,requests) values(p_user,'account',1)
  on conflict(user_id) do update set requests=public.ai_membership_usage.requests+1 returning requests into n;
 else
  update public.trip_passes set requests=requests+1 where id=r.pass_id returning requests into n;
 end if;
 update public.ai_request_reservations set status='success' where id=r.id;
 return jsonb_build_object('ok',true);
end; $$;
revoke all on function public.reserve_ai_request(uuid,text,uuid), public.finish_ai_request(uuid,uuid,boolean) from public,anon,authenticated;
grant execute on function public.reserve_ai_request(uuid,text,uuid), public.finish_ai_request(uuid,uuid,boolean) to service_role;
-- Prevent the previous pre-charge path from consuming quota.
revoke execute on function public.claim_ai_request(text) from authenticated;

-- Source: supabase/assistant-paid-discovery.sql
-- OWNER ONLY: review and apply in the intended project after ai-access.sql,
-- ai-quota-v2.sql and ai-pass-account-scope.sql. No grants to client roles,
-- no test subscriptions, no quota reset and no payment operation.

create or replace function public.reserve_paid_ai_request(p_user uuid,p_request uuid)
returns jsonb language plpgsql security definer set search_path='' as $$
declare p public.trip_passes; result jsonb; reserved_pass uuid;
begin
 perform pg_advisory_xact_lock(hashtextextended(p_user::text,0));
 select * into p from public.trip_passes where user_id=p_user and expires_at>now()
  and requests<request_limit order by expires_at desc limit 1 for update;
 if not found then return jsonb_build_object('allowed',false); end if;
 result:=public.reserve_ai_request(p_user,'assistant-discovery',p_request);
 if coalesce((result->>'allowed')::boolean,false) then
  select pass_id into reserved_pass from public.ai_request_reservations
   where id=p_request and user_id=p_user and status='pending';
  if reserved_pass is null then
   perform public.finish_ai_request(p_user,p_request,false);
   return jsonb_build_object('allowed',false);
  end if;
 end if;
 return result;
end; $$;
revoke all on function public.reserve_paid_ai_request(uuid,uuid) from public,anon,authenticated;
grant execute on function public.reserve_paid_ai_request(uuid,uuid) to service_role;
-- Read-only account access. RLS bypass remains confined to the server role.
grant select on public.trip_passes to service_role;

commit;
