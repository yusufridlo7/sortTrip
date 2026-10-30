-- USULAN SAJA, BELUM DIJALANKAN. Pemberian hak uji memerlukan izin owner.
-- Jangan jalankan sekarang. Khusus proyek QA, bukan production.
-- QA aytrcvfncsklhqozreyk ONLY. Verify dashboard project and owner account first.
-- Requires proposed minimal schema. Never copy a production UUID/pass/payment.
-- Fixed TWO successful results / 24 hours. No payment and no Meta cap change.
begin;
do $$
declare u uuid:='REPLACE_WITH_EXISTING_OWNER_QA_UUID';
 allocated numeric; halted boolean; previous_count integer;
begin
 if not exists(select 1 from auth.users where id=u and email_confirmed_at is not null) then
  raise exception 'Confirmed existing owner QA account required';
 end if;
 if exists(select 1 from public.trip_passes where user_id=u) then
  raise exception 'Existing pass found: no replacement/reset/renewal performed';
 end if;
 select allocated_usd,blocked into allocated,halted
  from public.meta_video_test_budget where id=true for update;
 select count(*) into previous_count from public.meta_video_test_requests where user_id=u;
 if allocated is null or halted or allocated+0.10>10 or previous_count+2>10 then
  raise exception 'Existing Meta guard cannot support two attempts: diagnose, do not reset caps or rotate accounts';
 end if;
 if exists(select 1 from public.meta_video_test_requests
  where user_id=u and settled_at is null) then
  raise exception 'Unsettled accounting requires review first';
 end if;
 insert into public.trip_passes(user_id,trip_key,expires_at,requests,request_limit,payment_reference)
 values(u,'account',now()+interval '24 hours',0,2,'owner-test:staging:'||u::text);
end $$;
commit;
-- No browser grant endpoint. No user-metadata role. No provision for widening
-- spending/request caps, clearing blocked, deleting ledger rows or regranting.
