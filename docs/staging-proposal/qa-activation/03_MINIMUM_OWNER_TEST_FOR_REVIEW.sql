-- USULAN SAJA, BELUM DIJALANKAN. Pemberian hak uji memerlukan izin owner.
-- Jangan jalankan sekarang. Khusus proyek QA, bukan production.
-- QA aytrcvfncsklhqozreyk ONLY. Verify dashboard project and owner account first.
-- Requires proposed minimal schema. Never copy a production UUID/pass/payment.
-- Minimum ONE successful result / ONE hour. No payment and no Meta cap change.
begin;
do $$
declare u uuid:=NULL; -- Owner selects confirmed existing QA identity privately.
 execution_authorized constant boolean:=false;
 allocated numeric; halted boolean; previous_count integer;
begin
 if NOT execution_authorized OR u IS NULL THEN RAISE EXCEPTION 'STOP owner approval and private QA identity required'; END IF;
 if not exists(select 1 from auth.users where id=u and email_confirmed_at is not null) then
  raise exception 'Confirmed existing owner QA account required';
 end if;
 if exists(select 1 from public.trip_passes where user_id=u) then
  raise exception 'Existing pass found: no replacement/reset/renewal performed';
 end if;
 select allocated_usd,blocked into allocated,halted
  from public.meta_video_test_budget where id=true for update;
 select count(*) into previous_count from public.meta_video_test_requests where user_id=u;
 if allocated is null or halted or allocated+0.05>10 or previous_count+1>10 then
  raise exception 'Existing Meta guard cannot support one attempt: diagnose, do not reset caps or rotate accounts';
 end if;
 if exists(select 1 from public.meta_video_test_requests
  where settled_at is null) then
  raise exception 'Unsettled accounting requires review first';
 end if;
 insert into public.trip_passes(user_id,trip_key,expires_at,requests,request_limit,payment_reference)
 values(u,'account',now()+interval '1 hour',0,1,'owner-test:staging:'||u::text);
end $$;
commit;
-- No browser grant endpoint. No user-metadata role. No provision for widening
-- spending/request caps, clearing blocked, deleting ledger rows or regranting.
