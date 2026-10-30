-- OWNER: read-only aggregate/schema checks, QA aytrcvfncsklhqozreyk only.
-- No credential, user ID, email, transcript, media or trip data is returned.
select b.allocated_usd,10-b.allocated_usd as remaining_usd,b.blocked,
 (select count(*) from public.meta_video_test_requests) as requests_count,
 (select count(*) from public.meta_video_test_requests where settled_at is not null) as settled_requests,
 (select count(*) from public.meta_video_test_requests where settled_at is null) as unsettled_requests,
 (select coalesce(sum(estimated_usd),0) from public.meta_video_test_requests) as known_estimated_usage_usd,
 to_regclass('public.trips') is not null as trips_table_present,
 coalesce((select relrowsecurity from pg_class where oid=to_regclass('public.trips')),false) as trips_rls_enabled,
 coalesce(has_table_privilege('authenticated',to_regclass('public.trips')::oid,'INSERT'),false) as trips_authenticated_insert_allowed
from public.meta_video_test_budget b where b.id=true;
-- Expected after one runtime diagnostic + one successful text inference:
-- allocation0.10, remaining9.90, blockedfalse, requests2/settled2/unsettled0,
-- known estimated usage0.0062055 (not account billing).
-- Missing trips schema must be prepared by owner with existing schema.sql;
-- never weaken RLS or reset the consumed allocation to match expected values.
