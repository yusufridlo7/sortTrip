-- Owner reviews and applies. Private checkout records, separate from Trip Pass.
begin;
create table if not exists public.hotel_checkouts (
 id uuid primary key,
 user_id uuid not null references auth.users(id),
 environment text not null check(environment in ('sandbox','live')),
 state text not null check(state in ('selected','prebooking','ready','booking','unknown','confirmed','cancelled','failed')),
 summary jsonb not null,
 sealed_payload text not null,
 expires_at timestamptz not null,
 booking_id text,
 confirmation_code text,
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now()
);
alter table public.hotel_checkouts enable row level security;
revoke all on public.hotel_checkouts from public, anon, authenticated;
grant select,insert,update on public.hotel_checkouts to service_role;
create index if not exists hotel_checkouts_owner_idx on public.hotel_checkouts(user_id,created_at desc);
-- A conditional transition serializes attempts across Worker instances.
create or replace function public.claim_hotel_checkout(p_id uuid,p_user uuid,p_environment text,p_from text,p_to text)
returns setof public.hotel_checkouts language sql security definer set search_path=public as $$
 update public.hotel_checkouts set state=p_to,updated_at=now()
 where id=p_id and user_id=p_user and environment=p_environment and state=p_from
 and ((p_from='selected' and p_to='prebooking') or (p_from='ready' and p_to='booking'))
 and (p_from='ready' or expires_at>now()) returning *;
$$;
revoke all on function public.claim_hotel_checkout(uuid,uuid,text,text,text) from public,anon,authenticated;
grant execute on function public.claim_hotel_checkout(uuid,uuid,text,text,text) to service_role;
commit;
