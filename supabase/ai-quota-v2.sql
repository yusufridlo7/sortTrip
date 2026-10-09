-- Apply after ai-access.sql. Owner review required; no existing usage is reset.
begin;
create table if not exists public.ai_request_reservations (
 id uuid primary key, user_id uuid not null references auth.users(id), pass_id uuid references public.trip_passes(id),
 expires_at timestamptz not null, status text not null default 'pending' check(status in ('pending','success','failed'))
);
alter table public.ai_request_reservations enable row level security;
revoke all on public.ai_request_reservations from public,anon,authenticated;
create or replace function public.reserve_ai_request(p_user uuid,p_trip_key text,p_request uuid) returns jsonb
language plpgsql security definer set search_path='' as $$
declare p public.trip_passes; used integer; pending integer;
begin
 perform pg_advisory_xact_lock(hashtextextended(p_user::text,0));
 select * into p from public.trip_passes where user_id=p_user and expires_at>now() and requests<request_limit order by expires_at desc limit 1 for update;
 if found then
  select count(*) into pending from public.ai_request_reservations where pass_id=p.id and status='pending' and expires_at>now();
  if p.requests+pending>=p.request_limit then return jsonb_build_object('allowed',false,'busy',pending>0); end if;
 else
  select coalesce(requests,0) into used from public.ai_membership_usage where user_id=p_user;
  used:=coalesce(used,0);
  select count(*) into pending from public.ai_request_reservations where user_id=p_user and pass_id is null and status='pending' and expires_at>now();
  if used+pending>=2 then return jsonb_build_object('allowed',false,'busy',used<2); end if;
 end if;
 insert into public.ai_request_reservations(id,user_id,pass_id,expires_at) values(p_request,p_user,p.id,now()+interval '3 minutes');
 return jsonb_build_object('allowed',true);
end; $$;
create or replace function public.finish_ai_request(p_user uuid,p_request uuid,p_success boolean) returns jsonb
language plpgsql security definer set search_path='' as $$
declare r public.ai_request_reservations; n integer;
begin
 perform pg_advisory_xact_lock(hashtextextended(p_user::text,0));
 select * into r from public.ai_request_reservations where id=p_request and user_id=p_user for update;
 if not found then return jsonb_build_object('ok',false); end if;
 if r.status<>'pending' then return jsonb_build_object('ok',r.status='success'); end if;
 if not p_success or r.expires_at<=now() then
  update public.ai_request_reservations set status='failed' where id=r.id;
  return jsonb_build_object('ok',not p_success);
 end if;
 if r.pass_id is null then
  insert into public.ai_membership_usage(user_id,trip_key,requests) values(p_user,'account',1)
  on conflict(user_id) do update set requests=public.ai_membership_usage.requests+1 returning requests into n;
 else
  update public.trip_passes set requests=requests+1 where id=r.pass_id returning requests into n;
 end if;
 update public.ai_request_reservations set status='success' where id=r.id;
 return jsonb_build_object('ok',true);
end; $$;
revoke all on function public.reserve_ai_request(uuid,text,uuid), public.finish_ai_request(uuid,uuid,boolean) from public,anon,authenticated;
grant execute on function public.reserve_ai_request(uuid,text,uuid), public.finish_ai_request(uuid,uuid,boolean) to service_role;
-- Prevent the previous pre-charge path from consuming quota.
revoke execute on function public.claim_ai_request(text) from authenticated;
commit;
