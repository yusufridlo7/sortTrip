-- OWNER-OPERATED QA ONLY: project aytrcvfncsklhqozreyk.
-- Execute the ENTIRE script together in SQL Editor after a QA user signs up.
-- The inner PL/pgSQL exception block rolls back ledger writes before returning rows.
-- No Meta/API/payment calls. Temporary ledger writes are rolled back at end.
-- This tests sequential DB behavior; parallel-session concurrency is separate.
create or replace function pg_temp.sorttrip_meta_budget_probe() returns table(test text,passed boolean)
language plpgsql as $$
declare
 qa_user uuid;
 request_a uuid:=gen_random_uuid();
 request_b uuid:=gen_random_uuid();
 request_c uuid:=gen_random_uuid();
 result_a jsonb;
 result_b jsonb;
 amount numeric;
 flag boolean;
 results jsonb:='[]'::jsonb;
begin
 begin
 -- Do not alter pre-existing user allocations. Require an unused QA user.
 select u.id into qa_user from auth.users u
 where not exists(select 1 from public.meta_video_test_requests r where r.user_id=u.id)
 order by u.created_at desc limit 1;
 if qa_user is null then raise exception 'QA user with no prior test allocations required';end if;
 -- Hold ledger lock for this isolated transaction; ROLLBACK restores its row.
 perform 1 from public.meta_video_test_budget where id=true for update;
 update public.meta_video_test_budget set allocated_usd=0,blocked=false where id=true;
 result_a:=public.reserve_meta_video_test(request_a,qa_user);
 result_b:=public.reserve_meta_video_test(request_b,qa_user);
 results:=results||jsonb_build_array(jsonb_build_object('test','reservation_allowed','passed',coalesce((result_a->>'allowed')::boolean,false)));
 results:=results||jsonb_build_array(jsonb_build_object('test','second_active_request_denied','passed',result_b->>'allowed'='false'));
 select allocated_usd into amount from public.meta_video_test_budget where id=true;
 results:=results||jsonb_build_array(jsonb_build_object('test','single_allocation_is_005_usd','passed',amount=0.05));
 perform public.settle_meta_video_test(request_a,0.001,100,50);
 select allocated_usd into amount from public.meta_video_test_budget where id=true;
 results:=results||jsonb_build_array(jsonb_build_object('test','settlement_does_not_refund','passed',amount=0.05));

 update public.meta_video_test_budget set allocated_usd=9.95 where id=true;
 result_a:=public.reserve_meta_video_test(request_c,qa_user);
 result_b:=public.reserve_meta_video_test(gen_random_uuid(),qa_user);
 select allocated_usd into amount from public.meta_video_test_budget where id=true;
 results:=results||jsonb_build_array(jsonb_build_object('test','last_allocation_reaches_10','passed',result_a->>'allowed'='true' and amount=10 and result_a->>'totalLimitUSD'='10'));
 results:=results||jsonb_build_array(jsonb_build_object('test','exhausted_budget_denied','passed',result_b->>'allowed'='false' and amount=10));

 flag:=false;
 begin
  update public.meta_video_test_budget set allocated_usd=10.01 where id=true;
 exception when check_violation then flag:=true;
 end;
 results:=results||jsonb_build_array(jsonb_build_object('test','database_constraint_denies_above_10','passed',flag));
 perform public.settle_meta_video_test(request_c,0.051,20001,2001);
 select blocked into flag from public.meta_video_test_budget where id=true;
 update public.meta_video_test_budget set allocated_usd=0 where id=true;
 result_b:=public.reserve_meta_video_test(gen_random_uuid(),qa_user);
 results:=results||jsonb_build_array(jsonb_build_object('test','unexpected_usage_halts_requests','passed',flag and result_b->>'allowed'='false'));
 results:=results||jsonb_build_array(jsonb_build_object('test','reservation_function_contains_row_lock','passed',position('for update' in lower(pg_get_functiondef('public.reserve_meta_video_test(uuid,uuid)'::regprocedure)))>0));
 -- Deliberately roll back ALL inner writes; local results variable survives.
 raise exception using errcode='PZ001',message='ROLLBACK_QA_PROBE';
 exception when sqlstate 'PZ001' then null;
 end;
 return query select j->>'test',(j->>'passed')::boolean from jsonb_array_elements(results) j order by j->>'test';
end $$;
select * from pg_temp.sorttrip_meta_budget_probe();
-- Run meta-video-budget-verify.sql again: allocation must match BEFORE this test.
-- Any false result is a failure; do not enable Meta analysis.
