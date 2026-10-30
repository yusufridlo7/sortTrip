-- PROPOSAL ONLY — NOT EXECUTED. Owner review/apply on QA aytrcvfncsklhqozreyk only.
-- No recovery/reset, no data updates, no new allocations, no limit increases.
-- Drain writers first. Preserve $10 total/$0.05 reservation/10 attempts per user.
BEGIN;
SET LOCAL lock_timeout='2s';
SET LOCAL statement_timeout='10s';
SET LOCAL search_path=pg_catalog,pg_temp;
LOCK TABLE public.meta_video_test_budget,public.meta_video_test_requests IN EXCLUSIVE MODE NOWAIT;
-- Supabase project-ref is not a portable PostgreSQL database identity. Owner
-- must verify the dashboard first; this attestation is deliberately closed.
DO $preflight$
DECLARE
 verified_project_ref constant text := 'UNVERIFIED';
 configured_url text := current_setting('app.settings.supabase_url',true);
 n bigint; pending bigint; over_output bigint; max_output bigint;
BEGIN
 IF current_user<>'postgres' THEN RAISE EXCEPTION 'STOP expected migration owner'; END IF;
 IF verified_project_ref<>'aytrcvfncsklhqozreyk' THEN RAISE EXCEPTION 'STOP verify QA dashboard/project'; END IF;
 IF configured_url IS NOT NULL AND configured_url<>'' AND rtrim(configured_url,'/')<>'https://aytrcvfncsklhqozreyk.supabase.co' THEN
  RAISE EXCEPTION 'STOP configured project mismatch'; END IF;
 IF (SELECT count(*) FROM public.meta_video_test_budget)<>1 OR NOT EXISTS
 (SELECT 1 FROM public.meta_video_test_budget WHERE id=true AND allocated_usd=0.35 AND blocked=false)
 THEN RAISE EXCEPTION 'STOP recovered baseline changed'; END IF;
 SELECT count(*),count(*) FILTER(WHERE settled_at IS NULL),count(*) FILTER(WHERE output_tokens>2000),max(output_tokens)
 INTO n,pending,over_output,max_output FROM public.meta_video_test_requests;
 IF n<>7 OR pending<>0 OR over_output<>1 OR max_output IS DISTINCT FROM 2305
 OR EXISTS(SELECT 1 FROM public.meta_video_test_requests WHERE estimated_usd>0.05 OR input_tokens>20000)
 THEN RAISE EXCEPTION 'STOP request baseline changed'; END IF;
 IF (SELECT count(*) FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace WHERE n.nspname='public' AND p.proname IN('reserve_meta_video_test','settle_meta_video_test'))<>2
 OR md5(pg_get_functiondef('public.reserve_meta_video_test(uuid,uuid)'::regprocedure))<>'2f5b3af8ada27fe6076cea1e91a7ee33'
 OR md5(pg_get_functiondef('public.settle_meta_video_test(uuid,numeric,bigint,bigint)'::regprocedure))<>'32847c39624929a29a3db9db0947b713'
 OR to_regprocedure('public.meta_video_test_safety_status()') IS NOT NULL
 THEN RAISE EXCEPTION 'STOP deployed definition drift'; END IF;
 IF EXISTS(SELECT 1 FROM pg_trigger WHERE tgrelid IN ('public.meta_video_test_budget'::regclass,'public.meta_video_test_requests'::regclass) AND NOT tgisinternal)
 THEN RAISE EXCEPTION 'STOP unexpected trigger'; END IF;
 -- Ownership is pinned conservatively, never silently reassigned. If actual
 -- owner differs, review and obtain approval for a tailored proposal.
 IF EXISTS(SELECT 1 FROM pg_proc p WHERE p.oid IN
 ('public.reserve_meta_video_test(uuid,uuid)'::regprocedure,'public.settle_meta_video_test(uuid,numeric,bigint,bigint)'::regprocedure)
 AND (pg_get_userbyid(p.proowner)<>'postgres' OR NOT p.prosecdef OR
 NOT ('search_path=public, pg_temp'=ANY(coalesce(p.proconfig,ARRAY[]::text[]))) OR
 NOT has_function_privilege('service_role',p.oid,'EXECUTE') OR
 EXISTS(SELECT 1 FROM aclexplode(coalesce(p.proacl,acldefault('f',p.proowner))) a
 WHERE a.grantee NOT IN (p.proowner,'service_role'::regrole::oid) OR (a.grantee<>p.proowner AND a.is_grantable))))
 THEN RAISE EXCEPTION 'STOP ownership/ACL/search_path mismatch'; END IF;
 PERFORM set_config('sorttrip.gate_d_history', (SELECT md5(string_agg(to_jsonb(r)::text,E'\n' ORDER BY id)) FROM public.meta_video_test_requests r), true);
 PERFORM set_config('sorttrip.gate_d_budget', (SELECT md5(to_jsonb(b)::text) FROM public.meta_video_test_budget b), true);
