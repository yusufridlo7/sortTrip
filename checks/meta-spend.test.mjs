import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createAIProvider} from '../worker/ai-provider.js';
import {metaSpendGuard,metaSpendUsage,metaSearchQueries} from '../worker/meta-spend.js';
const actor='11111111-1111-4111-8111-111111111111';
const env=()=>({AI_PROVIDER:'meta',META_ASSISTANT_ENABLED:'true',META_BILLING_CONFIRMED:'true',META_MODEL_API_KEY:'synthetic',SUPABASE_URL:'https://tznxfgosmjcmwoszvkdk.supabase.co',SUPABASE_SERVICE_ROLE_KEY:'synthetic'});
const request={input:'Synthetic public test',instructions:'Only this test.',max_output_tokens:100};
const answer={status:'completed',usage:{input_tokens:100,output_tokens:10},output:[{type:'message',content:[{type:'output_text',text:'Synthetic answer'}]}]};
function fixture(options={}){
 let allocated=0,pending=null,blocked=false,calls=0;const events=[];
 const fetcher=async(url,init)=>{
  const body=JSON.parse(init.body),name=url.split('/').at(-1);events.push(name);
  if(name==='meta_ai_safety_status')return Response.json({version:options.version??3,globalExclusive:true,reservedUSD:.1,maxLimitUSD:100,allocatedUSD:options.exhausted?100:allocated,totalLimitUSD:100,blocked,pending:!!pending});
  if(name==='reserve_meta_ai_request'){
   if(pending)return Response.json({allowed:false,reason:'busy'});
   if(blocked||options.exhausted)return Response.json({allowed:false,reason:'exhausted'});
   assert.equal(body.p_user,actor);pending=body.p_request;allocated+=.1;
   return Response.json({allowed:true,id:pending,reservedUSD:.1,globalExclusive:true,totalLimitUSD:100});
  }
  if(name==='settle_meta_ai_request'){
   assert.equal(body.p_request,pending);
   if(options.settleThrows)throw Error('synthetic network loss');
   if(options.settleFalse)return Response.json({ok:false});
   blocked=body.p_estimated_usd===null;pending=blocked?pending:null;
   return Response.json({ok:!blocked});
  }
  if(url.endsWith('/input_tokens'))return Response.json({input_tokens:100});
  assert.equal(url,'https://api.meta.ai/v1/responses');assert.ok(pending);calls++;
  if(options.hold)await options.hold;
  return options.httpError?Response.json({error:{message:'PRIVATE_PROVIDER_TEXT'}},{status:429}):Response.json(options.result||answer);
 };
 return {fetcher,events,state:()=>({allocated,pending,blocked,calls})};
}
test('production always requires shared guard even when flag is absent or false',()=>{
 for(const flag of [undefined,'false','true'])for(const suffix of ['', '/', '/invalid'])assert.ok(metaSpendGuard({...env(),SUPABASE_URL:env().SUPABASE_URL+suffix,META_SPEND_GUARD_ENABLED:flag},{actorId:actor}));
});
test('query accounting distinguishes query lists, one query, no search and unknown search charges',()=>{
 assert.equal(metaSearchQueries(answer),0);
 assert.equal(metaSearchQueries({...answer,output:[{type:'web_search_call',action:{queries:['a','b']}}]}),2);
 assert.equal(metaSearchQueries({...answer,output:[{type:'web_search_call',action:{query:'a'}}]}),1);
 assert.equal(metaSearchQueries({...answer,output:[{type:'web_search_call',action:{type:'search',queries:['a','b','c']}},{type:'web_search_call',action:{type:'open_page'}}]}),3);
 assert.equal(metaSearchQueries({...answer,output:[{type:'web_search_call',action:{type:'find_in_page'}}]}),0);
 assert.equal(metaSearchQueries({...answer,usage:{...answer.usage,web_search_queries:5},output:[{type:'web_search_call'}]}),null); // undocumented usage field cannot replace required action metadata
 assert.equal(metaSearchQueries({...answer,output:null}),null);
 const unknown={...answer,output:[{type:'web_search_call',results:[]}]};assert.equal(metaSpendUsage(unknown).estimatedUSD,null);
 assert.equal(metaSpendUsage(unknown).input,100);
 assert.equal(metaSpendUsage({...answer,usage:null}),null);
 assert.deepEqual(metaSpendUsage({...answer,usage:{output_tokens:10}}),{input:null,output:10,estimatedUSD:null});
 assert.equal(metaSpendUsage(answer).estimatedUSD,.000168); // round upward, never under-reserve fractional microUSD
});
for(const purpose of ['planning','guide','translation'])test(purpose+' reserves and settles every inference through the same RPCs',async()=>{
 const f=fixture(),p=createAIProvider(env(),{actorId:actor,fetcher:f.fetcher,purpose});
 assert.equal((await p(request)).status,200);assert.equal((await p(request)).status,200);
 assert.equal(f.state().calls,2);assert.equal(f.state().allocated,.2);assert.equal(f.state().pending,null);
 assert.equal(f.events.filter(x=>x==='settle_meta_ai_request').length,2);
 assert.ok(f.events.indexOf('reserve_meta_ai_request')<f.events.indexOf('responses'));
});
test('old RPC version, exhausted budget and missing owner identity block paid egress',async()=>{
 for(const options of [{version:2},{exhausted:true},{}]){
  const f=fixture(options);const p=createAIProvider(env(),{actorId:Object.keys(options).length?actor:undefined,fetcher:f.fetcher});
  assert.equal((await p(request)).status,503);assert.equal(f.state().calls,0);assert.ok(!f.events.includes('input_tokens'));
 }
});
test('separate provider instances share one pending slot; no concurrent paid inference',async()=>{
 let release;const hold=new Promise(r=>{release=r;}),f=fixture({hold});
 const first=createAIProvider(env(),{actorId:actor,fetcher:f.fetcher})(request);
 while(!f.state().calls)await new Promise(r=>setTimeout(r,1));
 const other=await createAIProvider(env(),{actorId:actor,fetcher:f.fetcher})(request);
 assert.equal((await other.json()).error.code,'AI_BUDGET_BUSY');assert.equal(f.state().calls,1);
 release();assert.equal((await first).status,200);assert.equal(f.state().allocated,.1);
});
test('unknown search charges retain allocation, block ledger and stop queued inference',async()=>{
 const f=fixture({result:{...answer,output:[{type:'web_search_call'}]}}),p=createAIProvider(env(),{actorId:actor,fetcher:f.fetcher});
 const a=await p(request);assert.equal((await a.json()).error.code,'AI_COST_UNVERIFIED');
 assert.equal((await p(request)).status,503);assert.equal(f.state().calls,1);assert.equal(f.state().allocated,.1);assert.equal(f.state().blocked,true);
});
test('settlement false or network loss never reports success or starts queued Meta',async()=>{
 for(const options of [{settleThrows:true},{settleFalse:true},{httpError:true}]){
  const f=fixture(options),p=createAIProvider(env(),{actorId:actor,fetcher:f.fetcher});
  const responses=await Promise.all([p(request),p(request)]);
  assert.ok(responses.every(r=>!r.ok));assert.equal(f.state().calls,1);assert.equal(f.state().allocated,.1);
  for(const r of responses)assert.ok(!(await r.text()).includes('PRIVATE_PROVIDER_TEXT'));
 }
});
test('QA cannot use the production USD100 RPC client',async()=>{
 const p=createAIProvider({...env(),META_SPEND_GUARD_ENABLED:'true',SUPABASE_URL:'https://aytrcvfncsklhqozreyk.supabase.co'},{actorId:actor,fetcher:async()=>assert.fail('no network on QA binding')});
 assert.equal((await (await p(request)).json()).error.code,'AI_BUDGET_UNAVAILABLE');
});
