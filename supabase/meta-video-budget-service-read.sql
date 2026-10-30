-- OWNER ONLY: QA aytrcvfncsklhqozreyk. Review then execute whole file.
-- Diagnostic needs SELECT on the aggregate budget row for service_role only.
-- No anon/authenticated access and no new INSERT/UPDATE/DELETE privileges.
-- Reserve/settle continue through the existing service-only definer functions.
begin;
grant select on public.meta_video_test_budget to service_role;
commit;
select
 has_table_privilege('service_role','public.meta_video_test_budget','SELECT') as service_budget_read_allowed,
 not has_table_privilege('anon','public.meta_video_test_budget','SELECT') as anon_budget_read_denied,
 not has_table_privilege('authenticated','public.meta_video_test_budget','SELECT') as authenticated_budget_read_denied;
