import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {handleQABudget} from '../worker/meta-qa-budget.js';
import {reviewedTrip} from '../lib/reviewed-trip.mjs';
import {demoDestinations,initialVideoTrip,normalizeDestinations} from '../lib/video-itinerary.mjs';
const sample=()=>demoDestinations().destinations;
const env={SUPABASE_URL:'https://aytrcvfncsklhqozreyk.supabase.co',SUPABASE_PUBLISHABLE_KEY:'public-fixture',SUPABASE_SECRET_KEY:'private-fixture',META_AI_CUTOFF_AT:'2026-11-04T17:00:00Z',META_VIDEO_NONPRODUCTION:'true',AI_LIMITER:{limit:async()=>({success:true})}};
const req=(body={confirm:'allocate-005-no-refund'},headers={})=>new Request('http://127.0.0.1:8790/api/meta-qa/budget-probe',{method:'POST',headers:{Authorization:'Bearer fixture','Content-Type':'application/json',...headers},body:JSON.stringify(body)});
function setup({settleOK=true,denied=false,redirect=false}={}){
 let allocation=0;const calls=[];
 const fetcher=async(u,o)=>{calls.push([u,o]);assert.equal(o.redirect,'manual');
  if(u.endsWith('/auth/v1/user'))return Response.json({id:'qa-user'});
  if(u.includes('/meta_video_test_budget?'))return Response.json([{allocated_usd:allocation,blocked:false}]);
  if(u.endsWith('/meta_video_test_safety_status'))return Response.json({version:2,globalExclusive:true});
  if(u.endsWith('/reserve_meta_video_test')){assert.equal(JSON.parse(o.body).p_user,'qa-user');if(redirect)return new Response(null,{status:302,headers:{Location:'https://untrusted.invalid'}});if(denied)return Response.json({allowed:false});allocation+=.05;return Response.json({allowed:true,id:'qa-request',globalExclusive:true,hardCap:true,reservedUSD:.05,totalLimitUSD:10});}
  if(u.endsWith('/settle_meta_video_test')){const body=JSON.parse(o.body);assert.equal(body.p_request,'qa-request');assert.equal(body.p_estimated_usd,null);return Response.json({ok:settleOK});}
  throw Error('Unexpected network target');
 };return {fetcher,calls};
}
test('QA runtime reserve/unknown-usage settle consumes .05 without Meta or credential disclosure',async()=>{
 const s=setup(),r=await handleQABudget(req(),env,s);assert.equal(r.status,200);const data=await r.json();assert.equal(data.allocatedUSD,.05);assert.equal(data.remainingUSD,9.95);assert.equal(data.unknownUsageRetained,true);assert.equal(data.metaCalls,0);assert.equal(s.calls.length,6);assert.ok(s.calls.every(([u])=>u.startsWith(env.SUPABASE_URL+'/')));assert.doesNotMatch(JSON.stringify(data),/private-fixture|qa-user|qa-request/);
 const reserve=s.calls.find(([u])=>u.endsWith('/reserve_meta_video_test'));assert.equal(reserve[1].headers.Authorization,undefined);
});
test('QA budget probe rejects guest/origin/project/consent before reserving',async()=>{
 for(const [request,e,status] of [[req({}, {Authorization:''}),env,401],[req(undefined,{Origin:'https://untrusted.invalid'}),env,403],[req(),{...env,SUPABASE_URL:'https://production.invalid'},503],[req({confirm:'yes'}),env,400]]){
  const s=setup();assert.equal((await handleQABudget(request,e,s)).status,status);assert.ok(!s.calls.some(([u])=>u.includes('/rpc/')));
 }
});
test('QA budget denial/redirect/uncertain settlement never retries or claims success',async()=>{
 for(const options of [{denied:true},{redirect:true},{settleOK:false}]){const s=setup(options),r=await handleQABudget(req(),env,s);assert.equal(r.status,options.denied?429:503);assert.equal(s.calls.filter(([u])=>u.endsWith('/reserve_meta_video_test')).length,1);assert.ok(!s.calls.some(([u])=>u.includes('untrusted.invalid')));}
});
test('QA read-status performs no reserve or settle and permission diagnostics disclose only a fixed category',async()=>{
 const s=setup(),r=await handleQABudget(req({confirm:'read-status'}),env,s);assert.equal(r.status,200);assert.equal((await r.json()).allocatedUSD,0);assert.equal(s.calls.length,2);assert.ok(!s.calls.some(([u])=>u.includes('/rpc/')));
 const fetcher=async u=>u.endsWith('/auth/v1/user')?Response.json({id:'qa-user'}):Response.json({code:'42501',message:'fixture private error with key never-display'},{status:403});
 const error=await (await handleQABudget(req({confirm:'read-status'}),env,{fetcher})).json();assert.equal(error.stage,'budget-read');assert.equal(error.providerStatus,403);assert.equal(error.reason,'DATABASE_PERMISSION_DENIED');assert.doesNotMatch(JSON.stringify(error),/never-display|qa-user|private error/);
});
test('reviewed draft preserves budget/dates/preferences/order and exact protected rows without AI',()=>{
 const candidates=sample(),base=initialVideoTrip(candidates,{start:'2027-01-30',days:3,people:3});
 const hotel={id:'hotel',title:'Owner hotel',day:1,time:'15:00',category:'Penginapan',price:450000,paid:true};
 const trip={...base,id:'existing-trip',items:[hotel],budget:4500000,origin:'SUB',aiPrompt:'Hotel below 500000; walk first',aiPace:'santai',aiTransportPreference:'hemat'};
 assert.throws(()=>reviewedTrip(candidates,trip),/REVIEW_REQUIRED/);
 const next=reviewedTrip([...candidates].reverse(),trip,{reviewed:true});
 for(const key of ['id','start','days','people','budget','origin','aiPrompt','aiPace','aiTransportPreference'])assert.deepEqual(next[key],trip[key]);
 assert.strictEqual(next.items[0],hotel);assert.equal(next.items[1].title,candidates[1].name);assert.equal(next.items[1].priceUnknown,true);assert.equal(next.assistantMedia.length,2);assert.equal(next.assistantMedia[0].sourceEvidence,undefined);
 const again=reviewedTrip(candidates,next,{reviewed:true});assert.equal(again.items.length,3);assert.strictEqual(again.items[0],hotel);
});
test('grounding rejects unknown or wrong city and keeps duplicate and empty review safe',()=>{
 const fields=['name','city','country','category','activity','sourceEvidence','evidenceKind','confidence','verified','recommendedDurationMinutes'];const raw=c=>Object.fromEntries(fields.map(k=>[k,c[k]]));const a=raw(sample()[0]);
 const duplicates=normalizeDestinations({destinations:[a,{...a,name:'National Museum'}]});assert.equal(duplicates[1].duplicate,true);
 const base={start:'2027-01-30',days:3,people:1,items:[]};
 for(const changed of [{...a,name:'Unknown Museum'},{...a,city:'Hanoi'}]){const rows=normalizeDestinations({destinations:[changed]});assert.equal(rows[0].verified,false);assert.equal(rows[0].geo,undefined);assert.throws(()=>reviewedTrip(rows,base,{reviewed:true}),/REVIEW_REQUIRED/);}
 assert.throws(()=>reviewedTrip([],base,{reviewed:true}),/REVIEW_REQUIRED/);
 assert.throws(()=>normalizeDestinations({destinations:[{...a,unexpected:'x'}]}),/INVALID_MODEL_OUTPUT/);
});
test('QA bridge reuses normal draft/save architecture and does not enable provider flags',()=>{
 const source=readFileSync(new URL('../app/travel-app.tsx',import.meta.url),'utf8');assert.match(source,/import\.meta\.env\.MODE==='meta-qa'&&options\.initialTrip/);assert.match(source,/reviewedTrip\(candidates/);assert.match(source,/import\.meta\.env\.MODE!=='meta-qa'&&requestAI/);
 const worker=readFileSync(new URL('../worker/meta-qa.js',import.meta.url),'utf8');assert.doesNotMatch(worker,/payments|handleItinerary|handleBooking/);
 // Interactive activation is owner-controlled in the separate local config;
 // rendering/converting a reviewed draft cannot switch provider/budget flags.
 assert.doesNotMatch(source,/META_VIDEO_(?:TEXT_ENABLED|FRAMES_ENABLED|BUDGET_READY)/);
 const cfg=JSON.parse(readFileSync(new URL('../wrangler.meta-qa.jsonc',import.meta.url),'utf8'));assert.equal(cfg.env['meta-qa'].vars.META_VIDEO_NONPRODUCTION,'true');assert.equal(cfg.workers_dev,false);
 const ui=readFileSync(new URL('../app/meta-qa-access.tsx',import.meta.url),'utf8');assert.match(ui,/tr\(budgetResult.key,budgetResult.values\)/);assert.doesNotMatch(ui,/setBudgetResult\(tr\(/);
});
