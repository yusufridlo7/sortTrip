import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,readdirSync} from 'node:fs';
import {META_HARD_CUTOFF,assertMetaActive,metaRequest} from '../worker/meta-request.js';
import {extractMetaText} from '../worker/video-itinerary.js';
import {handleMetaQAAccess,probeQANetwork} from '../worker/meta-qa-access.js';
import {handleAssistantDiscovery} from '../worker/assistant-discovery.js';
const env={META_AI_CUTOFF_AT:META_HARD_CUTOFF};
const deadline=Date.parse(META_HARD_CUTOFF);
test('exact WIB deadline; before allowed, exact/after blocked; cannot extend or omit config',()=>{
 assert.equal(deadline,Date.parse('2026-11-05T00:00:00+07:00'));
 assert.equal(assertMetaActive(env,deadline-1),deadline);
 for(const now of [deadline,deadline+1])assert.throws(()=>assertMetaActive(env,now),/META_AI_EXPIRED/);
 for(const value of [undefined,'','invalid','2026-11-06T00:00:00Z','2026-11-04','2026-02-30T00:00:00Z','2026-11-04T24:00:00Z'])assert.throws(()=>assertMetaActive({META_AI_CUTOFF_AT:value},deadline-1),/CUTOFF_INVALID/);
});
test('alternative/future guide and background API endpoints are expired through the same gate',()=>{
 const original=Date.now;Date.now=()=>deadline;
 try{for(const path of ['responses','responses/input_tokens','chat/completions','audio/transcriptions','files','models','status'])assert.throws(()=>metaRequest(env,'https://api.meta.ai/v1/'+path,{},()=>assert.fail('Meta egress')),/META_AI_EXPIRED/);}finally{Date.now=original;}
});
test('in-flight cutoff abort is returned as META_AI_EXPIRED, without retry',async()=>{
 const original=Date.now;let now=deadline-100;Date.now=()=>now;
 try{let calls=0;await assert.rejects(metaRequest(env,'https://api.meta.ai/v1/responses',{},async()=>{calls++;now=deadline;throw new DOMException('cancelled','AbortError')}),/META_AI_EXPIRED/);assert.equal(calls,1);}finally{Date.now=original;}
});
test('all Meta egress uses central gate; no other literal API endpoint callers',()=>{
 const callers=readdirSync('worker').filter(p=>p.endsWith('.js')&&readFileSync('worker/'+p,'utf8').includes('https://api.meta.ai'));
 assert.deepEqual(callers.sort(),['meta-qa-access.js','meta-request.js','video-itinerary.js']);
 for(const file of callers.filter(f=>f!=='meta-request.js'))assert.doesNotMatch(readFileSync('worker/'+file,'utf8'),/fetch(?:er)?\('https:\/\/api\.meta\.ai/);
});
test('dispatch rejects alternate endpoint, never retries or follows redirects',async()=>{
 const original=Date.now;Date.now=()=>deadline-10000;
 try{let calls=0;const fetcher=async(_,init)=>{calls++;assert.equal(init.redirect,'manual');return new Response(null,{status:429});};
 assert.equal((await metaRequest(env,'https://api.meta.ai/v1/responses',{},fetcher)).status,429);assert.equal(calls,1);
 assert.throws(()=>metaRequest(env,'https://other.invalid/v1/responses',{},fetcher),/ENDPOINT_DENIED/);assert.equal(calls,1);
 }finally{Date.now=original;}
});
for(const kind of ['transcript','frames','discovery'])test(kind+' expired/missing config never reserves or calls Meta',async()=>{
 const original=Date.now;Date.now=()=>deadline;
 try{for(const cutoff of [META_HARD_CUTOFF,undefined])await assert.rejects(extractMetaText('KL',{META_VIDEO_NONPRODUCTION:'true',META_VIDEO_TEXT_ENABLED:'true',META_MODEL_API_KEY:'fixture',META_AI_CUTOFF_AT:cutoff},{discovery:kind==='discovery',prepared:kind==='frames'?{}:null,fetcher:()=>assert.fail('egress')}),/META_AI_EXPIRED|CUTOFF_INVALID/);
 }finally{Date.now=original;}
});
test('a queued/in-flight preflight crossing cutoff cannot initiate inference',async()=>{
 const original=Date.now;let now=deadline-1000;Date.now=()=>now;
 try{let calls=0,settles=0;
 const e={...env,META_VIDEO_NONPRODUCTION:'true',META_VIDEO_TEXT_ENABLED:'true',META_MODEL_API_KEY:'fixture',META_TEST_BUDGET:{reserve:async r=>({allowed:true,id:r.id,hardCap:true,totalLimitUSD:10,reservedUSD:.05}),settle:async()=>{settles++;return {ok:true}}}};
 await assert.rejects(extractMetaText('KL',e,{fetcher:async url=>{assert.ok(url.endsWith('/input_tokens'));calls++;now=deadline;return Response.json({input_tokens:100})}}),/META_AI_EXPIRED/);
 assert.equal(calls,1);assert.equal(settles,1);
 assert.throws(()=>metaRequest(env,'https://api.meta.ai/v1/responses',{},()=>assert.fail('queued egress')),/META_AI_EXPIRED/);
 }finally{Date.now=original;}
});
test('expired metadata/health gates Meta only; QA auth health still works',async()=>{
 const original=Date.now;Date.now=()=>deadline;
 try{let calls=0;const fetcher=async url=>{calls++;assert.ok(url.includes('.supabase.co'));return new Response(null,{status:200})};
 const health=await (await probeQANetwork(fetcher,env)).json();assert.equal(health.metaHealth.diagnostic,'META_AI_EXPIRED');assert.equal(health.qaAuth.http,200);assert.equal(calls,1);
 const r=await handleMetaQAAccess(new Request('http://localhost/api/meta-qa/model-access',{method:'POST',headers:{Authorization:'Bearer fixture'}}),{...env,SUPABASE_URL:'https://qa.invalid',SUPABASE_PUBLISHABLE_KEY:'fixture',AI_LIMITER:{},META_MODEL_API_KEY:'fixture'},{fetcher:()=>assert.fail('metadata egress')});assert.equal((await r.json()).code,'META_AI_EXPIRED');
 }finally{Date.now=original;}
});
test('expired discovery rejects before entitlement RPC while access summary remains usable',async()=>{
 const original=Date.now;Date.now=()=>deadline;
 try{const e={...env,SUPABASE_URL:'https://qa.invalid',SUPABASE_PUBLISHABLE_KEY:'fixture',SUPABASE_SECRET_KEY:'fixture',AI_LIMITER:{limit:async()=>({success:true})}};
 const fetcher=async url=>{if(url.endsWith('/auth/v1/user'))return Response.json({id:'owner'});assert.ok(url.includes('trip_passes?'));return Response.json([])};
 const req=path=>new Request('http://localhost/api/assistant/'+path,{method:'POST',headers:{Authorization:'Bearer fixture','Content-Type':'application/json'},body:JSON.stringify({prompt:'KL',consent:true,preferences:{origin:'CGK',people:1,budget:0,days:3,language:'id'}})});
 const r=await handleAssistantDiscovery(req('discover'),e,{fetcher});assert.equal((await r.json()).code,'META_AI_EXPIRED');const access=await handleAssistantDiscovery(req('access'),e,{fetcher});assert.equal(access.status,200);assert.equal((await access.json()).meta.code,'META_AI_EXPIRED');
 }finally{Date.now=original;}
});
