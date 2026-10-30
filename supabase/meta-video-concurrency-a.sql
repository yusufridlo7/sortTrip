-- OWNER: QA aytrcvfncsklhqozreyk only. Run the whole script in SQL tab A.
-- While A runs, immediately run meta-video-concurrency-b.sql in a second tab.
-- A holds the same global row lock used by reserve, then ROLLBACKS all writes.
-- No Meta call, permanent allocation, new function/grant or credential access.
begin;
set local statement_timeout='30s';
select allocated_usd, blocked from public.meta_video_test_budget where id=true for update;
select pg_advisory_xact_lock(27027,2026);
-- This delay deliberately leaves time for the independent B session to contend.
select pg_sleep(20);
rollback;
select 'session_a_lock_released' as test, true as passed;
