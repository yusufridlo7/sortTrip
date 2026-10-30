import os,subprocess,socket,json,time
from pathlib import Path
R=Path(__file__).resolve().parents[1]; B=R/'.sorttrip-qa/pg-rehearsal-20261029-02/runtime/pgsql/bin'; W=R/'.sorttrip-qa/production-rehearsal-20261030-c'; O=R/'artifacts/production-activation-rehearsal'; P='56559'
if W.exists(): raise SystemExit('STOP existing directory')
with socket.socket() as s:s.bind(('127.0.0.1',int(P)))
W.mkdir();O.mkdir(exist_ok=True)
e={k:v for k,v in os.environ.items() if not k.upper().startswith('PG')};e['PATH']=str(B)+os.pathsep+e.get('PATH','')
res=[]
def run(args):return subprocess.run([str(x) for x in args],env=e,capture_output=True,text=True,timeout=45)
def cli(s):return run([B/'psql.exe','-X','-w','-h','127.0.0.1','-p',P,'-U','postgres','-d','postgres','-v','ON_ERROR_STOP=1','-At','-c',s])
def sql(s):
 r=cli(s)
 if r.returncode:raise RuntimeError(r.stderr)
 return r.stdout.strip()
def check(n,b):
 res.append({'test':n,'pass':bool(b)});print(n,b,flush=True)
 if not b:raise RuntimeError(n)
def f(s):
 p=O/'current.sql';p.write_text(s,encoding='utf8');return run([B/'psql.exe','-X','-w','-h','127.0.0.1','-p',P,'-U','postgres','-d','postgres','-v','ON_ERROR_STOP=1','-f',p])
