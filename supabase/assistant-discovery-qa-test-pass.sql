-- OPTIONAL, OWNER ONLY: disposable QA subscription, NOT a real payment.
-- Only use in QA aytrcvfncsklhqozreyk AFTER assistant-discovery-qa-setup.sql.
-- Replace the placeholder privately with ONE QA user's UUID from Auth > Users.
-- Never paste user identifiers/credentials into chat. This does not copy or
-- alter your production subscription. Two successful results, one day expiry.
begin;
do $$
declare qa_user uuid:='REPLACE_WITH_QA_USER_UUID';
begin
 if not exists(select 1 from auth.users where id=qa_user) then
  raise exception 'QA account not found';
 end if;
 if exists(select 1 from public.trip_passes where user_id=qa_user) then
  raise exception 'Existing entitlement found: inspect it; no reset or extra grant performed';
 end if;
 insert into public.trip_passes(user_id,trip_key,expires_at,request_limit,payment_reference)
 values(qa_user,'account',now()+interval '1 day',2,'owner-test:meta-discovery:'||qa_user::text);
end; $$;
commit;
