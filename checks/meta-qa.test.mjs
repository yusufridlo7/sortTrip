import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import worker from '../worker/meta-qa.js';
import {metaVideoBudget} from '../worker/meta-video-budget.js';
const env={SUPABASE_URL:'https://aytrcvfncsklhqozreyk.supabase.co',META_VIDEO_NONPRODUCTION:'true',META_VIDEO_TEXT_ENABLED:'false',META_VIDEO_FRAMES_ENABLED:'false',META_VIDEO_BUDGET_READY:'false'};
test('QA entry refuses public hosts, wrong project and missing nonproduction gate',async()=>{
 for(const [url,e] of [['https://sorttrip.example/api/meta-qa/status',env],['http://127.0.0.1:8790/api/meta-qa/status',{...env,SUPABASE_URL:'https://wrong.supabase.co'}],['http://127.0.0.1:8790/api/meta-qa/status',{...env,META_VIDEO_NONPRODUCTION:'false'}]])assert.equal((await worker.fetch(new Request(url),e)).status,503);
});
test('QA status exposes only fixed metadata and never serves payment/booking/planner APIs',async()=>{
 const r=await worker.fetch(new Request('http://127.0.0.1:8790/api/meta-qa/status'),{...env,META_MODEL_API_KEY:'never-disclose',SUPABASE_SECRET_KEY:'never-disclose'});const b=await r.json();assert.equal(b.analysisEnabled,false);assert.equal(b.budgetMarkedReady,false);assert.equal(JSON.stringify(b).includes('never-disclose'),false);
 for(const path of ['/api/payments/checkout','/api/hotel-checkout/book','/api/itinerary','/api/support'])assert.equal((await worker.fetch(new Request('http://127.0.0.1:8790'+path),env)).status,404);
});
test('new Supabase secret key uses apikey only; legacy JWT compatibility is retained',async()=>{
 for(const binding of ['SUPABASE_SECRET_KEY','SUPABASE_SERVICE_ROLE_KEY']){let headers;const ledger=metaVideoBudget({...env,META_VIDEO_BUDGET_READY:'true',[binding]:'fixture-only'},async(u,o)=>{headers=o.headers;return Response.json({allowed:false,version:2,globalExclusive:true});});await ledger.reserve({id:'fixture',userId:'fixture-user'});assert.equal(headers.apikey,'fixture-only');assert.equal(headers.Authorization,binding==='SUPABASE_SECRET_KEY'?undefined:'Bearer fixture-only');}
});
test('owner-enabled interactive QA stays local, budget-gated and isolated from generic credentials',()=>{
 const cfg=JSON.parse(readFileSync(new URL('../wrangler.meta-qa.jsonc',import.meta.url),'utf8'));const vars=cfg.env['meta-qa'].vars;assert.equal(vars.META_VIDEO_TEXT_ENABLED,'true');assert.equal(vars.META_VIDEO_BUDGET_READY,'true');assert.equal(vars.META_VIDEO_FRAMES_ENABLED,'true');assert.equal(vars.META_VIDEO_NONPRODUCTION,'true');assert.equal(vars.SUPABASE_URL,env.SUPABASE_URL);assert.equal(cfg.workers_dev,false);assert.equal(cfg.preview_urls,false);assert.equal(cfg.main,'worker/meta-qa.js');assert.equal(cfg.browser,undefined);assert.equal(cfg.kv_namespaces,undefined);
 const launcher=readFileSync(new URL('../scripts/run-meta-qa.mjs',import.meta.url),'utf8');assert.ok(launcher.indexOf('if(!existsSync')<launcher.indexOf('const child=spawn'));assert.doesNotMatch(launcher,/readFile|readFileSync|dotenv\.config/);assert.match(launcher,/--local/);assert.match(launcher,/--env','meta-qa'/);
 const frontend=readFileSync(new URL('../vite.meta-qa.config.js',import.meta.url),'utf8');assert.match(frontend,/qa-config\/meta/);assert.match(frontend,/127\.0\.0\.1:8790/);assert.doesNotMatch(frontend,/8787|SUPABASE_SECRET_KEY|META_MODEL_API_KEY/);
});
