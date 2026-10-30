-- DIAGNOSTIK HANYA BACA UNTUK REVIEW PRIVAT OWNER; BELUM DIJALANKAN.
-- QA aytrcvfncsklhqozreyk SAJA. Pastikan project-ref di dashboard secara manual.
-- Jangan jalankan pada production tznxfgosmjcmwoszvkdk atau gabungkan SQL06.
-- Tidak memanggil RPC, reserve/settle, model, atau fungsi aplikasi lain.
-- Bagian body fungsi mungkin mengandung konfigurasi privat pada implementasi
-- deployed yang belum diketahui. Tinjau HANYA di dashboard sendiri; jangan
-- salin hasil body/command/query/credential/identitas akun ke chat atau laporan.
BEGIN TRANSACTION ISOLATION LEVEL REPEATABLE READ READ ONLY;

WITH s AS (
 SELECT count(*) AS total_requests,
 count(*) FILTER(WHERE settled_at IS NULL) AS unsettled_requests,
 count(*) FILTER(WHERE output_tokens>2000) AS over_output_requests,
 max(output_tokens) AS maximum_output_tokens,
 count(*) FILTER(WHERE estimated_usd>0.05 OR input_tokens>20000) AS other_guard_overruns,
 count(*) FILTER(WHERE estimated_usd IS NULL OR input_tokens IS NULL OR output_tokens IS NULL)
   AS incomplete_usage_records
 FROM public.meta_video_test_requests
)
SELECT now() AS observed_at,b.allocated_usd,10-b.allocated_usd AS remaining_usd,
 b.blocked,s.*,b.allocated_usd=s.total_requests*0.05 AS allocation_reconciliation
FROM public.meta_video_test_budget b CROSS JOIN s WHERE b.id=true;

-- Expected identities/fingerprints, execution rights and definer attributes.
-- Function owner identity is deliberately not returned.
SELECT p.proname,pg_get_function_identity_arguments(p.oid) AS signature,
 md5(pg_get_functiondef(p.oid)) AS definition_fingerprint,
 p.prosecdef AS security_definer,
 -- Return only the required search_path setting, not arbitrary config entries.
 EXISTS(SELECT 1 FROM unnest(coalesce(p.proconfig,ARRAY[]::text[])) c
        WHERE replace(c,' ','')='search_path=public,pg_temp') AS expected_search_path,
 o.rolsuper AS definer_is_superuser,o.rolbypassrls AS definer_bypasses_rls,
 has_function_privilege('anon',p.oid,'EXECUTE') AS anon_can_execute,
 has_function_privilege('authenticated',p.oid,'EXECUTE') AS authenticated_can_execute,
 has_function_privilege('service_role',p.oid,'EXECUTE') AS service_can_execute,
 EXISTS(SELECT 1 FROM aclexplode(coalesce(p.proacl,acldefault('f',p.proowner))) a
        WHERE a.grantee=0 AND a.privilege_type='EXECUTE') AS public_can_execute
FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
JOIN pg_roles o ON o.oid=p.proowner
WHERE n.nspname='public' AND p.prokind='f'
AND p.proname IN ('reserve_meta_video_test','settle_meta_video_test')
ORDER BY p.proname,signature;

SELECT c.relname AS ledger_table,c.relrowsecurity AS rls_enabled,
 c.relforcerowsecurity AS force_rls,
 has_table_privilege('anon',c.oid,'SELECT,INSERT,UPDATE,DELETE') AS anon_has_any_data_privilege,
 has_table_privilege('authenticated',c.oid,'SELECT,INSERT,UPDATE,DELETE') AS authenticated_has_any_data_privilege,
 has_table_privilege('service_role',c.oid,'INSERT,UPDATE,DELETE') AS service_has_any_direct_write_privilege,
 EXISTS(SELECT 1 FROM aclexplode(coalesce(c.relacl,acldefault('r',c.relowner))) a
        WHERE a.grantee=0 AND a.privilege_type IN ('SELECT','INSERT','UPDATE','DELETE')) AS public_has_data_privilege
FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace
WHERE n.nspname='public' AND c.relname IN ('meta_video_test_budget','meta_video_test_requests');

