-- Read-only metadata checks, QA project aytrcvfncsklhqozreyk only.
-- Does not read customer data, auth records, identities or credentials.
select
 to_regclass('public.trips') is not null as trips_table_present,
 coalesce((select relrowsecurity from pg_class where oid=to_regclass('public.trips')),false) as trips_rls_enabled,
 exists(select 1 from pg_policies where schemaname='public' and tablename='trips' and policyname='trips_read_own') as owner_read_policy_present,
 exists(select 1 from pg_policies where schemaname='public' and tablename='trips' and policyname='trips_insert_own') as owner_insert_policy_present,
 exists(select 1 from pg_policies where schemaname='public' and tablename='trips' and policyname='trips_update_own') as owner_update_policy_present;
-- Policy presence is NOT a substitute for actual two-user access tests.
-- If table missing, owner reviews/applies existing supabase/schema.sql in QA.
