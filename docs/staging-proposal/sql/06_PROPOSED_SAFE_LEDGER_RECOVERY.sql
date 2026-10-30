-- NOT APPROVED — DO NOT EXECUTE
-- SELURUH BERKAS ADALAH USULAN PEMULIHAN, BUKAN MIGRASI/AUTOMASI.
-- Khusus QA aytrcvfncsklhqozreyk. Production tznxfgosmjcmwoszvkdk DILARANG.
-- Project-ref wajib diverifikasi MANUAL di dashboard; SQL tidak membuktikan
-- identitas proyek. Gate teks di bawah hanya attestation owner, bukan deteksi.
-- Jangan jalankan, termasuk sebagai rehearsal: transaksi ini mengusulkan write.
-- Setelah izin TERPISAH: owner review semua SQL dan body RPC deployed secara
-- privat; hentikan/drain seluruh Worker, job, tab pengujian dan admin writer QA.
-- Jangan gunakan pg_sleep, reserve/settle probe, inference atau retry untuk uji.
-- Biarkan writer berhenti sampai verifikasi sesudah COMMIT selesai.
-- Empat gate false dan project placeholder sengaja membuat usulan fail closed.
-- Mengedit gate saja BUKAN izin eksekusi. Agent tidak mengedit/mengeksekusinya.

BEGIN;
SET LOCAL lock_timeout = '2s';
SET LOCAL statement_timeout = '10s';
SET LOCAL search_path = pg_catalog, pg_temp;

DO $proposal$
DECLARE
  owner_verified_project_ref constant text := 'UNVERIFIED';
  owner_approved_this_recovery constant boolean := false;
  all_qa_writers_stopped_and_drained constant boolean := false;
  deployed_functions_privately_reviewed constant boolean := false;
  current_runtime_caps_and_usage_reviewed constant boolean := false;
  v_allocated numeric;
  v_blocked boolean;
  v_total bigint;
  v_unsettled bigint;
  v_over_output bigint;
  v_max_output bigint;
  v_other_overruns bigint;
  v_history_before text;
  v_history_after text;
  v_affected bigint;
