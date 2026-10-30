"""Owner-authorized, local disposable PostgreSQL rehearsal. Never remote."""
import hashlib, json, os, socket, subprocess, time, zipfile, sys
from pathlib import Path

ROOT=Path(__file__).resolve().parents[1]
WORK=ROOT/'.sorttrip-qa/pg-rehearsal-20261029-02'
OUT=ROOT/'artifacts/gate-d-postgres'
ARCHIVE=Path('C:/Users/Yusuf Ridlo/Downloads/postgresql-18.6-5-windows-x64-binaries.zip')
SHA='e2246ba91d22345bc3d017586c09ede52d9df180b1eeb480f050445f1cad84e2'
DB='sorttrip_gate_d_rehearsal_20261029'
PORT=56549
results=[]
env={k:v for k,v in os.environ.items() if not k.upper().startswith('PG')}
def record(name,ok,detail=''):
    results.append(dict(test=name,passed=bool(ok),detail=detail))
    print(('PASS ' if ok else 'FAIL ')+name,flush=True)
def cmd(args,timeout=30):
    if str(args[0]).endswith('pg_ctl.exe'):
        with (OUT/'pg-ctl-command.log').open('a',encoding='utf-8') as log:
            r=subprocess.run([str(a) for a in args],env=env,cwd=ROOT,stdin=subprocess.DEVNULL,stdout=log,stderr=log,timeout=timeout)
        return subprocess.CompletedProcess(args,r.returncode,'','')
    return subprocess.run([str(a) for a in args],env=env,cwd=ROOT,capture_output=True,text=True,encoding='utf-8',errors='replace',timeout=timeout)
def sql(text,check=True):
    r=cmd([BIN/'psql.exe','-X','-w','-h','127.0.0.1','-p',PORT,'-U','postgres','-d',DB,'-v','ON_ERROR_STOP=1','-At','-c',text])
    if check and r.returncode: raise RuntimeError(r.stderr+r.stdout)
    return r
def file_sql(name,path,expected=None):
    r=cmd([BIN/'psql.exe','-X','-w','-h','127.0.0.1','-p',PORT,'-U','postgres','-d',DB,'-v','ON_ERROR_STOP=1','-f',path])
    (OUT/(name+'.log')).write_text(r.stdout+r.stderr,encoding='utf-8')
    ok=r.returncode==0 if expected is None else r.returncode!=0 and expected in r.stderr
    record(name,ok)
    if not ok: raise RuntimeError(name+': '+r.stderr)
    return r
def snapshot():
    return sql("SELECT jsonb_build_object('allocated',b.allocated_usd,'blocked',b.blocked,'requests',(SELECT count(*) FROM public.meta_video_test_requests),'pending',(SELECT count(*) FROM public.meta_video_test_requests WHERE settled_at IS NULL),'budget_hash',md5(to_jsonb(b)::text),'history_hash',(SELECT md5(string_agg(to_jsonb(r)::text,E'\\n' ORDER BY id)) FROM public.meta_video_test_requests r)) FROM public.meta_video_test_budget b WHERE id=true").stdout.strip()

OUT.mkdir(parents=True,exist_ok=True)
resume='--resume-owned-cluster' in sys.argv
if WORK.exists() and not resume: raise SystemExit('STOP: existing rehearsal directory; never reuse/delete automatically')
if resume and (WORK/'data/PG_VERSION').read_text().strip()!='18': raise SystemExit('STOP wrong owned-cluster version')
if hashlib.sha256(ARCHIVE.read_bytes()).hexdigest()!=SHA: raise SystemExit('STOP archive checksum mismatch')
record('vendor_archive_sha256',True,SHA)
with socket.socket() as probe: probe.bind(('127.0.0.1',PORT))
WORK.mkdir(parents=True,exist_ok=resume)
with zipfile.ZipFile(ARCHIVE) as z:
    for member in z.infolist():
        if not member.filename.startswith(('pgsql/bin/','pgsql/lib/','pgsql/share/')): continue
        target=(WORK/'runtime'/member.filename).resolve()
        if not target.is_relative_to((WORK/'runtime').resolve()): raise RuntimeError('Unsafe ZIP path')
        if not resume: z.extract(member,WORK/'runtime')
