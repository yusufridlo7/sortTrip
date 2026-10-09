import {test} from 'node:test';
import assert from 'node:assert/strict';
import {validateInput,validatePlan,handleItinerary} from '../worker/itinerary.js';
import worker from '../worker/index.js';
import {assistantModel,researchRequest,draftRequest,collectSources} from '../worker/ai-draft.js';
test('invalid draft is corrected once in same quota reservation; failure returns safe rule code',async()=>{
 const old=globalThis.fetch;
 try{for(const recover of [true,false]){
  let drafts=0,reserves=0;const finishes=[];
  const output=plan=>Response.json({status:'completed',output:[{type:'message',content:[{type:'output_text',text:JSON.stringify(plan)}]}]});
  globalThis.fetch=async(url,opts)=>{
   if(String(url).endsWith('/auth/v1/user'))return Response.json({id:'fixture-user'});
   if(String(url).includes('reserve_ai_request')){reserves++;return Response.json({allowed:true});}
   if(String(url).includes('finish_ai_request')){finishes.push(JSON.parse(opts.body).p_success);return Response.json({ok:true});}
   const body=JSON.parse(opts.body);
   if(body.tools)return Response.json({status:'completed',output:[{action:{sources}}]});
   drafts++;const input=JSON.parse(body.input);assert.equal(input.scheduleBounds.earliestMinute,960);
   if(drafts===2)assert.equal(input.validationFeedback,'BEFORE_ARRIVAL');
   return output(drafts===2&&recover?plan:{...plan,activities:[{...plan.activities[0],day:1,time:'15:00'},plan.activities[1]]});
  };
  const r=await handleItinerary(new Request('https://sorttrip.test/api/itinerary',{method:'POST',headers:{Authorization:'Bearer fixture'},body:JSON.stringify(q)}),{OPENAI_API_KEY:'fixture',SUPABASE_URL:'https://db.test',SUPABASE_SERVICE_ROLE_KEY:'fixture',SUPABASE_PUBLISHABLE_KEY:'fixture',AI_LIMITER:{limit:async()=>({success:true})}});
  assert.equal(r.status,recover?200:502);assert.equal(drafts,2);assert.equal(reserves,1);assert.deepEqual(finishes,[recover]);
  if(!recover){const b=await r.json();assert.equal(b.validation,'BEFORE_ARRIVAL');assert.equal(b.code,'AI_DRAFT_INVALID');assert.equal(b.plan,undefined);}
 }}finally{globalThis.fetch=old;}
});
const q=validateInput({city:'Tokyo',start:'2027-01-10',days:3,people:1,budget:5000000,arrival:'14:00',arrivalDay:0,returnAt:'2027-01-12T18:00:00+09:00'});
const sources=[{url:'https://example.com/place',title:'Place'}];
const plan={summary:'Rancangan',activities:[{day:2,time:'10:00',category:'Wisata',title:'A',sourceUrl:sources[0].url},{day:2,time:'14:00',category:'Wisata',title:'B',sourceUrl:sources[0].url}]};
test('transport preference performs focused route research before final draft with one successful quota use',async()=>{
 const old=globalThis.fetch;let researchCalls=0;const finishes=[];
 const transfer={day:2,time:'12:00',category:'Transfer',title:'A → B',fromPlace:'A',toPlace:'B',mode:'Bus',sourceUrl:sources[0].url,routeOptions:[{kind:'hemat',summary:'Public route; verify schedule',legs:[{fromPlace:'A',toPlace:'B',mode:'Bus',note:'Verify operator',sourceUrl:sources[0].url}]}]};
 globalThis.fetch=async(url,opts)=>{
  if(String(url).endsWith('/auth/v1/user'))return Response.json({id:'fixture'});
  if(String(url).includes('reserve_ai_request'))return Response.json({allowed:true});
  if(String(url).includes('finish_ai_request')){finishes.push(JSON.parse(opts.body).p_success);return Response.json({ok:true});}
  const body=JSON.parse(opts.body);if(body.tools){researchCalls++;if(researchCalls===2)assert.match(body.instructions,/dedicated route feasibility investigation/);return Response.json({status:'completed',output:[{action:{sources}},{content:[{type:'output_text',text:'Fixture operator route'}]}]});}
  assert.equal(researchCalls,2);assert.match(JSON.parse(body.input).research,/TRANSPORT RESEARCH/);return Response.json({status:'completed',output:[{content:[{type:'output_text',text:JSON.stringify({...plan,activities:[...plan.activities,transfer]})}]}]});
 };
 try{const r=await handleItinerary(new Request('https://sorttrip.test/api/itinerary',{method:'POST',headers:{Authorization:'Bearer fixture'},body:JSON.stringify({...q,transportPreference:'hemat'})}),{OPENAI_API_KEY:'fixture',SUPABASE_URL:'https://db.test',SUPABASE_PUBLISHABLE_KEY:'fixture',SUPABASE_SERVICE_ROLE_KEY:'fixture',AI_LIMITER:{limit:async()=>({success:true})}});assert.equal(r.status,200);assert.deepEqual(finishes,[true]);assert.equal((await r.json()).plan.activities.find(a=>a.category==='Transfer').routeOptions[0].legs[0].mode,'Bus');}finally{globalThis.fetch=old;}
});
test('structured transport preference requires researched connected alternatives and selects requested mode',()=>{
 const transfer={day:2,time:'12:00',category:'Transfer',title:'A to B',sourceUrl:sources[0].url,fromPlace:'A',toPlace:'B',mode:'Bus',routeOptions:[{kind:'hemat',summary:'Two-stage public route; fare unverified',legs:[{fromPlace:'A',toPlace:'Terminal',mode:'MRT',note:'Check service',sourceUrl:sources[0].url},{fromPlace:'Terminal',toPlace:'B',mode:'Coach',note:'Check connection',sourceUrl:sources[0].url}]}]};
 const result=validatePlan({...plan,activities:[...plan.activities,transfer]},{...q,transportPreference:'hemat'},sources);assert.equal(result.activities.find(a=>a.category==='Transfer').mode,'MRT + Coach');
 assert.throws(()=>validatePlan({...plan,activities:[...plan.activities,{...transfer,routeOptions:null}]},{...q,transportPreference:'hemat'},sources));
});
test('route requests validate day bounds and whitelist planning data only',()=>{
 const result=validateInput({...q,routeRequests:[{day:2,from:'Singapore',to:'Melaka',mode:'bus',protected:true,untrusted:'discard'},{day:99,from:'A',to:'B'}]});
 assert.deepEqual(result.routeRequests,[{day:2,from:'Singapore',to:'Melaka',mode:'bus',protected:true}]);assert.equal(result.routeRequests[0].untrusted,undefined);
});

