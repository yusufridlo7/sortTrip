-- Review only; QA project identity must be verified manually first.
BEGIN TRANSACTION READ ONLY;
SELECT allocated_usd,10-allocated_usd AS remaining_usd,blocked,
 (SELECT count(*) FROM public.meta_video_test_requests) AS requests,
 (SELECT count(*) FROM public.meta_video_test_requests WHERE settled_at IS NULL) AS pending
FROM public.meta_video_test_budget WHERE id=true;
SELECT p.proname,pg_get_userbyid(p.proowner) AS owner,md5(pg_get_functiondef(p.oid)) AS fingerprint,
 p.prosecdef,p.proconfig,has_function_privilege('service_role',p.oid,'EXECUTE') AS service_execute,
 has_function_privilege('anon',p.oid,'EXECUTE') AS anon_execute,
 has_function_privilege('authenticated',p.oid,'EXECUTE') AS authenticated_execute
FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
WHERE n.nspname='public' AND p.proname IN('reserve_meta_video_test','settle_meta_video_test','meta_video_test_safety_status');
SELECT relname,relrowsecurity FROM pg_class WHERE oid IN('public.meta_video_test_budget'::regclass,'public.meta_video_test_requests'::regclass);
COMMIT;
