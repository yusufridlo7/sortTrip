-- Start while A is in its bounded sleep. Expected: lock_not_available, not allocation.
BEGIN;
SET LOCAL lock_timeout='1s'; SET LOCAL statement_timeout='3s';
DO $$ BEGIN
 IF current_database() NOT LIKE 'sorttrip_gate_d_rehearsal%' THEN RAISE EXCEPTION 'STOP disposable only'; END IF;
 BEGIN
  PERFORM public.reserve_meta_video_test('00000000-0000-4000-8000-000000000022','00000000-0000-4000-8000-000000000002');
  RAISE EXCEPTION 'NO_OVERLAP: test invalid';
 EXCEPTION WHEN lock_not_available THEN RAISE NOTICE 'PASS: independent connection serialized'; END;
END $$;
ROLLBACK;
