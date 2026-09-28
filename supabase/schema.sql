-- Jalankan sekali di Supabase SQL Editor proyek sortTrip.
begin;
create table public.trips (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  data jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint trip_object check (jsonb_typeof(data) = 'object'),
  constraint trip_items check (data ? 'items' and jsonb_typeof(data->'items') = 'array'),
  constraint trip_size check (octet_length(data::text) <= 200000)
);
create index trips_owner_updated_idx on public.trips(user_id, updated_at desc);
alter table public.trips enable row level security;
revoke all on public.trips from anon, authenticated;
grant select, insert, update on public.trips to authenticated;
create policy trips_read_own on public.trips for select to authenticated
  using ((select auth.uid()) = user_id);
create policy trips_insert_own on public.trips for insert to authenticated
  with check ((select auth.uid()) = user_id);
create policy trips_update_own on public.trips for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
create function public.set_trip_updated_at() returns trigger
language plpgsql set search_path = '' as $$
begin
  new.updated_at = now();
  new.created_at = old.created_at;
  return new;
end;
$$;
create trigger trips_updated_at before update on public.trips
  for each row execute function public.set_trip_updated_at();
commit;
