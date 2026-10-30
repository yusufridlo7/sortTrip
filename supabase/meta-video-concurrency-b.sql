-- OWNER: QA aytrcvfncsklhqozreyk only. Run WHILE tab A is in its 20s sleep.
-- B can also be started FIRST; start A within 15 seconds in another session.
-- B calls the ACTUAL reserve function and requires it to wait on A's lock.
-- All writes are rolled back; no user ID or credential appears in results.
-- New name avoids return-type conflicts in a reused session.
create or replace function pg_temp.sorttrip_concurrency_probe_v2()
returns table(test text,passed boolean,detail text) language plpgsql as $$
declare qa_user uuid; rejected boolean:=false; independent_active boolean:=false;
 deadline timestamptz:=clock_timestamp()+interval '15 seconds';
begin
 begin
 perform set_config('lock_timeout','2s',true);
 -- Observe A's marker WITHOUT taking it ourselves, allowing B to wait for A.
 loop
  select exists(select 1 from pg_locks l
   where l.locktype='advisory' and l.granted
    and l.classid=27027::oid and l.objid=2026::oid and l.objsubid=2
    and l.database=(select d.oid from pg_database d where d.datname=current_database())
    and l.pid<>pg_backend_pid()) into independent_active;
  exit when independent_active or clock_timestamp()>=deadline;
  perform pg_sleep(0.2);
 end loop;
 -- Reserve takes the global lock before checking account history, so an
 -- existing QA user is sufficient; temporary writes always roll back.
 select u.id into qa_user from auth.users u order by u.created_at desc limit 1;
 if qa_user is null then raise exception 'QA account required'; end if;
 if independent_active then begin
  perform public.reserve_meta_video_test(gen_random_uuid(),qa_user);
 exception when lock_not_available then rejected:=true;
 end; end if;
 raise exception using errcode='PZ002',message='ROLLBACK_CONCURRENCY_PROBE';
 exception when sqlstate 'PZ002' then null;
 end;
 return query select 'independent_session_a_still_active',independent_active,
  case when independent_active then 'OVERLAP_CONFIRMED' else 'NO_OVERLAP_NOT_A_BUDGET_FAILURE' end
 union all select 'independent_session_reserve_waits_for_global_lock',rejected,
  case when rejected then 'LOCK_TIMEOUT_EXPECTED' when not independent_active then 'NOT_TESTED_NO_OVERLAP' else 'LOCK_WAIT_NOT_PROVEN' end;
end $$;
select * from pg_temp.sorttrip_concurrency_probe_v2();
-- The inner exception rolls back every temporary write before this result.
