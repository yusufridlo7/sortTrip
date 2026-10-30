-- OWNER: read-only readiness check. Run in the QA project first.
-- No account identifiers, credentials, subscription creation or usage changes.
select
 to_regclass('public.trip_passes') is not null as trip_passes_present,
 to_regclass('public.ai_request_reservations') is not null as reservations_present,
 to_regprocedure('public.reserve_ai_request(uuid,text,uuid)') is not null as reserve_present,
 to_regprocedure('public.finish_ai_request(uuid,uuid,boolean)') is not null as finish_present,
 to_regprocedure('public.reserve_paid_ai_request(uuid,uuid)') is not null as paid_reserve_present;
