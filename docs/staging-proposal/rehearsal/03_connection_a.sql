-- Disposable database only, independent connection A; holds lock 20 seconds.
BEGIN;
SET LOCAL statement_timeout='25s';
DO $$ BEGIN IF current_database() NOT LIKE 'sorttrip_gate_d_rehearsal%' THEN RAISE EXCEPTION 'STOP disposable only'; END IF; END $$;
SELECT public.reserve_meta_video_test('00000000-0000-4000-8000-000000000021','00000000-0000-4000-8000-000000000001');
SELECT pg_sleep(20);
ROLLBACK;
