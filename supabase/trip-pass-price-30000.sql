-- Owner review/apply BEFORE deploying the Rp30.000 checkout code.
-- Preserve all existing orders, pass limits, usage, expiry and payment references.
begin;
alter table public.payment_orders drop constraint if exists payment_orders_amount_check;
alter table public.payment_orders add constraint payment_orders_amount_check check(amount in (15000,30000));
-- Existing Rp15.000 invoices remain valid; new Worker orders are Rp30.000.
-- No UPDATE/DELETE of orders/passes and no change to entitlement RPCs or RLS.
commit;
