-- Apply AFTER ai-access.sql. Client cannot grant paid access.
begin;
create table public.price_watches (
 id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
 trip_id uuid not null references public.trips(id) on delete cascade, pass_id uuid not null references public.trip_passes(id),
 query jsonb not null, best_price numeric, enabled boolean not null default true, email_enabled boolean not null default false,
 next_check timestamptz not null default now(), last_checked timestamptz, last_status text, lease uuid,
 unique(user_id,trip_id)
);
create table public.price_notifications (
 id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
 watch_id uuid not null references public.price_watches(id) on delete cascade, event_key uuid unique not null,
 old_price numeric not null, price numeric not null, booking_url text not null, created_at timestamptz default now(),
 email_sent boolean not null default false
);
alter table public.price_watches enable row level security;
alter table public.price_notifications enable row level security;
revoke all on public.price_watches,public.price_notifications from anon,authenticated;
grant select on public.price_watches,public.price_notifications to authenticated;
create policy watches_own on public.price_watches for select to authenticated using(user_id=auth.uid());
create policy notifications_own on public.price_notifications for select to authenticated using(user_id=auth.uid());
create or replace function public.set_price_watch(p_trip_id uuid,p_enabled boolean,p_email boolean default false) returns void
language plpgsql security definer set search_path='' as $$
declare t jsonb; pid uuid; code text; city text; k text; q jsonb; depart date; back date; duration integer;
begin
 if auth.uid() is null then raise exception 'Masuk terlebih dahulu'; end if;
 if not p_enabled then update public.price_watches set enabled=false,email_enabled=false where user_id=auth.uid() and trip_id=p_trip_id; return; end if;
 select data into t from public.trips where id=p_trip_id and user_id=auth.uid();
 if t is null then raise exception 'Simpan perjalanan terlebih dahulu'; end if;
 city:=coalesce(t->'destinationMeta'->>'city',case t->>'destination' when 'kl' then 'Kuala Lumpur' when 'bkk' then 'Bangkok' when 'sin' then 'Singapura' else t->>'destination' end);
 k:=lower(trim(city))||'|'||(t->>'start');
 select id into pid from public.trip_passes where user_id=auth.uid() and trip_key=k and expires_at>now() order by expires_at desc limit 1;
 if pid is null then raise exception 'Price Watch memerlukan Trip Pass aktif untuk perjalanan ini'; end if;
 code:=coalesce(nullif(t->'destinationMeta'->>'code',''),case t->>'destination' when 'kl' then 'KUL' when 'bkk' then 'BKK' when 'sin' then 'SIN' end,nullif(t->'flight'->>'destinationCode',''));
 if code is null or code !~ '^[A-Z]{3}$' then raise exception 'Lengkapi kota tujuan di itinerary, lalu simpan perjalanan'; end if;
 if coalesce(t->>'origin','') !~ '^[A-Z]{3}$' then raise exception 'Lengkapi bandara keberangkatan di itinerary, lalu simpan perjalanan'; end if;
 if coalesce(t->>'start','') !~ '^\d{4}-\d{2}-\d{2}$' then raise exception 'Lengkapi tanggal keberangkatan di itinerary'; end if;
 depart:=(t->>'start')::date;
 if depart<current_date then raise exception 'Pilih tanggal keberangkatan yang belum lewat'; end if;
 duration:=coalesce((t->>'days')::integer,1);
 if duration<2 or duration>14 then raise exception 'Pemantauan mendukung perjalanan 2–14 hari'; end if;
 back:=depart+duration-1;
 q:=jsonb_build_object('origin',t->>'origin','destination',code,'outFrom',depart::text,'outTo',depart::text,'backFrom',back::text,'backTo',back::text,'journey',case when t->>'journey'='oneway' or t->'flight'->>'oneWay'='true' then 'oneway' else 'return' end,'minDays',duration,'maxDays',duration,'scope','international','page',1);
 insert into public.price_watches(user_id,trip_id,pass_id,query,best_price,email_enabled) values(auth.uid(),p_trip_id,pid,q,null,p_email)
 on conflict(user_id,trip_id) do update set pass_id=excluded.pass_id,enabled=true,email_enabled=p_email,
 best_price=case when price_watches.query=excluded.query then price_watches.best_price else null end,
 last_checked=case when price_watches.query=excluded.query then price_watches.last_checked else null end,
 last_status=case when price_watches.query=excluded.query then price_watches.last_status else null end,
 next_check=case when price_watches.query=excluded.query and price_watches.enabled then price_watches.next_check else now() end,
 lease=case when price_watches.query=excluded.query then price_watches.lease else null end,
 query=excluded.query;
end; $$;
create function public.claim_price_watches() returns setof public.price_watches
language sql security definer set search_path='' as $$
 update public.price_watches w set next_check=now()+interval '1 day',lease=gen_random_uuid()
 where w.id in(select x.id from public.price_watches x join public.trip_passes p on p.id=x.pass_id where x.enabled and p.expires_at>now() and x.next_check<=now() and (x.query->>'outFrom')::date>=current_date order by x.next_check limit 5 for update of x skip locked) returning w.*;
$$;
create function public.finish_price_watch(p_id uuid,p_lease uuid,p_price numeric,p_url text,p_status text) returns void
language plpgsql security definer set search_path='' as $$
declare w public.price_watches;
begin
 select * into w from public.price_watches where id=p_id and lease=p_lease and enabled for update;
 if not found then return; end if;
 if not exists(select 1 from public.trip_passes where id=w.pass_id and expires_at>now()) then return; end if;
 if p_status='ok' and p_price>0 then
  if w.best_price is not null and p_price<w.best_price then
   insert into public.price_notifications(user_id,watch_id,event_key,old_price,price,booking_url) values(w.user_id,w.id,p_lease,w.best_price,p_price,p_url) on conflict(event_key) do nothing;
  end if;
  update public.price_watches set best_price=least(coalesce(best_price,p_price),p_price) where id=p_id;
 end if;
 update public.price_watches set last_checked=now(),last_status=p_status,lease=null where id=p_id;
end; $$;
revoke all on function public.set_price_watch(uuid,boolean,boolean),public.claim_price_watches(),public.finish_price_watch(uuid,uuid,numeric,text,text) from public,anon,authenticated;
grant execute on function public.set_price_watch(uuid,boolean,boolean) to authenticated;
grant execute on function public.claim_price_watches(),public.finish_price_watch(uuid,uuid,numeric,text,text) to service_role;
grant all on public.price_watches,public.price_notifications to service_role;
commit;
