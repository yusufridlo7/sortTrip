-- USULAN SAJA, BELUM DIJALANKAN. Hanya baca; tanpa write/reservasi/inferensi.
-- Tunggu persetujuan owner. Khusus proyek QA, bukan production.
-- After owner approval: verify QA project aytrcvfncsklhqozreyk in the dashboard.
-- Replace the placeholder PRIVATELY with the existing owner's QA user UUID.
-- No account IDs, email addresses, secrets or raw function bodies are returned.
begin read only;

select
 to_regclass('public.trips') is not null as trips_present,
 to_regclass('public.trip_passes') is not null as trip_passes_present,
 to_regclass('public.ai_request_reservations') is not null as result_reservations_present,
 to_regprocedure('public.reserve_ai_request(uuid,text,uuid)') is not null as legacy_reserve_present,
 to_regprocedure('public.finish_ai_request(uuid,uuid,boolean)') is not null as finish_present,
 to_regprocedure('public.reserve_paid_ai_request(uuid,uuid)') is not null as paid_reserve_present;

-- Existing Meta ledger is a prerequisite. If absent, STOP; do not recreate/reset.
with chosen as (
 select id from auth.users where id::text='REPLACE_WITH_EXISTING_OWNER_QA_UUID'
), owner_stats as (
 select count(*) as allocations,
 count(*) filter(where settled_at is null and created_at>now()-interval '2 minutes') as recent_pending,
 count(*) filter(where settled_at is null) as unsettled,
 count(*) filter(where output_tokens>2000) as over_output_guard,
 max(output_tokens) as maximum_output_tokens
 from public.meta_video_test_requests where user_id=(select id from chosen)
), budget as (
 select allocated_usd,blocked from public.meta_video_test_budget where id=true
)
select now() as observed_at,
 exists(select 1 from chosen) as selected_owner_found,
 (select allocated_usd from budget) as allocated_usd,
 10-(select allocated_usd from budget) as remaining_allocation_usd,
 (select blocked from budget) as ledger_blocked,
 case when exists(select 1 from chosen) then allocations end as owner_allocations,
 case when exists(select 1 from chosen) then recent_pending end as owner_recent_pending,
 case when exists(select 1 from chosen) then unsettled end as owner_unsettled,
 case when exists(select 1 from chosen) then over_output_guard end as owner_outputs_over_2000,
 case when exists(select 1 from chosen) then maximum_output_tokens end as owner_maximum_output,
 case
  when not exists(select 1 from budget) then 'LEDGER_ROW_MISSING'
  when (select blocked from budget) then 'LEDGER_BLOCKED'
  when (select allocated_usd from budget)+0.05>10 then 'GLOBAL_ALLOCATION_CAP'
  when not exists(select 1 from chosen) then 'OWNER_NOT_SELECTED'
  when recent_pending>0 then 'OWNER_CONCURRENT_REQUEST'
  when allocations>=10 then 'OWNER_LIFETIME_ALLOCATION_CAP'
  else 'NO_DENIAL_AT_SNAPSHOT_TIME'
 end as first_matching_reservation_condition
from owner_stats;

-- Fingerprints/predicates only; check whether deployed RPC matches source.
select p.proname as function_name,md5(pg_get_functiondef(p.oid)) as definition_fingerprint,
 position('p_output_tokens>2000' in regexp_replace(pg_get_functiondef(p.oid),'\s','','g'))>0
  as contains_2000_output_stop,
 position('>=10' in regexp_replace(pg_get_functiondef(p.oid),'\s','','g'))>0
  as contains_ten_request_check
from pg_proc p join pg_namespace n on n.oid=p.pronamespace
where n.nspname='public' and p.proname in ('reserve_meta_video_test','settle_meta_video_test');

commit;
-- This is a current snapshot, not proof of the historical incident's state.
-- Never substitute meta-video-budget-probe.sql: that script temporarily writes.