test('Luna default and strict grounded drafting preserve travel constraints without inventing references',()=>{
 assert.equal(assistantModel({}),'gpt-6-luna');assert.equal(assistantModel({OPENAI_MODEL:'gpt-5-mini'}),'gpt-6-luna');assert.equal(assistantModel({OPENAI_MODEL:'gpt-6-sol'}),'gpt-6-sol');
 assert.equal(researchRequest(q,{}).reasoning.effort,'low');
 const draft=draftRequest(q,{},'Research',sources);assert.equal(draft.tools,undefined);assert.equal(draft.text.format.strict,true);assert.deepEqual(draft.text.format.schema.properties.activities.items.properties.sourceUrl.enum,[sources[0].url]);assert.equal(JSON.parse(draft.input).trip.returnAt,q.returnAt);
});
test('collects only safe HTTPS provider references and deduplicates canonical URLs',()=>{
 const result=collectSources({output:[{action:{sources:[{url:'https://example.com'},{url:'https://example.com/'},{url:'javascript:alert(1)'},{url:'https://example.com/?token=fixture'},{url:'https://user:fixture@example.com'}]}}]});assert.deepEqual(result,[{url:'https://example.com/',title:'example.com'}]);
});

test('AI health includes quota server configuration without exposing values',async()=>{
 const env={OPENAI_API_KEY:'fixture-openai',SUPABASE_URL:'https://fixture.supabase.co',SUPABASE_PUBLISHABLE_KEY:'fixture-public',SUPABASE_SERVICE_ROLE_KEY:'fixture-service',AI_LIMITER:{}};
 for(const missing of [null,...Object.keys(env)]){
  const current={...env};if(missing)delete current[missing];
  const response=await worker.fetch(new Request('https://sorttrip.test/api/health'),current,{});
  const body=await response.json();assert.equal(body.aiConfigured,missing===null);
  assert.ok(!JSON.stringify(body).includes('fixture-'));
 }
});
test('preserves cited activities but never model prices or booking URLs',()=>{const p=validatePlan({...plan,activities:plan.activities.map(a=>({...a,price:123,bookingUrl:'https://fake.com'}))},q,sources);assert.equal(p.activities.length,2);assert.equal(p.activities[0].price,undefined);assert.equal(p.activities[0].bookingUrl,undefined);});
test('rejects ungrounded source and unsafe URL',()=>{assert.throws(()=>validatePlan({...plan,activities:[{...plan.activities[0],sourceUrl:'javascript:alert(1)'}]},q,sources));});
test('rejects activities before arrival and too close to departure',()=>{for(const a of [{day:1,time:'15:00'},{day:3,time:'15:00'}])assert.throws(()=>validatePlan({...plan,activities:[{...plan.activities[0],...a},plan.activities[1]]},q,sources));});
test('rejects conflicting locked bookings',()=>{assert.throws(()=>validatePlan(plan,{...q,locked:[{day:2,time:'10:30',title:'Paid'}]},sources));});
test('rejects oversized trip and invalid day',()=>{assert.throws(()=>validateInput({...q,days:Infinity}));assert.throws(()=>validatePlan({...plan,activities:[{...plan.activities[0],day:4}]},q,sources));});
test('unconfigured server is explicit and old trip is not mutated',async()=>{assert.equal((await handleItinerary(new Request('https://sorttrip.test/api/itinerary',{method:'POST'}),{})).status,503);});
test('configured server requires auth before upstream spend',async()=>{assert.equal((await handleItinerary(new Request('https://sorttrip.test/api/itinerary',{method:'POST'}),{OPENAI_API_KEY:'test',SUPABASE_SERVICE_ROLE_KEY:'synthetic-service',SUPABASE_URL:'https://test.supabase.co',SUPABASE_PUBLISHABLE_KEY:'test',AI_LIMITER:{}})).status,401);});
test('cross-origin calls rejected',async()=>{assert.equal((await handleItinerary(new Request('https://sorttrip.test/api/itinerary',{method:'POST',headers:{Origin:'https://other.test'}}),{})).status,403);});
test('authenticated workflow uses web search, returns draft, sanitizes secrets',async()=>{
 const original=globalThis.fetch;let count=0;
 globalThis.fetch=async(url,opts)=>{count++;if(String(url).includes('finish_ai_request'))return Response.json({ok:true});if(String(url).endsWith('/auth/v1/user'))return Response.json({id:'user-1'});if(String(url).includes('reserve_ai_request'))return Response.json({allowed:true,remaining:1});const body=JSON.parse(opts.body);assert.equal(body.store,false);if(body.tools)assert.equal(body.tools[0].type,'web_search');else assert.equal(body.text.format.strict,true);return Response.json({status:'completed',output:[{type:'web_search_call',action:{sources}},{type:'message',content:[{type:'output_text',text:JSON.stringify(plan)}]}]});};
 try{const r=await handleItinerary(new Request('https://sorttrip.test/api/itinerary',{method:'POST',headers:{Authorization:'Bearer test-token'},body:JSON.stringify(q)}),{OPENAI_API_KEY:'never-show-secret',SUPABASE_SERVICE_ROLE_KEY:'synthetic-service',SUPABASE_URL:'https://test.supabase.co',SUPABASE_PUBLISHABLE_KEY:'public-key',AI_LIMITER:{limit:async()=>({success:true})}});assert.equal(r.status,200);const body=await r.text();assert.ok(!body.includes('never-show-secret'));assert.equal(JSON.parse(body).plan.activities.length,2);assert.equal(count,5);}finally{globalThis.fetch=original;}
});
test('exhausted Basic is rejected before any AI spend',async()=>{
 const original=globalThis.fetch;let paidCalls=0;
 globalThis.fetch=async url=>{if(String(url).endsWith('/auth/v1/user'))return Response.json({id:'user'});if(String(url).includes('reserve_ai_request'))return Response.json({allowed:false,remaining:0});paidCalls++;throw Error('must not call');};
 try{const r=await handleItinerary(new Request('https://sorttrip.test/api/itinerary',{method:'POST',headers:{Authorization:'Bearer test'},body:JSON.stringify(q)}),{OPENAI_API_KEY:'test',SUPABASE_SERVICE_ROLE_KEY:'synthetic-service',SUPABASE_URL:'https://test.supabase.co',SUPABASE_PUBLISHABLE_KEY:'test',AI_LIMITER:{limit:async()=>({success:true})}});assert.equal(r.status,402);assert.equal(paidCalls,0);}finally{globalThis.fetch=original;}
});