BIN=WORK/'runtime/pgsql/bin'
env['PATH']=str(BIN)+os.pathsep+env.get('PATH','') # child processes only
DATA=WORK/'data'
started=False
try:
    version=cmd([BIN/'postgres.exe','--version']);(OUT/'version.log').write_text(version.stdout+version.stderr)
    if version.returncode: raise RuntimeError('Cannot execute trusted PostgreSQL runtime')
    if not resume:
      with (OUT/'initdb.log').open('w',encoding='utf-8') as initlog:
        init=subprocess.run([str(a) for a in [BIN/'initdb.exe','-D',DATA,'-U','postgres','--auth=trust','--encoding=UTF8','--locale=C']],env=env,stdin=subprocess.DEVNULL,stdout=initlog,stderr=initlog,timeout=90)
      if init.returncode: raise RuntimeError('initdb failed; inspect initdb.log')
    # Trust applies only to this disposable synthetic cluster on loopback.
    with (DATA/'postgresql.conf').open('a') as config:
        config.write("\nlisten_addresses='127.0.0.1'\nport=56549\nmax_connections=12\n")
    start=cmd([BIN/'pg_ctl.exe','-D',DATA,'-l',OUT/'server.log','-w','start'],60)
    (OUT/'start.log').write_text(start.stdout+start.stderr,encoding='utf-8')
    if start.returncode: raise RuntimeError('pg_ctl start failed: '+start.stderr)
    started=True
    create=cmd([BIN/'createdb.exe','-w','-h','127.0.0.1','-p',PORT,'-U','postgres',DB])
    if create.returncode and not (resume and 'already exists' in create.stderr): raise RuntimeError(create.stderr)
    identity=sql("SELECT current_database()||'|'||current_user||'|'||host(inet_server_addr())||'|'||inet_server_port()||'|'||current_setting('listen_addresses')").stdout.strip()
    record('new_local_database_identity',identity==DB+'|postgres|127.0.0.1|56549|127.0.0.1',identity)
    if not results[-1]['passed']: raise RuntimeError('Identity mismatch')
    if '--additional-only' in sys.argv:
        exec((ROOT/'scripts/gate-d-postgres-additional.py').read_text(),globals())
    else:
        file_sql('synthetic_baseline',ROOT/'artifacts/gate-d-rehearsal/00_synthetic_baseline.sql')
        baseline=snapshot();(OUT/'baseline.json').write_text(baseline)
        fingerprint=sql("SELECT proname||'|'||md5(pg_get_functiondef(oid)) FROM pg_proc WHERE proname IN ('reserve_meta_video_test','settle_meta_video_test') ORDER BY proname").stdout
        (OUT/'baseline-fingerprints.log').write_text(fingerprint)
        file_sql('closed_project_guard',ROOT/'docs/staging-proposal/sql/08_PROPOSED_GLOBAL_META_GUARD.sql','STOP verify QA dashboard/project')
        record('failed_migration_preserves_data',snapshot()==baseline)
        file_sql('sql08_migration',ROOT/'artifacts/gate-d-rehearsal/01_rehearsal_migration.sql')
        record('migration_preserves_all_history',snapshot()==baseline)
        file_sql('behavior_assertions',ROOT/'docs/staging-proposal/rehearsal/02_assertions.sql')
        record('behavior_rollback_preserves_all_history',snapshot()==baseline)
        # Two actual backend connections. Wait until A's bounded sleep is visible.
        args=[BIN/'psql.exe','-X','-w','-h','127.0.0.1','-p',PORT,'-U','postgres','-d',DB,'-v','ON_ERROR_STOP=1','-f',ROOT/'docs/staging-proposal/rehearsal/03_connection_a.sql']
        a=subprocess.Popen([str(v) for v in args],env=env,cwd=ROOT,stdout=subprocess.PIPE,stderr=subprocess.PIPE,text=True)
        deadline=time.monotonic()+10
        while time.monotonic()<deadline:
            if sql("SELECT count(*) FROM pg_stat_activity WHERE datname=current_database() AND pid<>pg_backend_pid() AND wait_event='PgSleep'").stdout.strip()=='1': break
            time.sleep(.1)
        else: raise RuntimeError('NO_OVERLAP: A not observed sleeping')
        record('independent_connection_overlap',True)
        b=file_sql('connection_b',ROOT/'docs/staging-proposal/rehearsal/04_connection_b.sql')
        record('connection_b_lock_timeout_expected','PASS: independent connection serialized' in b.stderr)
        stdout,stderr=a.communicate(timeout=25);(OUT/'connection_a.log').write_text(stdout+stderr)
        record('connection_a_rolled_back',a.returncode==0)
        record('concurrency_rollback_preserves_all_history',snapshot()==baseline)
        for role in ['anon','authenticated']:
            for fn in ["reserve_meta_video_test(gen_random_uuid(),'00000000-0000-4000-8000-000000000001')","settle_meta_video_test(gen_random_uuid(),0.001,100,100)","meta_video_test_safety_status()"]:
                r=sql('BEGIN; SET LOCAL ROLE '+role+'; SELECT public.'+fn+'; ROLLBACK;',False)
                record(role+'_'+fn.split('(')[0]+'_denied',r.returncode!=0 and 'permission denied' in r.stderr)
        file_sql('postflight',ROOT/'docs/staging-proposal/sql/09_READ_ONLY_POST_SQL08.sql')
        record('final_history_unchanged',snapshot()==baseline)

except Exception as e:
    record('rehearsal_completed',False,str(e));print(str(e),flush=True)
finally:
    if started:
        stop=cmd([BIN/'pg_ctl.exe','-D',DATA,'-w','-m','fast','stop'],60)
        (OUT/'stop.log').write_text(stop.stdout+stop.stderr,encoding='utf-8')
        record('server_stopped',stop.returncode==0)
    (OUT/'results.json').write_text(json.dumps({'tests':results,'pass':sum(r['passed'] for r in results),'fail':sum(not r['passed'] for r in results),'sql08_applied_remote':False},indent=2),encoding='utf-8')
if any(not r['passed'] for r in results): raise SystemExit(1)
