import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import ts from 'typescript';
import {QA_PROJECT_URL,STAGING_ORIGIN} from '../worker/staging-access.js';
import {loadStagingGateAConfig,evaluateGateA} from '../qa-config/gate-a.mjs';
export function verifyStagingBuild(root=process.cwd()){
 const c=ts.parseConfigFileTextToJson('staging',fs.readFileSync(path.join(root,'wrangler.staging.jsonc'),'utf8')).config;
 const assert=(ok,code)=>{if(!ok)throw Error(code);};
 assert(c.name==='sorttrip-staging'&&c.main==='worker/staging.js','WRONG_WORKER');
 assert(c.vars.SUPABASE_URL===QA_PROJECT_URL&&c.vars.STAGING_ORIGIN===STAGING_ORIGIN,'WRONG_PROJECT_OR_HOST');
 assert(c.assets.directory==='./dist-staging'&&c.assets.run_worker_first===true&&c.preview_urls===false,'ASSET_OR_INGRESS_ISOLATION');
 assert(!c.browser&&!c.kv_namespaces&&!c.triggers,'PRODUCTION_RESOURCE_BINDING');
 for(const key of ['STAGING_GENERATION_ENABLED','META_VIDEO_TEXT_ENABLED','META_VIDEO_FRAMES_ENABLED','META_VIDEO_BUDGET_READY','QA_SUPPLIER_READS_ENABLED'])assert(c.vars[key]==='false','GENERATION_NOT_DISABLED');
 const files=[];function walk(dir){for(const e of fs.readdirSync(dir,{withFileTypes:true})){const p=path.join(dir,e.name);if(e.isDirectory())walk(p);else files.push(p);}}walk(path.join(root,'dist-staging'));
 assert(fs.existsSync(path.join(root,'dist-staging/index.html')),'INDEX_MISSING');
 assert(fs.readFileSync(path.join(root,'dist-staging/index.html'),'utf8').includes('name="sorttrip-qa-auth-ready" content="true"'),'STAGING_OWNER_AUTH_NOT_CONFIGURED');
 const {config:ownerConfig}=loadStagingGateAConfig();
 assert(evaluateGateA(ownerConfig,{environment:'staging',allowAuthentication:true}).authEnabled,'STAGING_OWNER_REVIEW_REQUIRED');
 for(const [binding,value] of [['STAGING_OWNER_QA_USER_ID',ownerConfig.owner.qaUserId],['STAGING_OWNER_EMAIL',ownerConfig.owner.email],['CF_ACCESS_ISSUER',ownerConfig.review.accessIssuer],['CF_ACCESS_AUD',ownerConfig.review.accessAudience]])assert(c.vars[binding]===value,'STAGING_WORKER_OWNER_CONFIG_MISMATCH');
 let foundQA=false;
 for(const p of files){if(!/\.(js|css|html|json)$/.test(p))continue;const text=fs.readFileSync(p,'utf8');foundQA ||= text.includes(QA_PROJECT_URL);
  assert(!text.includes('tznxfgosmjcmwoszvkdk.supabase.co')&&!text.includes('sorttrip.yusufridlo7.workers.dev'),'PRODUCTION_URL_IN_BUILD');
  assert(!/sb_secret_[A-Za-z0-9_-]{12,}|Mid-server-[A-Za-z0-9_-]{10,}|nonsecret-fixture-token|SIMULATED QA/.test(text),'SECRET_OR_FIXTURE_IN_BUILD');
  for(const m of text.matchAll(/eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/g)){try{const body=JSON.parse(Buffer.from(m[0].split('.')[1],'base64url').toString());assert(body.role!=='service_role','SERVICE_ROLE_JWT_IN_BUILD');assert(!body.ref||body.ref==='aytrcvfncsklhqozreyk','WRONG_PROJECT_JWT_IN_BUILD');}catch(e){if(['SERVICE_ROLE_JWT_IN_BUILD','WRONG_PROJECT_JWT_IN_BUILD'].includes(e.message))throw e;}}
 }
 assert(foundQA,'QA_URL_MISSING');return {verified:true,files:files.length,qaProjectOnly:true,generationDisabled:true};
}
if(process.argv[1]&&path.resolve(process.argv[1])===path.resolve(fileURLToPath(import.meta.url))){try{console.log(JSON.stringify(verifyStagingBuild()));}catch(e){console.error('STAGING_VERIFY_FAILED: '+e.message);process.exitCode=1;}}
