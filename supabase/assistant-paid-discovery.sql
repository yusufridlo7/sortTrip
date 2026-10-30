-- OWNER ONLY: review and apply in the intended project after ai-access.sql,
-- ai-quota-v2.sql and ai-pass-account-scope.sql. No grants to client roles,
-- no test subscriptions, no quota reset and no payment operation.
begin;
create or replace function public.reserve_paid_ai_request(p_user uuid,p_request uuid)
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