test('provider failures expose only safe quota/rate/unavailable classifications',async()=>{
 const original=globalThis.fetch;
 try{
  for(const [status,code,expected,http] of [...['insufficient_quota','credit_balance_exhausted','organization_spend_limit_exceeded','project_spend_limit_exceeded','organization_usage_limit_exceeded'].map(code=>[429,code,'AI_PROVIDER_QUOTA',503]),[429,'rate_limit_exceeded','AI_PROVIDER_RATE_LIMIT',503],[401,'invalid_api_key','AI_PROVIDER_UNAVAILABLE',502]]){
   globalThis.fetch=async url=>String(url).includes('finish_ai_request')?Response.json({ok:true}):String(url).endsWith('/auth/v1/user')?Response.json({id:'test-user'}):String(url).includes('reserve_ai_request')?Response.json({allowed:true}):Response.json({error:{code,message:'SYNTHETIC_PRIVATE_PROVIDER_DETAIL'}},{status});
   const r=await handleItinerary(new Request('https://sorttrip.test/api/itinerary',{method:'POST',headers:{Authorization:'Bearer synthetic'},body:JSON.stringify(q)}),{OPENAI_API_KEY:'synthetic-only',SUPABASE_SERVICE_ROLE_KEY:'synthetic-service',SUPABASE_URL:'https://test.supabase.co',SUPABASE_PUBLISHABLE_KEY:'synthetic',AI_LIMITER:{limit:async()=>({success:true})}});
   assert.equal(r.status,http);const body=await r.text();assert.equal(JSON.parse(body).code,expected);assert.ok(!body.includes('SYNTHETIC_PRIVATE_PROVIDER_DETAIL'));assert.ok(!body.includes('synthetic-only'));
  }
 }finally{globalThis.fetch=original;}
});

