-- Owner review/apply. New grants only; preserve existing limits, usage, expiry and references.
begin;
alter table public.trip_passes alter column request_limit set default 10;
create or replace function public.apply_trip_payment(p_order text,p_environment text,p_status text) returns void
language plpgsql security definer set search_path='' as $$
declare o public.payment_orders;
begin
 select * into o from public.payment_orders where id=p_order and environment=p_environment for update;
 if not found then raise exception 'Order not found'; end if;
 if p_status in ('refund','partial_refund','chargeback','partial_chargeback') then
  update public.payment_orders set status=p_status where id=o.id;
  update public.trip_passes set expires_at=least(expires_at,now()) where payment_reference=o.id;
 elsif p_status='paid' and o.status not in ('refund','partial_refund','chargeback','partial_chargeback') then
  insert into public.trip_passes(user_id,trip_key,expires_at,request_limit,payment_reference)
  values(o.user_id,o.trip_key,now()+interval '30 days',10,o.id) on conflict(payment_reference) do nothing;
  update public.payment_orders set status='paid',paid_at=coalesce(paid_at,now()) where id=o.id;
 elsif o.status not in ('paid','refund','partial_refund','chargeback','partial_chargeback') then
  update public.payment_orders set status=p_status where id=o.id;
 end if;
end; $$;
revoke all on function public.apply_trip_payment(text,text,text) from public,anon,authenticated;
grant execute on function public.apply_trip_payment(text,text,text) to service_role;
commit;