started=False
try:
 r=run([B/'initdb.exe','-D',W/'data','-U','postgres','--auth=trust','--encoding=UTF8','--locale=C']);check('initdb',r.returncode==0)
 with (W/'data/postgresql.conf').open('a') as c:c.write("\nlisten_addresses='127.0.0.1'\nport=56559\n")
 with (O/'control.log').open('w') as log:r=subprocess.run([str(x) for x in [B/'pg_ctl.exe','-D',W/'data','-l',O/'server.log','-w','start']],env=e,stdout=log,stderr=log,timeout=40)
 check('start',r.returncode==0);started=True
 version=sql('select version()');(O/'version.txt').write_text(version)
 sql("CREATE ROLE anon; CREATE ROLE authenticated; CREATE ROLE service_role BYPASSRLS; CREATE SCHEMA auth; CREATE TABLE auth.users(id uuid primary key); INSERT INTO auth.users VALUES('00000000-0000-4000-8000-000000000001'); CREATE TABLE public.trips(id uuid,user_id uuid,data jsonb); CREATE TABLE public.trip_passes(id uuid primary key,user_id uuid,trip_key text,expires_at timestamptz,requests int,request_limit int,payment_reference text); CREATE TABLE public.ai_membership_usage(user_id uuid primary key,trip_key text,requests int); ALTER TABLE public.trips ENABLE ROW LEVEL SECURITY; ALTER TABLE public.trip_passes ENABLE ROW LEVEL SECURITY;")
 baseline=(R/'supabase/ai-quota-v2.sql').read_text();baseline=baseline[:baseline.index('-- Prevent the previous')]+ 'COMMIT;'
 r=f(baseline);check('synthetic_baseline',r.returncode==0)
 for name in ['01_PAID_DISCOVERY.sql','02_META_LEDGER.sql']:
  source=(R/'docs/production-proposal'/name).read_text();r=f(source);check(name+'_approval_gate',r.returncode!=0 and 'approval' in r.stderr.lower())
  source=source.replace('IF NOT false THEN','IF NOT true THEN')
  if name.startswith('01'):
   for signature,old in [('reserve_ai_request(uuid,text,uuid)','9c70e1275e786adbba55d4b052ed3a19'),('finish_ai_request(uuid,uuid,boolean)','e957ef1dbe378ae27d8f2ef8f7ad3151')]:
    actual=sql("SELECT md5(pg_get_functiondef('public."+signature+"'::regprocedure))");source=source.replace(old,actual)
  r=f(source);(O/(name+'.log')).write_text(r.stdout+r.stderr);check(name+'_apply',r.returncode==0)
 check('empty_closed_zero',sql("select allocated_usd=0 and total_limit_usd=0 and blocked and not exists(select 1 from meta_ai_requests) from meta_ai_budget")=='t')
 U="'00000000-0000-4000-8000-000000000001'";I="'00000000-0000-4000-8000-000000000002'"
 def reserve(i=I):return 'public.reserve_meta_ai_request('+i+','+U+')'
 def assertion(n,s):
  r=cli("BEGIN; DO $$ BEGIN IF NOT ("+s+") THEN RAISE EXCEPTION 'assertion'; END IF; END $$; ROLLBACK;");check(n,r.returncode==0)
 assertion('closed_reservation',"NOT ("+reserve()+"->>'allowed')::boolean")
 for role in ['anon','authenticated']:
  for obj in ['meta_ai_budget','meta_ai_requests']:
   check(role+'_'+obj+'_denied',cli('SET ROLE '+role+'; SELECT * FROM public.'+obj).returncode!=0)
  for rpc in [reserve(),'public.meta_ai_safety_status()','public.settle_meta_ai_request('+I+',.001,100,100)']:
   check(role+'_'+rpc.split('(')[0]+'_denied',cli('SET ROLE '+role+'; SELECT '+rpc).returncode!=0)
 check('security_definer_empty_search_path',sql("select bool_and(prosecdef AND proconfig=ARRAY['search_path=\"\"']) from pg_proc where proname in ('reserve_paid_ai_request','reserve_meta_ai_request','settle_meta_ai_request','meta_ai_safety_status')")=='t')
 activation=(R/'docs/production-proposal/03_ACTIVATE_APPROVED_CAP.sql').read_text()
 check('activation_approval_gate',f(activation).returncode!=0)
 activation=activation.replace('IF NOT false THEN','IF NOT true THEN')
 check('activation_sql03',f(activation).returncode==0)
 check('activation_replay_denied',f(activation).returncode!=0)
 check('activation_no_allocation',sql('select total_limit_usd=100 and allocated_usd=0 and not blocked from meta_ai_budget')=='t')
 check('unpaid_denied',sql('SET ROLE service_role; SELECT public.reserve_paid_ai_request('+U+','+I+")->>'allowed'; RESET ROLE;").splitlines()[-2]=='false')
 sql("INSERT INTO public.trip_passes VALUES(gen_random_uuid(),"+U+",'synthetic',now()+interval '1 hour',0,1,'synthetic')")
 check('paid_service_allowed','true' in sql('SET ROLE service_role; SELECT public.reserve_paid_ai_request('+U+','+I+")->>'allowed'; RESET ROLE;").splitlines())
 check('paid_pending_denied','false' in sql('SET ROLE service_role; SELECT public.reserve_paid_ai_request('+U+",gen_random_uuid())->>'allowed'; RESET ROLE;").splitlines())
 sql('SET ROLE service_role; SELECT public.finish_ai_request('+U+','+I+',true); RESET ROLE;')
 sql('SET ROLE service_role; SELECT public.finish_ai_request('+U+','+I+',true); RESET ROLE;')
 check('paid_finish_idempotent',sql('select requests=1 from public.trip_passes')=='t')
 check('consumed_denied','false' in sql('SET ROLE service_role; SELECT public.reserve_paid_ai_request('+U+",gen_random_uuid())->>'allowed'; RESET ROLE;").splitlines())
 for role in ['anon','authenticated']:
  check(role+'_paid_rpc_denied',cli('SET ROLE '+role+'; SELECT public.reserve_paid_ai_request('+U+',gen_random_uuid())').returncode!=0)

 check('cap_constraint',cli('update meta_ai_budget set total_limit_usd=100.01').returncode!=0)
 sql('select '+reserve());check('allocation_once',sql('select allocated_usd=.05 from meta_ai_budget')=='t')
 assertion('duplicate_denied',"NOT ("+reserve()+"->>'allowed')::boolean")
 assertion('global_pending_denied',"NOT ("+reserve('gen_random_uuid()')+"->>'allowed')::boolean")
 sql("update meta_ai_requests set created_at=now()-interval '1 day'")
 assertion('stale_pending_denied',"NOT ("+reserve('gen_random_uuid()')+"->>'allowed')::boolean")
 r=cli('BEGIN; SELECT public.settle_meta_ai_request('+I+',NULL,NULL,NULL); SELECT blocked from meta_ai_budget; ROLLBACK;');check('unknown_usage_blocks','t' in r.stdout.splitlines())
 sql('select public.settle_meta_ai_request('+I+',.001,100,100)')
 assertion('replay_idempotent',"(public.settle_meta_ai_request("+I+",.001,100,100)->>'ok')::boolean")
 assertion('replay_changed_rejected',"NOT (public.settle_meta_ai_request("+I+",.002,100,100)->>'ok')::boolean")
 assertion('normal_release',"("+reserve('gen_random_uuid()')+"->>'allowed')::boolean")
 sql('update meta_ai_budget set allocated_usd=99.95')
 args=[str(x) for x in [B/'psql.exe','-X','-w','-h','127.0.0.1','-p',P,'-U','postgres','-d','postgres','-v','ON_ERROR_STOP=1','-At','-c','BEGIN; SELECT '+reserve('gen_random_uuid()')+'; SELECT pg_sleep(3); COMMIT;']]
 a=subprocess.Popen(args,env=e,stdout=subprocess.PIPE,stderr=subprocess.PIPE,text=True)
 for _ in range(30):
  if sql("select count(*) from pg_stat_activity where wait_event='PgSleep'")=='1':break
  time.sleep(.1)
 else:raise RuntimeError('NO_OVERLAP')
 check('concurrent_lock_denied',cli('select '+reserve('gen_random_uuid()')).returncode!=0)
 a.communicate(timeout=10);check('first_connection_success',a.returncode==0)
 check('cap_100',sql('select allocated_usd=100 from meta_ai_budget')=='t')
 assertion('cap_denied',"NOT ("+reserve('gen_random_uuid()')+"->>'allowed')::boolean")
 check('history_preserved',sql('select count(*)=2 from meta_ai_requests')=='t')
except Exception as ex:
 res.append({'test':'completion','pass':False,'detail':str(ex)});print(str(ex))
finally:
 if started:
  r=run([B/'pg_ctl.exe','-D',W/'data','-m','fast','-w','stop']);res.append({'test':'server_stopped','pass':r.returncode==0})
 (O/'results.json').write_text(json.dumps(res,indent=2));print('PASS',sum(x['pass'] for x in res),'FAIL',sum(not x['pass'] for x in res))

