// File preparation ONLY. Never connects to PostgreSQL or reads credentials.
import {readFile,writeFile,mkdir} from 'node:fs/promises';
const out='artifacts/gate-d-rehearsal';await mkdir(out,{recursive:true});
const guard=`DO $$ BEGIN IF current_database() NOT LIKE 'sorttrip_gate_d_rehearsal%' OR current_user<>'postgres' THEN RAISE EXCEPTION 'Disposable local database required'; END IF; END $$;\n`;
const old=await readFile('supabase/meta-video-budget.sql','utf8');
await writeFile(out+'/00_synthetic_baseline.sql',`-- DISPOSABLE ONLY. Never QA or production.\n${guard}
CREATE SCHEMA IF NOT EXISTS auth;
CREATE TABLE auth.users(id uuid PRIMARY KEY);
DO $$ BEGIN IF NOT EXISTS(SELECT FROM pg_roles WHERE rolname='anon') THEN CREATE ROLE anon NOLOGIN; END IF;
IF NOT EXISTS(SELECT FROM pg_roles WHERE rolname='authenticated') THEN CREATE ROLE authenticated NOLOGIN; END IF;
IF NOT EXISTS(SELECT FROM pg_roles WHERE rolname='service_role') THEN CREATE ROLE service_role NOLOGIN; END IF; END $$;
${old}
INSERT INTO auth.users VALUES('00000000-0000-4000-8000-000000000001'),('00000000-0000-4000-8000-000000000002');
INSERT INTO public.meta_video_test_requests(id,user_id,settled_at,estimated_usd,input_tokens,output_tokens)
SELECT md5('synthetic-'||i)::uuid,'00000000-0000-4000-8000-000000000001',now(),0.001,100,CASE WHEN i=1 THEN 2305 ELSE 100 END FROM generate_series(1,7) i;
UPDATE public.meta_video_test_budget SET allocated_usd=0.35,blocked=false WHERE id=true;
`);
const proposal=await readFile('docs/staging-proposal/sql/08_PROPOSED_GLOBAL_META_GUARD.sql','utf8');
await writeFile(out+'/01_rehearsal_migration.sql','-- SYNTHETIC REHEARSAL COPY ONLY; never deploy this copy.\n'+guard+proposal.replace("verified_project_ref constant text := 'UNVERIFIED'","verified_project_ref constant text := 'aytrcvfncsklhqozreyk'"));
console.log('PREPARED_ONLY: '+out+'; no SQL executed');