END $preflight$;
CREATE OR REPLACE FUNCTION public.reserve_meta_video_test(p_request uuid,p_user uuid) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE allocation numeric;
BEGIN
 SELECT allocated_usd INTO allocation FROM public.meta_video_test_budget WHERE id=true AND NOT blocked FOR UPDATE;
 IF allocation IS NULL OR allocation+0.05>10 THEN RETURN jsonb_build_object('allowed',false); END IF;
 -- No expiry: timeout does not prove the upstream request stopped/billing ended.
 IF EXISTS(SELECT 1 FROM public.meta_video_test_requests WHERE settled_at IS NULL)
 OR EXISTS(SELECT 1 FROM public.meta_video_test_requests WHERE id=p_request)
 OR (SELECT count(*) FROM public.meta_video_test_requests WHERE user_id=p_user)>=10
 THEN RETURN jsonb_build_object('allowed',false); END IF;
 INSERT INTO public.meta_video_test_requests(id,user_id) VALUES(p_request,p_user);
 UPDATE public.meta_video_test_budget SET allocated_usd=allocated_usd+0.05 WHERE id=true;
 RETURN jsonb_build_object('allowed',true,'id',p_request,'hardCap',true,'globalExclusive',true,'totalLimitUSD',10,'reservedUSD',0.05);
END $$;
CREATE OR REPLACE FUNCTION public.settle_meta_video_test(p_request uuid,p_estimated_usd numeric,p_input_tokens bigint,p_output_tokens bigint) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
BEGIN
 -- Same lock order as reserve, serializes global pending + finalization.
 PERFORM 1 FROM public.meta_video_test_budget WHERE id=true FOR UPDATE;
 IF NOT FOUND THEN RETURN jsonb_build_object('ok',false); END IF;
 PERFORM 1 FROM public.meta_video_test_requests WHERE id=p_request AND settled_at IS NULL FOR UPDATE;
 IF NOT FOUND THEN RETURN jsonb_build_object('ok',false); END IF;
 -- Unknown usage requires investigation: retain pending and halt all new calls.
 IF p_estimated_usd IS NULL OR p_input_tokens IS NULL OR p_output_tokens IS NULL
 OR p_estimated_usd<0 OR p_input_tokens<0 OR p_output_tokens<0 THEN
  RETURN jsonb_build_object('ok',false);
 END IF;
 IF p_estimated_usd>0.05 OR p_input_tokens>20000 OR p_output_tokens>2000 THEN
  UPDATE public.meta_video_test_budget SET blocked=true WHERE id=true;
 END IF;
 UPDATE public.meta_video_test_requests SET settled_at=now(),estimated_usd=p_estimated_usd,
 input_tokens=p_input_tokens,output_tokens=p_output_tokens WHERE id=p_request;
 RETURN jsonb_build_object('ok',true);
END $$;
CREATE OR REPLACE FUNCTION public.meta_video_test_safety_status() RETURNS jsonb
LANGUAGE sql SECURITY DEFINER SET search_path=public,pg_temp
AS $$ SELECT jsonb_build_object('version',2,'globalExclusive',true) $$;
REVOKE ALL ON FUNCTION public.meta_video_test_safety_status() FROM public,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.meta_video_test_safety_status() TO service_role;
-- Existing reserve/settle ACLs are preserved by CREATE OR REPLACE.
-- Verify them privately before applying; abort if PUBLIC/anon/authenticated execute.
DO $$ BEGIN
 IF current_setting('sorttrip.gate_d_history') IS DISTINCT FROM (SELECT md5(string_agg(to_jsonb(r)::text,E'\n' ORDER BY id)) FROM public.meta_video_test_requests r) OR current_setting('sorttrip.gate_d_budget') IS DISTINCT FROM (SELECT md5(to_jsonb(b)::text) FROM public.meta_video_test_budget b) THEN RAISE EXCEPTION 'STOP data changed'; END IF;
 IF EXISTS(SELECT 1 FROM pg_proc p WHERE p.oid IN
 ('public.reserve_meta_video_test(uuid,uuid)'::regprocedure,'public.settle_meta_video_test(uuid,numeric,bigint,bigint)'::regprocedure,'public.meta_video_test_safety_status()'::regprocedure)
 AND (pg_get_userbyid(p.proowner)<>'postgres' OR NOT p.prosecdef OR NOT ('search_path=public, pg_temp'=ANY(coalesce(p.proconfig,ARRAY[]::text[]))) OR NOT has_function_privilege('service_role',p.oid,'EXECUTE') OR EXISTS(SELECT 1 FROM aclexplode(coalesce(p.proacl,acldefault('f',p.proowner))) a WHERE a.grantee NOT IN(p.proowner,'service_role'::regrole::oid) OR (a.grantee<>p.proowner AND a.is_grantable)) OR has_function_privilege('anon',p.oid,'EXECUTE') OR has_function_privilege('authenticated',p.oid,'EXECUTE')))
 THEN RAISE EXCEPTION 'STOP unsafe existing ACL'; END IF;
END $$;
COMMIT;
-- Rollback is not an unblock/reset: stop inference and restore reviewed function
-- definitions only under separate approval. Never remove stale requests to retry.
-- This proposal changes fingerprints. Old SQL06 must NOT be rerun afterwards.