SELECT has_schema_privilege('anon','public','CREATE') AS anon_can_create_in_public,
 has_schema_privilege('authenticated','public','CREATE') AS authenticated_can_create_in_public;

-- FULL BODIES: owner-private review only. Compare all branches/update ordering
-- with supabase/meta-video-budget.sql, not merely a substring or fingerprint.
SELECT p.proname,pg_get_function_identity_arguments(p.oid) AS signature,
 pg_get_functiondef(p.oid) AS private_deployed_definition
FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
WHERE n.nspname='public' AND p.prokind='f'
AND p.proname IN ('reserve_meta_video_test','settle_meta_video_test')
ORDER BY p.proname,signature;

-- Candidate functions/procedures by text reference, without exposing bodies.
-- This cannot discover every indirect/dynamic SQL/external HTTP writer.
SELECT n.nspname AS function_schema,p.proname,p.prokind,
 pg_get_function_identity_arguments(p.oid) AS signature,
 md5(p.prosrc) AS source_fingerprint
FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
WHERE n.nspname NOT IN ('pg_catalog','information_schema') AND p.prokind IN ('f','p')
AND (p.prosrc ILIKE '%meta_video_test_budget%' OR p.prosrc ILIKE '%meta_video_test_requests%'
 OR p.prosrc ILIKE '%reserve_meta_video_test%' OR p.prosrc ILIKE '%settle_meta_video_test%')
ORDER BY n.nspname,p.proname;

SELECT c.relname AS ledger_table,t.tgname AS trigger_name,t.tgisinternal,
 t.tgenabled,n.nspname AS function_schema,p.proname AS trigger_function,
 md5(p.prosrc) AS source_fingerprint
FROM pg_trigger t JOIN pg_class c ON c.oid=t.tgrelid
JOIN pg_namespace tn ON tn.oid=c.relnamespace
JOIN pg_proc p ON p.oid=t.tgfoid JOIN pg_namespace n ON n.oid=p.pronamespace
WHERE tn.nspname='public' AND c.relname IN ('meta_video_test_budget','meta_video_test_requests')
ORDER BY c.relname,t.tgname;

SELECT c.relname AS ledger_table,r.rulename
FROM pg_rewrite r JOIN pg_class c ON c.oid=r.ev_class
JOIN pg_namespace n ON n.oid=c.relnamespace
WHERE n.nspname='public' AND c.relname IN ('meta_video_test_budget','meta_video_test_requests');

-- No session IDs, queries, users, connections or command text are returned.
-- Counts are a snapshot, NOT proof that delayed external requests cannot arrive.
SELECT (SELECT rolsuper FROM pg_roles WHERE rolname=current_user)
 OR pg_has_role(current_user,'pg_read_all_stats','USAGE') AS can_see_other_session_queries,
 count(*) FILTER(WHERE pid<>pg_backend_pid() AND state IS DISTINCT FROM 'idle'
   AND (query ILIKE '%meta_video_test_budget%' OR query ILIKE '%meta_video_test_requests%'
     OR query ILIKE '%reserve_meta_video_test%' OR query ILIKE '%settle_meta_video_test%'))
   AS visible_active_ledger_query_candidates,
 count(*) FILTER(WHERE pid<>pg_backend_pid() AND query IS NULL) AS hidden_query_sessions,
 to_regclass('cron.job') IS NOT NULL AS cron_jobs_catalog_present
FROM pg_stat_activity;
COMMIT;

-- OPTIONAL SEPARATE READ-ONLY REVIEW, ONLY IF cron_jobs_catalog_present=true
-- and owner has read permission. Intentionally commented; absent cron catalog
-- must not make the main diagnostic fail. Do not output cron command strings.
-- BEGIN READ ONLY;
-- SELECT count(*) AS jobs_total,count(*) FILTER(WHERE active) AS jobs_active,
-- count(*) FILTER(WHERE active AND
--   (command ILIKE '%meta_video_test_%' OR command ILIKE '%meta_video_test%'
--    OR command ILIKE '%assistant/discover%' OR command ILIKE '%budget-probe%'
--    OR command ILIKE '%http_post%')) AS active_writer_candidates
-- FROM cron.job;
-- COMMIT;
-- Any candidate requires private owner dashboard review, including indirect
-- wrappers. No automated job disable, SQL06, repair, grant or inference here.
