begin;
grant select on public.trips to service_role;
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

commit;
