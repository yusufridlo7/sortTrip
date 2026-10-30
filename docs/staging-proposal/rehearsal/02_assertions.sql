-- DISPOSABLE synthetic database ONLY. Actual run recorded in the rehearsal report.
BEGIN;
SET LOCAL statement_timeout='10s';
DO $$ DECLARE r jsonb; BEGIN
 IF current_database() NOT LIKE 'sorttrip_gate_d_rehearsal%' THEN RAISE EXCEPTION 'STOP disposable only'; END IF;
 r:=public.reserve_meta_video_test('00000000-0000-4000-8000-000000000011','00000000-0000-4000-8000-000000000001');
 IF (r->>'allowed') IS DISTINCT FROM 'true' THEN RAISE EXCEPTION 'first reserve'; END IF;
 UPDATE public.meta_video_test_requests SET created_at=now()-interval '1 day' WHERE id='00000000-0000-4000-8000-000000000011';
 r:=public.reserve_meta_video_test('00000000-0000-4000-8000-000000000012','00000000-0000-4000-8000-000000000002');
 IF (r->>'allowed') IS DISTINCT FROM 'false' THEN RAISE EXCEPTION 'stale global pending'; END IF;
 r:=public.settle_meta_video_test('00000000-0000-4000-8000-000000000011',NULL,NULL,NULL);
 IF (r->>'ok') IS DISTINCT FROM 'false' THEN RAISE EXCEPTION 'unknown usage'; END IF;
 r:=public.reserve_meta_video_test('00000000-0000-4000-8000-000000000012','00000000-0000-4000-8000-000000000002');
 IF (r->>'allowed') IS DISTINCT FROM 'false' THEN RAISE EXCEPTION 'unknown usage released occupancy'; END IF;
 r:=public.settle_meta_video_test('00000000-0000-4000-8000-000000000011',0.001,100,100);
 IF (r->>'ok') IS DISTINCT FROM 'true' THEN RAISE EXCEPTION 'normal settlement'; END IF;
 r:=public.settle_meta_video_test('00000000-0000-4000-8000-000000000011',0.001,100,2305);
 IF (r->>'ok') IS DISTINCT FROM 'false' OR EXISTS(SELECT FROM public.meta_video_test_budget WHERE blocked) THEN RAISE EXCEPTION 'replay reblocked'; END IF;
 r:=public.reserve_meta_video_test('00000000-0000-4000-8000-000000000011','00000000-0000-4000-8000-000000000002');
 IF (r->>'allowed') IS DISTINCT FROM 'false' THEN RAISE EXCEPTION 'duplicate'; END IF;
 r:=public.reserve_meta_video_test('00000000-0000-4000-8000-000000000012','00000000-0000-4000-8000-000000000002');
 IF (r->>'allowed') IS DISTINCT FROM 'true' THEN RAISE EXCEPTION 'normal release'; END IF;
END $$;
ROLLBACK;