BEGIN
  IF owner_verified_project_ref <> 'aytrcvfncsklhqozreyk'
     OR NOT owner_approved_this_recovery
     OR NOT all_qa_writers_stopped_and_drained
     OR NOT deployed_functions_privately_reviewed
     OR NOT current_runtime_caps_and_usage_reviewed THEN
    RAISE EXCEPTION 'STOP: owner approval and all manual safety gates required';
  END IF;

  -- Transient transaction locks, no schema/grant changes. NOWAIT aborts on
  -- conflicting activity; never wait for an active writer or retry automatically.
  -- EXCLUSIVE also conflicts with SELECT FOR UPDATE used by reserve.
  LOCK TABLE public.meta_video_test_budget, public.meta_video_test_requests
    IN EXCLUSIVE MODE NOWAIT;

  IF (SELECT count(*) FROM public.meta_video_test_budget) <> 1 THEN
    RAISE EXCEPTION 'STOP: expected exactly one ledger row';
  END IF;
  SELECT allocated_usd, blocked INTO STRICT v_allocated, v_blocked
    FROM public.meta_video_test_budget WHERE id=true FOR UPDATE;
  IF v_blocked IS DISTINCT FROM true OR v_allocated IS DISTINCT FROM 0.350000 THEN
    RAISE EXCEPTION 'STOP: ledger differs from approved blocked/0.35 snapshot';
  END IF;

  -- Fingerprints pin the owner-observed definitions, NOT their semantic safety.
  -- Private full-body review and admin-change freeze remain mandatory.
  IF (SELECT count(*) FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
      WHERE n.nspname='public'
        AND p.proname IN ('reserve_meta_video_test','settle_meta_video_test')) <> 2
     OR md5(pg_get_functiondef('public.reserve_meta_video_test(uuid,uuid)'::regprocedure))
          IS DISTINCT FROM '2f5b3af8ada27fe6076cea1e91a7ee33'
     OR md5(pg_get_functiondef('public.settle_meta_video_test(uuid,numeric,bigint,bigint)'::regprocedure))
          IS DISTINCT FROM '32847c39624929a29a3db9db0947b713' THEN
    RAISE EXCEPTION 'STOP: deployed RPC definitions/signatures changed or missing';
  END IF;
  -- Unexpected user triggers can introduce writes/side effects. Do not disable
  -- them to make this proposal pass; stop and request another review instead.
  IF EXISTS (
    SELECT 1 FROM pg_trigger
    WHERE tgrelid IN ('public.meta_video_test_budget'::regclass,
                     'public.meta_video_test_requests'::regclass)
      AND NOT tgisinternal
  ) THEN
    RAISE EXCEPTION 'STOP: unexpected user trigger requires separate review';
  END IF;

  SELECT count(*), count(*) FILTER (WHERE settled_at IS NULL),
    count(*) FILTER (WHERE output_tokens>2000), max(output_tokens),
    count(*) FILTER (WHERE estimated_usd>0.05 OR input_tokens>20000),
    md5(string_agg(to_jsonb(r)::text, E'\n' ORDER BY r.id))
  INTO v_total,v_unsettled,v_over_output,v_max_output,v_other_overruns,v_history_before
  FROM public.meta_video_test_requests r;

  IF v_total <> 7 OR v_unsettled <> 0
     OR v_allocated IS DISTINCT FROM v_total*0.05
     OR v_over_output <> 1 OR v_max_output IS DISTINCT FROM 2305
     OR v_other_overruns <> 0 THEN
    RAISE EXCEPTION 'STOP: global requests, usage or allocation reconciliation changed';
  END IF;
  -- NULL usage may represent historical no-inference probes/uncertain usage;
  -- owner must reconcile it privately before attesting usage reviewed above.
  -- Historical 2305 output is preserved, not clamped, deleted or re-settled.

  -- THE ONLY PROPOSED PERSISTENT WRITE. No allocation/schema/permissions change.
  UPDATE public.meta_video_test_budget SET blocked=false
    WHERE id=true AND blocked=true AND allocated_usd=0.350000;
  GET DIAGNOSTICS v_affected = ROW_COUNT;
  IF v_affected <> 1 THEN
    RAISE EXCEPTION 'STOP: expected exactly one flag update';
  END IF;

  SELECT md5(string_agg(to_jsonb(r)::text, E'\n' ORDER BY r.id))
    INTO v_history_after FROM public.meta_video_test_requests r;
  IF v_history_after IS DISTINCT FROM v_history_before
     OR (SELECT count(*) FROM public.meta_video_test_budget) <> 1
     OR NOT EXISTS (SELECT 1 FROM public.meta_video_test_budget
                    WHERE id=true AND blocked=false AND allocated_usd=0.350000) THEN
    RAISE EXCEPTION 'STOP: post-update invariants failed; transaction must roll back';
  END IF;
END;
$proposal$;

-- Successful validation is required for COMMIT. Any exception aborts the whole
-- transaction. On error: issue ROLLBACK, keep all writers stopped, do not retry.
COMMIT;

-- READ-ONLY POST-RECOVERY VERIFICATION; also safe to review/run separately
-- with owner approval on QA only. Does not reserve, settle or call Meta.
BEGIN TRANSACTION ISOLATION LEVEL REPEATABLE READ READ ONLY;
WITH s AS (
  SELECT count(*) AS total_requests,
    count(*) FILTER (WHERE settled_at IS NULL) AS unsettled_requests,
    count(*) FILTER (WHERE output_tokens>2000) AS over_output_requests,
    max(output_tokens) AS maximum_output_tokens
  FROM public.meta_video_test_requests
)
SELECT b.allocated_usd,10-b.allocated_usd AS remaining_allocation_usd,b.blocked,
  s.*,b.allocated_usd=s.total_requests*0.05 AS allocation_reconciliation,
  (b.blocked=false AND b.allocated_usd=0.35 AND s.total_requests=7
   AND s.unsettled_requests=0 AND s.over_output_requests=1
   AND s.maximum_output_tokens=2305
   AND b.allocated_usd=s.total_requests*0.05) AS expected_post_recovery_state
FROM public.meta_video_test_budget b CROSS JOIN s WHERE b.id=true;
COMMIT;

-- STOP/ROLLBACK:
-- Before COMMIT, an error aborts all writes; owner issues ROLLBACK and stops.
-- After COMMIT, ROLLBACK cannot undo it. If verification differs, block/reblock
-- recurs or a late writer appears: stop all QA inference, preserve records and
-- obtain separate approval for a flag-only reblock proposal. No reset/refund,
-- deletion, guard increase, historical settlement replay or automatic unblock.
-- This file does NOT restart writers, enable flags, grant entitlement or permit
-- paid inference. Each requires separate owner authorization after verification.
-- NOT APPROVED — DO NOT EXECUTE
