import test from 'node:test';
import assert from 'node:assert/strict';
import {handleAssistantDiscovery} from '../worker/assistant-discovery.js';
import {normalizeDiscovery} from '../worker/assistant-discovery-contract.js';
import {VideoError} from '../lib/video-itinerary.mjs';
const option={city:'Hanoi',airport:'HAN',country:'Vietnam',days:5,summary:'Hanoi museums',stops:[{day:1,time:'10:00',title:'Museum',category:'Wisata',place:'Hanoi',note:'Check admission'}]};
option.stops.push(...Array.from({length:4},(_,i)=>({day:i+1,time:'20:00',title:'Stay area',category:'Penginapan',place:'Hanoi',note:'Choose hotel'})),{day:5,time:'10:00',title:'Airport transfer',category:'Transportasi',place:'Hanoi',note:'Check route'});
const body={prompt:'Vietnam https://vt.tiktok.com/ZSgq41yuY/',consent:true,preferences:{origin:'CGK',people:1,budget:0,days:null,language:'id'}};
function fixture({paid=true,dbError=false,failModel=false,clarify=false,failFinish=false}={}){
 const events=[];
 const env={META_AI_CUTOFF_AT:'2026-11-04T17:00:00Z',SUPABASE_URL:'https://qa.invalid',SUPABASE_PUBLISHABLE_KEY:'public-fixture',SUPABASE_SECRET_KEY:'server-fixture',AI_LIMITER:{limit:async()=>({success:true})}};
 const fetcher=async(url,init)=>{
  if(new URL(url).hostname.endsWith('tiktok.com'))return new Response(null,{status:403});
  const path=new URL(url).pathname;events.push({path,body:init.body?JSON.parse(init.body):null});
  if(path.endsWith('/user'))return Response.json({id:'fixture-user'});
  assert.equal(init.headers.Authorization,undefined,'modern secret is not sent as JWT');
  if(dbError)return Response.json({}, {status:403});
  if(path.includes('/trip_passes'))return Response.json(paid?[{expires_at:'2099-01-01',request_limit:20,requests:2}]:[]);
  if(path.endsWith('/reserve_paid_ai_request'))return Response.json({allowed:paid});
  if(path.endsWith('/finish_ai_request'))return Response.json({ok:!failFinish});
  assert.fail('unexpected call '+path);
 };
 const extract=async(prompt,env,opts)=>{events.push({model:true});assert.equal(opts.discovery,true);assert.equal(prompt,body.prompt);if(failModel)throw new VideoError('MODEL_FAILED',503);return {options:clarify?[]:[option],question:clarify?'Which country?':'',provider:'Meta'};};
 const request=(payload=body,path='discover',headers={})=>new Request('http://localhost/api/assistant/'+path,{method:'POST',headers:{Authorization:'Bearer fixture.token','Content-Type':'application/json',...headers},body:JSON.stringify(payload)});
 return {events,run:(r=request())=>handleAssistantDiscovery(r,env,{fetcher,extract}),request};
}
test('unsubscribed request cannot invoke Meta or basic free quota',async()=>{const f=fixture({paid:false});assert.equal((await f.run()).status,402);assert.equal(f.events.some(e=>e.model),false);assert.equal(f.events.some(e=>e.path?.endsWith('/reserve_ai_request')),false);});
test('subscribed result reserves paid quota and settles exactly once',async()=>{const f=fixture();const r=await f.run();assert.equal(r.status,200);assert.equal((await r.json()).quotaConsumed,true);assert.equal(f.events.filter(e=>e.model).length,1);assert.deepEqual(f.events.filter(e=>e.path?.endsWith('/finish_ai_request')).map(e=>e.body.p_success),[true]);});
test('clarification returns no options and releases result quota',async()=>{const f=fixture({clarify:true});assert.equal((await (await f.run()).json()).quotaConsumed,false);assert.deepEqual(f.events.filter(e=>e.path?.endsWith('/finish_ai_request')).map(e=>e.body.p_success),[false]);});
test('model failure releases result quota without automatic retry',async()=>{const f=fixture({failModel:true});assert.equal((await f.run()).status,503);assert.equal(f.events.filter(e=>e.model).length,1);assert.equal(f.events.at(-1).body.p_success,false);});
test('missing grants/schema fails as unavailable, never a false subscription paywall',async()=>{const f=fixture({dbError:true});const r=await f.run(f.request({},'access'));assert.equal(r.status,503);assert.equal((await r.json()).code,'SUBSCRIPTION_UNAVAILABLE');assert.equal(f.events.some(e=>e.model),false);});
test('account access is read-only and uses own authenticated account',async()=>{const f=fixture();const r=await f.run(f.request({},'access'));assert.equal((await r.json()).pass.remaining,18);assert.equal(f.events.length,2);assert.match(f.events[1].path,/trip_passes/);});
test('empty prompt, missing consent, invalid preferences never reserve or infer',async()=>{for(const invalid of [{...body,prompt:''},{...body,consent:false},{...body,preferences:{...body.preferences,budget:-1}}]){const f=fixture();assert.equal((await f.run(f.request(invalid))).status,400);assert.equal(f.events.length,1);}});
test('cross-origin request rejected before authentication or model',async()=>{const f=fixture();assert.equal((await f.run(f.request(body,'discover',{Origin:'https://other.invalid'}))).status,403);assert.equal(f.events.length,0);});
test('successful generation without quota settlement is withheld',async()=>{const f=fixture({failFinish:true});assert.equal((await f.run()).status,503);});
test('uncertain quota finalization is attempted once, never automatically retried with a different outcome',async()=>{
 const f=fixture({failFinish:true});const r=await f.run();assert.equal(r.status,503);
 assert.equal((await r.json()).code,'QUOTA_SETTLEMENT_FAILED');
 assert.equal(f.events.filter(e=>e.path?.endsWith('/finish_ai_request')).length,1);
});
test('catalogue validates Meta destination and schedule without invented prices',()=>{const v=normalizeDiscovery({question:'',options:[option]});assert.equal(v.options[0].airport,'HAN');assert.equal(v.options[0].stops[0].price,undefined);for(const bad of [{...option,airport:'ZZZ'},{...option,city:'Paris'},{...option,stops:[{...option.stops[0],day:6}]}])assert.throws(()=>normalizeDiscovery({question:'',options:[bad]}));});
test('Vietnamese city accents do not reject valid Hanoi airport',()=>{assert.equal(normalizeDiscovery({question:'',options:[{...option,city:'Hà Nội'}]}).options[0].airport,'HAN');});
test('fixed duration mismatch fails before consuming a successful result',async()=>{const f=fixture();assert.equal((await f.run(f.request({...body,preferences:{...body.preferences,days:3}}))).status,502);assert.equal(f.events.at(-1).body.p_success,false);});
test('incomplete days or missing overnight accommodation cannot become a paid itinerary',()=>{assert.throws(()=>normalizeDiscovery({question:'',options:[{...option,stops:option.stops.filter(s=>s.day!==3)}]}));assert.throws(()=>normalizeDiscovery({question:'',options:[{...option,stops:option.stops.filter(s=>!(s.day===1&&s.category==='Penginapan'))}]}));});
test('QA preview cannot be enabled outside the isolated local QA route/project',async()=>{const r=await handleAssistantDiscovery(new Request('https://production.invalid/api/assistant/discover',{method:'POST'}),{}, {qaPreview:true,fetcher:()=>assert.fail(),extract:()=>assert.fail()});assert.equal(r.status,503);assert.equal((await r.json()).code,'QA_ISOLATION_REQUIRED');});
test('QA preview authenticates but never calls subscription RPCs',async()=>{
 let models=0;const calls=[];
 const env={SUPABASE_URL:'https://aytrcvfncsklhqozreyk.supabase.co',SUPABASE_PUBLISHABLE_KEY:'public-fixture',SUPABASE_SECRET_KEY:'server-fixture',META_AI_CUTOFF_AT:'2026-11-04T17:00:00Z',META_VIDEO_NONPRODUCTION:'true',AI_LIMITER:{limit:async()=>({success:true})}};
 const request=new Request('http://127.0.0.1/api/meta-qa/discovery-preview',{method:'POST',headers:{Authorization:'Bearer fixture.token','Content-Type':'application/json'},body:JSON.stringify({...body,prompt:'Vietnam Hanoi'})});
 const r=await handleAssistantDiscovery(request,env,{qaPreview:true,fetcher:async(url)=>{calls.push(url);return Response.json({id:'fixture-user'});},extract:async()=>{models++;return {options:[option],question:''};}});
 assert.equal(r.status,200);const data=await r.json();assert.equal(data.qaPreview,true);assert.equal(data.quotaConsumed,false);assert.equal(models,1);assert.equal(calls.length,1);assert.match(calls[0],/auth\/v1\/user$/);
});
