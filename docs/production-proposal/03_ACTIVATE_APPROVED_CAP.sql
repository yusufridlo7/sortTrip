-- Owner approved cap USD100; execute only after production security gate passes.
-- Manually attest project tznxfgosmjcmwoszvkdk. Never run against QA.
BEGIN;
SET LOCAL lock_timeout='3s';
SET LOCAL statement_timeout='15s';
DO $$ DECLARE b public.meta_ai_budget; BEGIN
 IF NOT false THEN RAISE EXCEPTION 'Project/runtime security verification required'; END IF;
 SELECT * INTO STRICT b FROM public.meta_ai_budget WHERE id=true FOR UPDATE NOWAIT;
 IF clock_timestamp()>='2026-11-04T17:00:00Z'::timestamptz THEN RAISE EXCEPTION 'Meta expired'; END IF;
 IF b.allocated_usd<>0 OR b.total_limit_usd<>0 OR NOT b.blocked OR EXISTS(SELECT 1 FROM public.meta_ai_requests) THEN RAISE EXCEPTION 'Not initial empty ledger; do not reset'; END IF;
 UPDATE public.meta_ai_budget SET total_limit_usd=100,blocked=false WHERE id=true;
END $$;
COMMIT;
SELECT allocated_usd,total_limit_usd,blocked FROM public.meta_ai_budget;