test('failed generation releases reservation without counting a successful use',async()=>{
 const original=globalThis.fetch;const finishes=[];
 globalThis.fetch=async(url,opts)=>{
  if(String(url).endsWith('/auth/v1/user'))return Response.json({id:'user'});
  if(String(url).includes('reserve_ai_request'))return Response.json({allowed:true});
  if(String(url).includes('finish_ai_request')){finishes.push(JSON.parse(opts.body));return Response.json({ok:true});}
  return Response.json({error:{}},{status:503});
 };
 try{const r=await handleItinerary(new Request('https://sorttrip.test/api/itinerary',{method:'POST',headers:{Authorization:'Bearer test'},body:JSON.stringify(q)}),{OPENAI_API_KEY:'fixture',SUPABASE_SERVICE_ROLE_KEY:'fixture',SUPABASE_URL:'https://test.supabase.co',SUPABASE_PUBLISHABLE_KEY:'fixture',AI_LIMITER:{limit:async()=>({success:true})}});assert.equal(r.status,502);assert.equal(finishes.length,1);assert.equal(finishes[0].p_success,false);}finally{globalThis.fetch=original;}
});
test('AI accepts one day and longer journeys without a fourteen-day cap',()=>{assert.equal(validateInput({...q,days:1}).days,1);assert.equal(validateInput({...q,days:45}).days,45);assert.throws(()=>validateInput({...q,days:-1}));});
test('validates sourced hotel nights and complete transport endpoints; never returns inventory prices',()=>{
 const full={...plan,activities:[...plan.activities,{day:2,time:'16:00',category:'Penginapan',title:'Sourced property',note:'Near visits',sourceUrl:sources[0].url,city:'Tokyo',location:'Property',price:123},{day:2,time:'12:00',category:'Transfer',title:'A → B',note:'Check service',sourceUrl:sources[0].url,fromPlace:'A',toPlace:'B',mode:'Train'}]};
 const valid=validatePlan(full,q,sources);assert.equal(valid.activities.find(x=>x.category==='Penginapan').price,undefined);assert.equal(valid.activities.find(x=>x.category==='Transfer').fromPlace,'A');
 assert.throws(()=>validatePlan({...full,activities:full.activities.map(x=>x.category==='Penginapan'?{...x,day:3}:x)},q,sources));
 assert.throws(()=>validatePlan({...full,activities:full.activities.map(x=>x.category==='Transfer'?{...x,toPlace:null}:x)},q,sources));
});
