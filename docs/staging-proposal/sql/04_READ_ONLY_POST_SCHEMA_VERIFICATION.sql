-- USULAN BACA-SAJA. BELUM DIJALANKAN. Owner memverifikasi proyek QA dahulu.
-- Sesudah perubahan schema yang disetujui; tidak membuat reservasi/hak uji.
begin read only;
select c.relname as table_name,c.relrowsecurity as rls_enabled,
 has_table_privilege('anon',c.oid,'SELECT') as anon_select,
 has_table_privilege('authenticated',c.oid,'SELECT') as authenticated_select,
 has_table_privilege('authenticated',c.oid,'INSERT') as authenticated_insert,
 has_table_privilege('service_role',c.oid,'SELECT') as service_select
from pg_class c join pg_namespace n on n.oid=c.relnamespace
where n.nspname='public' and c.relname in
 ('trips','trip_passes','ai_request_reservations','meta_video_test_budget','meta_video_test_requests')
order by c.relname;

select p.proname as function_name,p.prosecdef as security_definer,
 has_function_privilege('anon',p.oid,'EXECUTE') as anon_execute,
 has_function_privilege('authenticated',p.oid,'EXECUTE') as authenticated_execute,
 has_function_privilege('service_role',p.oid,'EXECUTE') as service_execute
from pg_proc p join pg_namespace n on n.oid=p.pronamespace
where n.nspname='public' and p.proname in
 ('reserve_paid_ai_request','finish_ai_request','reserve_meta_video_test','settle_meta_video_test')
order by p.proname;

select count(*) as own_user_policies from pg_policies
where schemaname='public' and tablename='trips'
and policyname in ('trips_read_own','trips_insert_own','trips_update_own');
commit;
-- Harapan: RLS true; anon tak memiliki SELECT; authenticated hanya trips
-- SELECT/INSERT/UPDATE sesuai schema lama, bukan tabel entitlement/ledger.
-- RPC di atas security_definer=true, anon/authenticated execute=false,
-- service execute=true; trips memiliki tiga own-user policies yang lama.
-- Ini memeriksa struktur/privilege, BUKAN pengganti uji negatif RLS dua akun.
