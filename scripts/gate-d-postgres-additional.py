# Loaded only by the owned disposable rehearsal runner, not a standalone client.
baseline=snapshot()
if json.loads(baseline)['requests']!=7: raise RuntimeError('STOP synthetic fixture drift')
def definitions():
    return sql("SELECT string_agg(md5(pg_get_functiondef(p.oid)),',' ORDER BY p.proname) FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace WHERE n.nspname='public' AND p.proname IN('reserve_meta_video_test','settle_meta_video_test','meta_video_test_safety_status')").stdout.strip()
v2hash=definitions()
old=(ROOT/'supabase/meta-video-budget.sql').read_text()
old=old[old.index('create or replace function'):old.index('revoke all on function')]
proposal=(ROOT/'artifacts/gate-d-rehearsal/01_rehearsal_migration.sql').read_text()
proposal=proposal.replace('BEGIN;','',1).rsplit('COMMIT;',1)[0]
setup="BEGIN; DROP FUNCTION public.meta_video_test_safety_status();\n"+old
cases=[
 ('guard_project_setting',"SET LOCAL app.settings.supabase_url='https://wrong.invalid';",'STOP configured project mismatch'),
 ('guard_snapshot',"UPDATE public.meta_video_test_budget SET allocated_usd=0.40;",'STOP recovered baseline changed'),
 ('guard_pending',"UPDATE public.meta_video_test_requests SET settled_at=NULL WHERE id=(SELECT id FROM public.meta_video_test_requests LIMIT 1);",'STOP request baseline changed'),
 ('guard_fingerprint',"ALTER FUNCTION public.reserve_meta_video_test(uuid,uuid) SET search_path=pg_catalog;",'STOP deployed definition drift'),
 ('guard_public_acl',"GRANT EXECUTE ON FUNCTION public.reserve_meta_video_test(uuid,uuid) TO PUBLIC;",'STOP ownership/ACL/search_path mismatch'),
 ('guard_service_execute',"REVOKE EXECUTE ON FUNCTION public.reserve_meta_video_test(uuid,uuid) FROM service_role;",'STOP ownership/ACL/search_path mismatch'),
 ('guard_service_grant_option',"GRANT EXECUTE ON FUNCTION public.reserve_meta_video_test(uuid,uuid) TO service_role WITH GRANT OPTION;",'STOP ownership/ACL/search_path mismatch'),
 ('guard_owner',"ALTER FUNCTION public.reserve_meta_video_test(uuid,uuid) OWNER TO authenticated;",'STOP ownership/ACL/search_path mismatch'),
]
for name,mutation,expected in cases:
    path=OUT/(name+'.sql');path.write_text(setup+mutation+'\n'+proposal+'\nROLLBACK;',encoding='utf-8')
    file_sql(name,path,expected)
    record(name+'_rollback',snapshot()==baseline and definitions()==v2hash)
# Intentionally change synthetic data after preflight in a disposable migration
# copy: postflight MUST abort and restore both function definitions and history.
tampered=proposal.replace("DO $$ BEGIN\n IF current_setting", "UPDATE public.meta_video_test_budget SET allocated_usd=0.40;\nDO $$ BEGIN\n IF current_setting")
path=OUT/'guard_postflight.sql';path.write_text(setup+tampered+'\nROLLBACK;',encoding='utf-8')
file_sql('guard_postflight',path,'STOP data changed')
record('postflight_rollback',snapshot()==baseline and definitions()==v2hash)

def assertion(name,body):
    text="BEGIN; SET LOCAL statement_timeout='5s'; DO $$ DECLARE r jsonb; BEGIN "+body+" END $$; ROLLBACK;"
    r=sql(text,False);(OUT/(name+'.log')).write_text(r.stdout+r.stderr)
    record(name,r.returncode==0,r.stderr if r.returncode else '')
    if r.returncode: raise RuntimeError(name+' failed')
    record(name+'_history_unchanged',snapshot()==baseline)

user="'00000000-0000-4000-8000-000000000002'"
uid="'00000000-0000-4000-8000-000000000041'"
assertion('service_definer_and_search_path',f"""
 CREATE TEMP TABLE meta_video_test_budget(id boolean,allocated_usd numeric,blocked boolean);
 SET LOCAL search_path=pg_temp;
 SET LOCAL ROLE service_role;
 r:=public.reserve_meta_video_test({uid},{user});
 IF (r->>'allowed') IS DISTINCT FROM 'true' THEN RAISE EXCEPTION 'definer reserve denied'; END IF;
 r:=public.settle_meta_video_test({uid},0.001,100,100);
 IF (r->>'ok') IS DISTINCT FROM 'true' THEN RAISE EXCEPTION 'definer settle denied'; END IF;
 RESET ROLE;
 IF (SELECT count(*) FROM pg_temp.meta_video_test_budget)<>0 THEN RAISE EXCEPTION 'shadow table touched'; END IF;
""")
assertion('allocation_cap',f"""
 UPDATE public.meta_video_test_budget SET allocated_usd=9.95;
 r:=public.reserve_meta_video_test({uid},{user});
 IF (r->>'allowed') IS DISTINCT FROM 'true' THEN RAISE EXCEPTION 'last allocation denied'; END IF;
 r:=public.settle_meta_video_test({uid},0.001,100,100);
 r:=public.reserve_meta_video_test(gen_random_uuid(),{user});
 IF (r->>'allowed') IS DISTINCT FROM 'false' THEN RAISE EXCEPTION 'over cap allowed'; END IF;
""")
assertion('per_user_ten_attempts',"""
 FOR i IN 1..3 LOOP
  r:=public.reserve_meta_video_test(md5('extra'||i)::uuid,'00000000-0000-4000-8000-000000000001');
  IF (r->>'allowed') IS DISTINCT FROM 'true' THEN RAISE EXCEPTION 'valid attempt denied'; END IF;
  r:=public.settle_meta_video_test(md5('extra'||i)::uuid,0.001,100,100);
 END LOOP;
 r:=public.reserve_meta_video_test(gen_random_uuid(),'00000000-0000-4000-8000-000000000001');
 IF (r->>'allowed') IS DISTINCT FROM 'false' THEN RAISE EXCEPTION 'eleventh allowed'; END IF;
""")
assertion('unknown_request_overrun_does_not_reblock',"""
 r:=public.settle_meta_video_test(gen_random_uuid(),1,30000,3000);
 IF (r->>'ok') IS DISTINCT FROM 'false' OR EXISTS(SELECT FROM public.meta_video_test_budget WHERE blocked)
 THEN RAISE EXCEPTION 'unknown request reblocked'; END IF;
""")
assertion('real_pending_overrun_blocks',f"""
 r:=public.reserve_meta_video_test({uid},{user});
 r:=public.settle_meta_video_test({uid},0.001,100,2305);
 IF (r->>'ok') IS DISTINCT FROM 'true' OR NOT EXISTS(SELECT FROM public.meta_video_test_budget WHERE blocked)
 THEN RAISE EXCEPTION 'overrun not halted'; END IF;
""")
record('final_definitions_unchanged',definitions()==v2hash)
