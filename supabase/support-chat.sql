-- Owner applies once in Supabase SQL Editor. Dedicated support data only.
begin;
create table if not exists public.support_conversations (
 id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
 status text not null default 'waiting' check(status in ('waiting','answered','resolved')),
 language text not null default 'id' check(language in ('id','en')),
 created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create unique index if not exists support_one_open_per_user on public.support_conversations(user_id) where status <> 'resolved';
create table if not exists public.support_messages (
 id uuid primary key default gen_random_uuid(), conversation_id uuid not null references public.support_conversations(id) on delete cascade,
 role text not null check(role in ('customer','team')), body text not null check(length(body) between 1 and 1600),
 request_id uuid, created_at timestamptz not null default now()
);
create unique index if not exists support_message_request on public.support_messages(request_id) where request_id is not null;
create index if not exists support_messages_thread on public.support_messages(conversation_id,created_at,id);
create table if not exists public.support_outbox (
 id uuid primary key default gen_random_uuid(), message_id uuid unique not null references public.support_messages(id) on delete cascade,
 state text not null default 'queued' check(state in ('queued','sending','sent','failed')),
 attempts integer not null default 0, lease uuid, next_attempt timestamptz not null default now(),
 telegram_message_id bigint, chat_id text
);
create table if not exists public.support_webhook_updates (update_id bigint primary key, created_at timestamptz not null default now());
create unique index if not exists support_telegram_reply_mapping on public.support_outbox(chat_id,telegram_message_id) where telegram_message_id is not null;
alter table public.support_conversations enable row level security;
alter table public.support_messages enable row level security;
alter table public.support_outbox enable row level security;
alter table public.support_webhook_updates enable row level security;
drop policy if exists support_read_own_conversations on public.support_conversations;
create policy support_read_own_conversations on public.support_conversations for select to authenticated using(user_id=auth.uid());
drop policy if exists support_read_own_messages on public.support_messages;
create policy support_read_own_messages on public.support_messages for select to authenticated using(exists(select 1 from public.support_conversations c where c.id=conversation_id and c.user_id=auth.uid()));
revoke all on public.support_conversations,public.support_messages,public.support_outbox,public.support_webhook_updates from anon,authenticated;
grant select on public.support_conversations,public.support_messages to authenticated;
grant all on public.support_conversations,public.support_messages,public.support_outbox,public.support_webhook_updates to service_role;

create or replace function public.support_customer_send(p_user_id uuid,p_conversation_id uuid,p_body text,p_language text,p_request_id uuid)
returns jsonb language plpgsql security definer set search_path=public,pg_temp as $$
declare c public.support_conversations; m public.support_messages;
begin
 if p_user_id is null or p_request_id is null or p_body is null or length(trim(p_body)) not between 1 and 1600 or p_language not in ('id','en') then raise exception 'SUPPORT_INVALID'; end if;
 perform pg_advisory_xact_lock(hashtextextended(p_user_id::text,0));
 select sm.* into m from public.support_messages sm join public.support_conversations sc on sc.id=sm.conversation_id where sm.request_id=p_request_id and sc.user_id=p_user_id;
 if found then return jsonb_build_object('conversation_id',m.conversation_id,'message_id',m.id); end if;
 if (select count(*) from public.support_messages sm join public.support_conversations sc on sc.id=sm.conversation_id where sc.user_id=p_user_id and sm.role='customer' and sm.created_at>now()-interval '1 minute') >= 5 then raise exception 'SUPPORT_RATE_LIMIT'; end if;
 if p_conversation_id is not null then
  select * into c from public.support_conversations where id=p_conversation_id and user_id=p_user_id for update;
  if not found then raise exception 'SUPPORT_NOT_FOUND'; end if;
  if c.status='resolved' then raise exception 'SUPPORT_CLOSED'; end if;
 else
  select * into c from public.support_conversations where user_id=p_user_id and status <> 'resolved' for update;
  if not found then insert into public.support_conversations(user_id,language) values(p_user_id,p_language) returning * into c; end if;
 end if;
 insert into public.support_messages(conversation_id,role,body,request_id) values(c.id,'customer',trim(p_body),p_request_id) returning * into m;
 insert into public.support_outbox(message_id) values(m.id);
 update public.support_conversations set status='waiting',language=p_language,updated_at=now() where id=c.id;
 return jsonb_build_object('conversation_id',c.id,'message_id',m.id);
end $$;

create or replace function public.support_claim_outbox()
returns table(id uuid,lease uuid,conversation_id uuid,body text,language text)
language plpgsql security definer set search_path=public,pg_temp as $$
begin
 update public.support_outbox o set state='failed' where o.state='sending' and o.attempts>=5 and o.next_attempt<=now();
 return query with claimed as (
  select o.id from public.support_outbox o where o.state in ('queued','sending') and o.next_attempt<=now() and o.attempts<5 order by o.next_attempt for update skip locked limit 5
 ), leased as (
  update public.support_outbox o set state='sending',lease=gen_random_uuid(),attempts=o.attempts+1,next_attempt=now()+interval '2 minutes' from claimed q where o.id=q.id returning o.*
 ) select l.id,l.lease,m.conversation_id,m.body,c.language from leased l join public.support_messages m on m.id=l.message_id join public.support_conversations c on c.id=m.conversation_id;
end $$;

create or replace function public.support_finish_outbox(p_id uuid,p_lease uuid,p_telegram_message_id bigint,p_chat_id text)
returns jsonb language plpgsql security definer set search_path=public,pg_temp as $$
begin
 update public.support_outbox set state=case when p_telegram_message_id is not null then 'sent' when attempts>=5 then 'failed' else 'queued' end,
 telegram_message_id=p_telegram_message_id,chat_id=case when p_telegram_message_id is not null then p_chat_id else null end,
 next_attempt=now()+interval '2 minutes' where id=p_id and lease=p_lease and state='sending';
 return jsonb_build_object('ok',true);
end $$;

create or replace function public.support_admin_reply(p_update_id bigint,p_chat_id text,p_reply_to bigint,p_body text,p_close boolean)
returns jsonb language plpgsql security definer set search_path=public,pg_temp as $$
declare thread_id uuid;
begin
 if not p_close and (p_body is null or length(trim(p_body)) not between 1 and 1600) then raise exception 'SUPPORT_INVALID'; end if;
 select m.conversation_id into thread_id from public.support_outbox o join public.support_messages m on m.id=o.message_id where o.state='sent' and o.chat_id=p_chat_id and o.telegram_message_id=p_reply_to;
 if not found then raise exception 'SUPPORT_NOT_FOUND'; end if;
 perform 1 from public.support_conversations where id=thread_id for update;
 insert into public.support_webhook_updates(update_id) values(p_update_id) on conflict do nothing;
 if not found then return jsonb_build_object('ok',true,'duplicate',true); end if;
 if p_close then update public.support_conversations set status='resolved',updated_at=now() where id=thread_id;
 else
  if exists(select 1 from public.support_conversations where id=thread_id and status='resolved') then raise exception 'SUPPORT_CLOSED'; end if;
  insert into public.support_messages(conversation_id,role,body) values(thread_id,'team',trim(p_body));
  update public.support_conversations set status='answered',updated_at=now() where id=thread_id;
 end if;
 return jsonb_build_object('ok',true);
end $$;
revoke all on function public.support_customer_send(uuid,uuid,text,text,uuid),public.support_claim_outbox(),public.support_finish_outbox(uuid,uuid,bigint,text),public.support_admin_reply(bigint,text,bigint,text,boolean) from public,anon,authenticated;
grant execute on function public.support_customer_send(uuid,uuid,text,text,uuid),public.support_claim_outbox(),public.support_finish_outbox(uuid,uuid,bigint,text),public.support_admin_reply(bigint,text,bigint,text,boolean) to service_role;
commit;
