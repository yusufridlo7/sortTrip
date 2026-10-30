-- Phase 2 source migration, NOT APPLIED. Service-only global $10 test allocation.
-- Each request permanently consumes a conservative $0.05 allocation BEFORE
-- provider egress. Missing usage/timeouts/settlement failure never refund it.
-- This bounds this adapter's allocation, not other applications/account usage.
begin;
create table if not exists public.meta_video_test_budget (
 id boolean primary key default true check(id),
 allocated_usd numeric(10,6) not null default 0 check(allocated_usd between 0 and 10),
 blocked boolean not null default false
);
-- Preserve consumed allocation when upgrading an already-created test ledger.
alter table public.meta_video_test_budget drop constraint if exists meta_video_test_budget_allocated_usd_check;
alter table public.meta_video_test_budget add constraint meta_video_test_budget_allocated_usd_check check(allocated_usd between 0 and 10);
insert into public.meta_video_test_budget(id) values(true) on conflict do nothing;
alter table public.meta_video_test_budget add column if not exists blocked boolean not null default false;
create table if not exists public.meta_video_test_requests (
 id uuid primary key,
 user_id uuid not null references auth.users(id),
 created_at timestamptz not null default now(),
 settled_at timestamptz,
 estimated_usd numeric(12,8) check(estimated_usd>=0),
 input_tokens bigint check(input_tokens>=0),
 output_tokens bigint check(output_tokens>=0)
);
alter table public.meta_video_test_budget enable row level security;
alter table public.meta_video_test_requests enable row level security;
revoke all on public.meta_video_test_budget,public.meta_video_test_requests from public,anon,authenticated;
-- Aggregate readback for the server-only QA diagnostic, never client roles.
grant select on public.meta_video_test_budget to service_role;
create or replace function public.reserve_meta_video_test(p_request uuid,p_user uuid) returns jsonb
language plpgsql security definer set search_path=public,pg_temp as $$
declare current_allocation numeric;
begin
 select allocated_usd into current_allocation from meta_video_test_budget where id=true and not blocked for update;
 if current_allocation is null or current_allocation+0.05>10 then return jsonb_build_object('allowed',false);end if;
 -- Global row lock serializes both the allocation and per-user concurrency check.
 if exists(select 1 from meta_video_test_requests where user_id=p_user and settled_at is null and created_at>now()-interval '2 minutes') then return jsonb_build_object('allowed',false);end if;
 if (select count(*) from meta_video_test_requests where user_id=p_user)>=10 then return jsonb_build_object('allowed',false);end if;
 insert into meta_video_test_requests(id,user_id) values(p_request,p_user);
 update meta_video_test_budget set allocated_usd=allocated_usd+0.05 where id=true;
 return jsonb_build_object('allowed',true,'id',p_request,'hardCap',true,'totalLimitUSD',10,'reservedUSD',0.05);
end $$;
create or replace function public.settle_meta_video_test(p_request uuid,p_estimated_usd numeric,p_input_tokens bigint,p_output_tokens bigint) returns jsonb
language plpgsql security definer set search_path=public,pg_temp as $$
begin
 -- Usage is diagnostic, never a refund. If supplier usage exceeds the planned
 -- upper allocation, halt later reservations for explicit owner reconciliation.
 if p_estimated_usd>0.05 or p_input_tokens>20000 or p_output_tokens>2000 then
  update meta_video_test_budget set blocked=true where id=true;
 end if;
 update meta_video_test_requests set settled_at=now(),estimated_usd=p_estimated_usd,input_tokens=p_input_tokens,output_tokens=p_output_tokens where id=p_request and settled_at is null;
 return jsonb_build_object('ok',found);
end $$;
revoke all on function public.reserve_meta_video_test(uuid,uuid),public.settle_meta_video_test(uuid,numeric,bigint,bigint) from public,anon,authenticated;
grant execute on function public.reserve_meta_video_test(uuid,uuid),public.settle_meta_video_test(uuid,numeric,bigint,bigint) to service_role;
commit;
