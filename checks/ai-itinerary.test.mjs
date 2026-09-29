import {test} from 'node:test';
import assert from 'node:assert/strict';
import {validateInput,validatePlan,handleItinerary} from '../worker/itinerary.js';
const q=validateInput({city:'Tokyo',start:'2027-01-10',days:3,people:1,budget:5000000,arrival:'14:00',arrivalDay:0,returnAt:'2027-01-12T18:00:00+09:00'});
const sources=[{url:'https://example.com/place',title:'Place'}];
const plan={summary:'Rancangan',activities:[{day:2,time:'10:00',category:'Wisata',title:'A',sourceUrl:sources[0].url},{day:2,time:'14:00',category:'Wisata',title:'B',sourceUrl:sources[0].url}]};
test('preserves cited activities but never model prices or booking URLs',()=>{const p=validatePlan({...plan,activities:plan.activities.map(a=>({...a,price:123,bookingUrl:'https://fake.com'}))},q,sources);assert.equal(p.activities.length,2);assert.equal(p.activities[0].price,undefined);assert.equal(p.activities[0].bookingUrl,undefined);});
test('rejects ungrounded source and unsafe URL',()=>{assert.throws(()=>validatePlan({...plan,activities:[{...plan.activities[0],sourceUrl:'javascript:alert(1)'}]},q,sources));});
test('rejects activities before arrival and too close to departure',()=>{for(const a of [{day:1,time:'15:00'},{day:3,time:'15:00'}])assert.throws(()=>validatePlan({...plan,activities:[{...plan.activities[0],...a},plan.activities[1]]},q,sources));});
test('rejects conflicting locked bookings',()=>{assert.throws(()=>validatePlan(plan,{...q,locked:[{day:2,time:'10:30',title:'Paid'}]},sources));});
test('rejects oversized trip and invalid day',()=>{assert.throws(()=>validateInput({...q,days:999}));assert.throws(()=>validatePlan({...plan,activities:[{...plan.activities[0],day:4}]},q,sources));});
test('unconfigured server is explicit and old trip is not mutated',async()=>{assert.equal((await handleItinerary(new Request('https://sorttrip.test/api/itinerary',{method:'POST'}),{})).status,503);});
test('configured server requires auth before upstream spend',async()=>{assert.equal((await handleItinerary(new Request('https://sorttrip.test/api/itinerary',{method:'POST'}),{OPENAI_API_KEY:'test',SUPABASE_URL:'https://test.supabase.co',SUPABASE_PUBLISHABLE_KEY:'test',AI_LIMITER:{}})).status,401);});
test('cross-origin calls rejected',async()=>{assert.equal((await handleItinerary(new Request('https://sorttrip.test/api/itinerary',{method:'POST',headers:{Origin:'https://other.test'}}),{})).status,403);});
test('authenticated workflow uses web search, returns draft, sanitizes secrets',async()=>{
 const original=globalThis.fetch;let count=0;
 globalThis.fetch=async(url,opts)=>{count++;if(String(url).endsWith('/auth/v1/user'))return Response.json({id:'user-1'});if(String(url).includes('claim_ai_request'))return Response.json({allowed:true,remaining:1});const body=JSON.parse(opts.body);assert.equal(body.store,false);assert.equal(body.tools[0].type,'web_search');return Response.json({status:'completed',output:[{type:'web_search_call',action:{sources}},{type:'message',content:[{type:'output_text',text:JSON.stringify(plan)}]}]});};
 try{const r=await handleItinerary(new Request('https://sorttrip.test/api/itinerary',{method:'POST',headers:{Authorization:'Bearer test-token'},body:JSON.stringify(q)}),{OPENAI_API_KEY:'never-show-secret',SUPABASE_URL:'https://test.supabase.co',SUPABASE_PUBLISHABLE_KEY:'public-key',AI_LIMITER:{limit:async()=>({success:true})}});assert.equal(r.status,200);const body=await r.text();assert.ok(!body.includes('never-show-secret'));assert.equal(JSON.parse(body).plan.activities.length,2);assert.equal(count,3);}finally{globalThis.fetch=original;}
});
test('exhausted Basic is rejected before any AI spend',async()=>{
 const original=globalThis.fetch;let paidCalls=0;
 globalThis.fetch=async url=>{if(String(url).endsWith('/auth/v1/user'))return Response.json({id:'user'});if(String(url).includes('claim_ai_request'))return Response.json({allowed:false,remaining:0});paidCalls++;throw Error('must not call');};
 try{const r=await handleItinerary(new Request('https://sorttrip.test/api/itinerary',{method:'POST',headers:{Authorization:'Bearer test'},body:JSON.stringify(q)}),{OPENAI_API_KEY:'test',SUPABASE_URL:'https://test.supabase.co',SUPABASE_PUBLISHABLE_KEY:'test',AI_LIMITER:{limit:async()=>({success:true})}});assert.equal(r.status,402);assert.equal(paidCalls,0);}finally{globalThis.fetch=original;}
});
