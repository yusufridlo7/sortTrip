-- OWNER: read-only metadata, QA aytrcvfncsklhqozreyk only. No secrets/user rows.
select
 has_schema_privilege('service_role','public','USAGE') as service_schema_usage,
 has_table_privilege('service_role','public.meta_video_test_budget','SELECT') as service_budget_read_allowed,
 has_function_privilege('service_role','public.reserve_meta_video_test(uuid,uuid)','EXECUTE') as service_reserve_allowed,
 has_function_privilege('service_role','public.settle_meta_video_test(uuid,numeric,bigint,bigint)','EXECUTE') as service_settle_allowed,
 not has_table_privilege('anon','public.meta_video_test_budget','SELECT') as anon_budget_read_denied,
 not has_table_privilege('authenticated','public.meta_video_test_budget','SELECT') as authenticated_budget_read_denied;
-- All six should be true. If service_budget_read_allowed=false, owner reviews
-- and runs meta-video-budget-service-read.sql. Do not reveal/rotate keys.
