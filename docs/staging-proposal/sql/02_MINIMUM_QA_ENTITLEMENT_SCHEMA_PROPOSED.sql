-- USULAN SAJA, BELUM DIJALANKAN. Memerlukan persetujuan dan tinjauan owner.
-- Jangan jalankan sekarang. Khusus proyek QA, bukan production.
-- Target: QA aytrcvfncsklhqozreyk ONLY, verified by owner in dashboard.
-- SQL Editor cannot reliably infer the project's public URL: do not treat this
-- comment as an automatic project guard. NEVER run in production.
-- Fresh missing entitlement schema ONLY. Abort if anything already exists.
-- No Meta budget changes, trips policies, payment schema, billing or user grant.
begin;
do $$ begin
 if to_regclass('public.trip_passes') is not null
 or to_regclass('public.ai_request_reservations') is not null
 or to_regprocedure('public.reserve_paid_ai_request(uuid,uuid)') is not null
 or to_regprocedure('public.finish_ai_request(uuid,uuid,boolean)') is not null then
  raise exception 'Existing schema detected: stop and review a tailored delta';
 end if;
end $$;

create table public.trip_passes(
 id uuid primary key default gen_random_uuid(),
 user_id uuid not null references auth.users(id) on delete cascade,
 trip_key text not null,
 expires_at timestamptz not null,
 requests integer not null default 0 check(requests>=0),
 request_limit integer not null check(request_limit between 1 and 10),
 payment_reference text unique not null
  check(payment_reference like 'owner-test:staging:%'),
 unique(id,user_id),
 check(requests<=request_limit)
);
create table public.ai_request_reservations(
 id uuid primary key,
 user_id uuid not null references auth.users(id) on delete cascade,
 pass_id uuid not null,
 expires_at timestamptz not null,
 status text not null default 'pending' check(status in ('pending','success','failed')),
 foreign key(pass_id,user_id) references public.trip_passes(id,user_id)
);
create index staging_result_reservations_owner
 on public.ai_request_reservations(user_id,status,expires_at);
alter table public.trip_passes enable row level security;
alter table public.ai_request_reservations enable row level security;
revoke all on public.trip_passes,public.ai_request_reservations
 from public,anon,authenticated,service_role;
grant select on public.trip_passes to service_role;

-- Staging Worker must authenticate BOTH Access identity and the allowlisted QA
-- user UUID before calling. Clients cannot invoke these server-only functions.
-- Same RPC contract as Assistant discovery; strict test-pass path, no free-basic
-- fallback. Avoids adding legacy membership/payment/Price Watch dependencies.
create function public.reserve_paid_ai_request(p_user uuid,p_request uuid)
returns jsonb language plpgsql security definer set search_path='' as $$
declare p public.trip_passes;
begin
 perform pg_advisory_xact_lock(hashtextextended(p_user::text,0));
 if exists(select 1 from public.ai_request_reservations
  where user_id=p_user and status='pending' and expires_at>now()) then
  return jsonb_build_object('allowed',false,'busy',true);
 end if;
 select * into p from public.trip_passes where user_id=p_user
  and payment_reference like 'owner-test:staging:%'
  and expires_at>now() and requests<request_limit
  order by expires_at desc limit 1 for update;
 if not found then return jsonb_build_object('allowed',false);end if;
 if exists(select 1 from public.ai_request_reservations where id=p_request) then
  return jsonb_build_object('allowed',false,'busy',true);
 end if;
 insert into public.ai_request_reservations(id,user_id,pass_id,expires_at)
 values(p_request,p_user,p.id,now()+interval '3 minutes');
 return jsonb_build_object('allowed',true);
end $$;

create function public.finish_ai_request(p_user uuid,p_request uuid,p_success boolean)
returns jsonb language plpgsql security definer set search_path='' as $$
declare r public.ai_request_reservations; changed uuid;
begin
 perform pg_advisory_xact_lock(hashtextextended(p_user::text,0));
 select * into r from public.ai_request_reservations
  where id=p_request and user_id=p_user for update;
 if not found then return jsonb_build_object('ok',false);end if;
 if p_success is null then return jsonb_build_object('ok',false);end if;
 if r.status<>'pending' then
  return jsonb_build_object('ok',(r.status='success' and p_success) or (r.status='failed' and not p_success));
 end if;
 if not p_success or r.expires_at<=now() then
  update public.ai_request_reservations set status='failed' where id=r.id;
  return jsonb_build_object('ok',not p_success);
 end if;
 update public.trip_passes set requests=requests+1
  where id=r.pass_id and user_id=p_user and expires_at>now()
   and payment_reference like 'owner-test:staging:%' and requests<request_limit
  returning id into changed;
 if changed is null then
  update public.ai_request_reservations set status='failed' where id=r.id;
  return jsonb_build_object('ok',false);
 end if;
 update public.ai_request_reservations set status='success' where id=r.id;
 return jsonb_build_object('ok',true);
end $$;
revoke all on function public.reserve_paid_ai_request(uuid,uuid),
 public.finish_ai_request(uuid,uuid,boolean) from public,anon,authenticated;
grant execute on function public.reserve_paid_ai_request(uuid,uuid),
 public.finish_ai_request(uuid,uuid,boolean) to service_role;
commit;
-- Review/test against Postgres after approval; no live SQL validation was run.
-- Does NOT install reserve_ai_request/basic quota: legacy /api/itinerary stays
-- disabled. Existing public.trips and its own-user RLS remain untouched.
