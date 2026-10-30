-- PROPOSAL ONLY. NOT APPROVED. Do not execute before owner review.
-- Manually verify dashboard project tznxfgosmjcmwoszvkdk.
BEGIN;
SET LOCAL lock_timeout='3s';
SET LOCAL statement_timeout='15s';
DO $$ BEGIN
 IF NOT false THEN RAISE EXCEPTION 'Owner approval and project attestation required'; END IF;
 IF md5(pg_get_functiondef('public.reserve_ai_request(uuid,text,uuid)'::regprocedure)) <> '9c70e1275e786adbba55d4b052ed3a19'
 OR md5(pg_get_functiondef('public.finish_ai_request(uuid,uuid,boolean)'::regprocedure)) <> 'e957ef1dbe378ae27d8f2ef8f7ad3151'
 THEN RAISE EXCEPTION 'Baseline drift'; END IF;
 IF to_regprocedure('public.reserve_paid_ai_request(uuid,uuid)') IS NOT NULL THEN RAISE EXCEPTION 'Already exists; review instead of replacing'; END IF;
 IF EXISTS(SELECT 1 FROM pg_class WHERE oid IN ('public.trip_passes'::regclass,'public.ai_request_reservations'::regclass,'public.trips'::regclass) AND NOT relrowsecurity) THEN RAISE EXCEPTION 'RLS mismatch'; END IF;
END $$;
create function public.reserve_paid_ai_request(p_user uuid,p_request uuid)
returns jsonb language plpgsql security definer set search_path='' as $$
declare p public.trip_passes; result jsonb; reserved_pass uuid;
begin
 perform pg_advisory_xact_lock(hashtextextended(p_user::text,0));
 select * into p from public.trip_passes where user_id=p_user and expires_at>now()
  and requests<request_limit order by expires_at desc limit 1 for update;
 if not found then return jsonb_build_object('allowed',false); end if;
 result:=public.reserve_ai_request(p_user,'assistant-discovery',p_request);
 if coalesce((result->>'allowed')::boolean,false) then
  select pass_id into reserved_pass from public.ai_request_reservations
   where id=p_request and user_id=p_user and status='pending';
  if reserved_pass is null then
   perform public.finish_ai_request(p_user,p_request,false);
   return jsonb_build_object('allowed',false);
  end if;
 end if;
 return result;
end; $$;
revoke all on function public.reserve_paid_ai_request(uuid,uuid) from public,anon,authenticated;
grant execute on function public.reserve_paid_ai_request(uuid,uuid) to service_role;
-- Read-only account access. RLS bypass remains confined to the server role.
grant select on public.trip_passes to service_role;
commit;

