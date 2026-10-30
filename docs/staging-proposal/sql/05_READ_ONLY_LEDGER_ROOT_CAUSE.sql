-- USULAN DIAGNOSTIK HANYA BACA; BELUM DIJALANKAN.
-- Tunggu persetujuan owner; jalankan sendiri hanya di QA aytrcvfncsklhqozreyk.
-- Pastikan proyek pada dashboard; SQL ini tidak dapat menjamin project-ref.
-- Jangan gunakan pada production. Tidak reserve/settle, reset, unblock atau inferensi.
-- Snapshot berikut global, tidak mengembalikan ID akun/request atau konten.
begin transaction isolation level repeatable read read only;

with stats as (
 select count(*) as requests_count,
 count(*) filter(where settled_at is null) as unsettled_requests,
 count(*) filter(where settled_at is null and created_at>now()-interval '2 minutes') as recent_pending,
 count(*) filter(where estimated_usd is null or input_tokens is null or output_tokens is null) as incomplete_usage,
 count(*) filter(where estimated_usd>0.05) as over_cost_guard,
 count(*) filter(where input_tokens>20000) as over_input_guard,
 count(*) filter(where output_tokens>2000) as over_output_guard,
 sum(estimated_usd) as known_estimated_usage_usd
 from public.meta_video_test_requests
)
select now() as observed_at,
 (select count(*) from public.meta_video_test_budget) as budget_rows,
 b.allocated_usd,10-b.allocated_usd as remaining_allocation_usd,b.blocked,
 s.*,s.requests_count*0.05 as expected_allocation_usd,
 b.allocated_usd=s.requests_count*0.05 as allocation_matches_request_count
from stats s left join public.meta_video_test_budget b on b.id=true;

-- Timestamp dan metrik saja; tidak ada identitas. Jangan kirim raw log/token.
select created_at,settled_at,input_tokens,output_tokens,estimated_usd,
 estimated_usd>0.05 as exceeds_cost_guard,
 input_tokens>20000 as exceeds_input_guard,
 output_tokens>2000 as exceeds_output_guard
from public.meta_video_test_requests
where estimated_usd>0.05 or input_tokens>20000 or output_tokens>2000
order by created_at,settled_at;

-- Fingerprint/signature bukan pembuktian body. Tinjau body secara privat di dashboard.
select p.proname as function_name,pg_get_function_identity_arguments(p.oid) as signature,
 p.prosecdef as security_definer,md5(pg_get_functiondef(p.oid)) as definition_fingerprint
from pg_proc p join pg_namespace n on n.oid=p.pronamespace
where n.nspname='public' and p.proname in ('reserve_meta_video_test','settle_meta_video_test')
order by p.proname,signature;

-- Trigger tambahan perlu ditinjau owner; daftar kosong tidak menyingkirkan SQL manual.
select c.relname as table_name,t.tgname as trigger_name,t.tgenabled as enabled,
 n.nspname as function_schema,p.proname as function_name,
 md5(pg_get_functiondef(p.oid)) as trigger_function_fingerprint
from pg_trigger t join pg_class c on c.oid=t.tgrelid
join pg_namespace tn on tn.oid=c.relnamespace
join pg_proc p on p.oid=t.tgfoid join pg_namespace n on n.oid=p.pronamespace
where tn.nspname='public' and c.relname in ('meta_video_test_budget','meta_video_test_requests')
and not t.tgisinternal
order by c.relname,t.tgname;

commit;
