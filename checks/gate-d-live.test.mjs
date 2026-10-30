import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createGateDWorker,GATE_D_PROMPT} from '../worker/gate-d-qa.js';
const owner='11111111-1111-4111-8111-111111111111';
const env={SUPABASE_URL:'https://aytrcvfncsklhqozreyk.supabase.co',SUPABASE_PUBLISHABLE_KEY:'fixture',STAGING_OWNER_QA_USER_ID:owner,STAGING_OWNER_EMAIL:'owner@example.test',META_VIDEO_NONPRODUCTION:'true',META_AI_CUTOFF_AT:'2026-11-04T17:00:00Z'};
const body={prompt:GATE_D_PROMPT,consent:true,preferences:{origin:'CGK',days:3,people:1,budget:0,language:'id'}};
const req=(path='discover',b=body,headers={})=>new Request('http://127.0.0.1:8791/api/assistant/'+path,{method:'POST',headers:{Authorization:'Bearer fixture',Origin:'http://127.0.0.1:5176','Content-Type':'application/json',...headers},body:JSON.stringify(b)});
function fixture(user={id:owner,email:env.STAGING_OWNER_EMAIL,email_confirmed_at:'2026-10-01'}){let calls=0;const worker=createGateDWorker({fetcher:async url=>{assert.equal(url,env.SUPABASE_URL+'/auth/v1/user');return Response.json(user)},discover:async(request,e,options)=>{calls++;assert.equal(new URL(request.url).pathname.startsWith('/api/assistant/'),true);assert.equal(options.qaPreview,undefined);assert.equal(request.headers.get('Origin'),null);return Response.json({normalRoute:true})}});return {worker,calls:()=>calls};}
test('QA owner wrapper retains normal authenticated route, serializes one attempt, no retry',async()=>{
 const f=fixture();assert.equal((await f.worker.fetch(req('access',{}),env)).status,200);
 const results=await Promise.all([f.worker.fetch(req(),env),f.worker.fetch(req(),env)]);assert.deepEqual(results.map(r=>r.status).sort(),[200,409]);assert.equal(f.calls(),2);
});
test('unauthorized owner denied without invoking discovery',async()=>{
 const f=fixture({id:'other',email:'other@example.test',email_confirmed_at:'2026-10-01'});assert.equal((await f.worker.fetch(req(),env)).status,403);assert.equal(f.calls(),0);
});
test('deny missing QA owner binding, production URL, public host and unexpected origin',async()=>{
 const f=fixture();for(const bad of [{...env,STAGING_OWNER_QA_USER_ID:''},{...env,SUPABASE_URL:'https://production.invalid'}])assert.equal((await f.worker.fetch(req(),bad)).status,503);
 assert.equal((await f.worker.fetch(new Request('https://public.invalid/api/assistant/access'),env)).status,503);
 assert.equal((await f.worker.fetch(req('access',{}, {Origin:'https://other.invalid'}),env)).status,403);assert.equal(f.calls(),0);
});
test('all alternative generation, supplier, preview and probe endpoints closed',async()=>{
 const f=fixture();for(const path of ['/api/video-itinerary','/api/meta-qa/discovery-preview','/api/meta-qa/budget-probe','/api/itinerary','/api/flights','/api/hotels/search','/api/recommendations','/api/guide'])assert.equal((await f.worker.fetch(new Request('http://127.0.0.1:8791'+path),env)).status,404);assert.equal(f.calls(),0);
});
test('scenario mismatch and expiry never invoke discovery',async()=>{
 const f=fixture();assert.equal((await f.worker.fetch(req('discover',{...body,prompt:'different'}),env)).status,400);
 const original=Date.now;Date.now=()=>Date.parse(env.META_AI_CUTOFF_AT);try{const r=await f.worker.fetch(req(),env);assert.equal((await r.json()).code,'META_AI_EXPIRED')}finally{Date.now=original}assert.equal(f.calls(),0);
});
test('local live wiring has persistent exclusive attempt, isolated native secret loader and no public deploy',()=>{
 const source=readFileSync('qa-config/gate-d-live.mjs','utf8');assert.match(source,/openSync\(claim,'wx'\)/);assert.doesNotMatch(source,/unlink|rmSync|readFile|process\.env/);assert.match(source,/envFiles:\['\.dev\.vars\.meta-qa'\]/);assert.match(source,/remoteBindings:false/);assert.match(source,/pass\?\.remaining>=1/);assert.match(source,/createGateDWorker/);
});
