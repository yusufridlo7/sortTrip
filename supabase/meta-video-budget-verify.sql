-- Read-only checks. Run AFTER meta-video-budget.sql, in QA project
-- aytrcvfncsklhqozreyk only. No credentials, user IDs, media or reservations read.
select
 allocated_usd,
 10::numeric as total_limit_usd,
 10-allocated_usd as remaining_allocation_usd,
 blocked,
 (select relrowsecurity from pg_class where oid='public.meta_video_test_budget'::regclass) as budget_rls_enabled,
 (select relrowsecurity from pg_class where oid='public.meta_video_test_requests'::regclass) as requests_rls_enabled,
 not has_table_privilege('anon','public.meta_video_test_budget','SELECT') as anon_budget_read_denied,
 not has_table_privilege('authenticated','public.meta_video_test_budget','SELECT') as authenticated_budget_read_denied,
 not has_table_privilege('anon','public.meta_video_test_requests','SELECT') as anon_requests_read_denied,
 not has_table_privilege('authenticated','public.meta_video_test_requests','SELECT') as authenticated_requests_read_denied,
 not has_function_privilege('anon','public.reserve_meta_video_test(uuid,uuid)','EXECUTE') as anon_reserve_denied,
 not has_function_privilege('authenticated','public.reserve_meta_video_test(uuid,uuid)','EXECUTE') as authenticated_reserve_denied,
 has_function_privilege('service_role','public.reserve_meta_video_test(uuid,uuid)','EXECUTE') as service_reserve_allowed,
 not has_function_privilege('anon','public.settle_meta_video_test(uuid,numeric,bigint,bigint)','EXECUTE') as anon_settle_denied,
 not has_function_privilege('authenticated','public.settle_meta_video_test(uuid,numeric,bigint,bigint)','EXECUTE') as authenticated_settle_denied,
 has_function_privilege('service_role','public.settle_meta_video_test(uuid,numeric,bigint,bigint)','EXECUTE') as service_settle_allowed
from public.meta_video_test_budget where id=true;

-- For a NEW ledger: allocated=0, total=10, remaining=10, blocked=false,
-- all *_enabled/*_denied/*_allowed fields=true. Existing consumed allocation
-- must remain; do not reset it to make these numbers match.
-- This checks source-installed state, NOT concurrent behavior, entitlement,
-- token-count billing, actual Meta usage or itinerary RLS between two users.
