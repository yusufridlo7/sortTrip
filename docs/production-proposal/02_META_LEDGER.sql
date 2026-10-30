-- PROPOSAL ONLY — NOT APPROVED. Manual project attestation required:
-- tznxfgosmjcmwoszvkdk. New empty production ledger; no QA data copied.
BEGIN;
SET LOCAL lock_timeout='3s';
SET LOCAL statement_timeout='15s';
DO $$ BEGIN
 IF NOT false THEN RAISE EXCEPTION 'Owner approval/project attestation required'; END IF;
 IF to_regclass('public.meta_ai_budget') IS NOT NULL OR to_regclass('public.meta_ai_requests') IS NOT NULL THEN RAISE EXCEPTION 'Objects already exist; stop for review'; END IF;
END $$;
CREATE TABLE public.meta_ai_budget (
 id boolean PRIMARY KEY DEFAULT true CHECK(id),
 allocated_usd numeric NOT NULL DEFAULT 0 CHECK(allocated_usd>=0),
 total_limit_usd numeric NOT NULL DEFAULT 0 CHECK(total_limit_usd BETWEEN 0 AND 100),
 blocked boolean NOT NULL DEFAULT true,
 CHECK(allocated_usd<=total_limit_usd)
);
INSERT INTO public.meta_ai_budget(id) VALUES(true);
CREATE TABLE public.meta_ai_requests (
 id uuid PRIMARY KEY,user_id uuid NOT NULL REFERENCES auth.users(id),
 created_at timestamptz NOT NULL DEFAULT now(),settled_at timestamptz,
 estimated_usd numeric CHECK(estimated_usd>=0),input_tokens bigint CHECK(input_tokens>=0),output_tokens bigint CHECK(output_tokens>=0)
);
ALTER TABLE public.meta_ai_budget ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meta_ai_requests ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.meta_ai_budget,public.meta_ai_requests FROM public,anon,authenticated,service_role;
CREATE FUNCTION public.meta_ai_safety_status() RETURNS jsonb
LANGUAGE sql SECURITY DEFINER SET search_path='' AS $$ SELECT jsonb_build_object('version',2,'globalExclusive',true) $$;
CREATE FUNCTION public.reserve_meta_ai_request(p_request uuid,p_user uuid) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE b public.meta_ai_budget;
BEGIN
 SELECT * INTO STRICT b FROM public.meta_ai_budget WHERE id=true FOR UPDATE NOWAIT;
 IF clock_timestamp() >= '2026-11-04T17:00:00Z'::timestamptz OR b.blocked OR b.allocated_usd+0.05>b.total_limit_usd
 OR EXISTS(SELECT 1 FROM public.meta_ai_requests WHERE id=p_request OR settled_at IS NULL)
 THEN RETURN jsonb_build_object('allowed',false); END IF;
 INSERT INTO public.meta_ai_requests(id,user_id) VALUES(p_request,p_user);
 UPDATE public.meta_ai_budget SET allocated_usd=allocated_usd+0.05 WHERE id=true;
 RETURN jsonb_build_object('allowed',true,'id',p_request,'hardCap',true,'totalLimitUSD',b.total_limit_usd,'reservedUSD',0.05,'globalExclusive',true);
END $$;
CREATE FUNCTION public.settle_meta_ai_request(p_request uuid,p_estimated_usd numeric,p_input_tokens bigint,p_output_tokens bigint) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE r public.meta_ai_requests;
BEGIN
 PERFORM 1 FROM public.meta_ai_budget WHERE id=true FOR UPDATE;
 SELECT * INTO r FROM public.meta_ai_requests WHERE id=p_request FOR UPDATE;
 IF NOT FOUND THEN RETURN jsonb_build_object('ok',false); END IF;
 IF r.settled_at IS NOT NULL THEN
 RETURN jsonb_build_object('ok',r.estimated_usd IS NOT DISTINCT FROM p_estimated_usd AND r.input_tokens IS NOT DISTINCT FROM p_input_tokens AND r.output_tokens IS NOT DISTINCT FROM p_output_tokens);
 END IF;
 IF p_estimated_usd IS NULL OR p_input_tokens IS NULL OR p_output_tokens IS NULL
 OR p_estimated_usd<0 OR p_input_tokens<0 OR p_output_tokens<0 THEN
 UPDATE public.meta_ai_budget SET blocked=true WHERE id=true;
 RETURN jsonb_build_object('ok',false);
 END IF;
 IF p_estimated_usd>0.05 OR p_input_tokens>20000 OR p_output_tokens>2000 THEN
 UPDATE public.meta_ai_budget SET blocked=true WHERE id=true;
 END IF;
 UPDATE public.meta_ai_requests SET settled_at=now(),estimated_usd=p_estimated_usd,input_tokens=p_input_tokens,output_tokens=p_output_tokens WHERE id=p_request;
 RETURN jsonb_build_object('ok',true);
END $$;
REVOKE ALL ON FUNCTION public.meta_ai_safety_status(),public.reserve_meta_ai_request(uuid,uuid),public.settle_meta_ai_request(uuid,numeric,bigint,bigint) FROM public,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.meta_ai_safety_status(),public.reserve_meta_ai_request(uuid,uuid),public.settle_meta_ai_request(uuid,numeric,bigint,bigint) TO service_role;
-- No spend activation: limit=0, blocked=true. Separate approved activation needed.
COMMIT;
-- Read-only postflight. Do not drop/reset ledger as rollback after usage.
SELECT allocated_usd,total_limit_usd,blocked,(SELECT count(*) FROM public.meta_ai_requests) requests FROM public.meta_ai_budget;
-- Rollback before COMMIT: ROLLBACK. After deployment: disable Worker Meta flags;
-- preserve these tables and all records. No automatic deletion/down migration.
