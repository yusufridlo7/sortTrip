import {test,before,after} from 'node:test';
import assert from 'node:assert/strict';
import {createAIProvider,providerConfigured,assistantCapabilities,META_LIMITS,META_TOKEN_ENVELOPE_USD,estimatedMetaTokenUSD} from '../worker/ai-provider.js';
import {validateAssistantMedia,readAssistantBody,MEDIA_LIMITS} from '../worker/assistant-media.mjs';
import {assistantSearchTools} from '../worker/assistant-search-tools.js';
import {handleItinerary} from '../worker/itinerary.js';
import {localAIStats,noteAIPhase} from '../worker/ai-observability.js';
const config=()=>({AI_PROVIDER:'meta',META_ASSISTANT_ENABLED:'true',META_BILLING_CONFIRMED:'true',META_MODEL_API_KEY:'synthetic-fixture',META_ASSISTANT_EXPIRES_AT:'2030-01-01T00:00:00Z'});
const wallClock=Date.now;
before(()=>{Date.now=()=>Date.parse('2026-11-01T00:00:00Z');});
after(()=>{Date.now=wallClock;});
const trip={city:'Kuala Lumpur',country:'Malaysia',start:'2027-01-10',days:3,people:1,budget:4000000};
const request={model:'gpt-6-luna',store:false,max_output_tokens:100,instructions:'Research this trip.',input:JSON.stringify(trip)};
const text={type:'message',role:'assistant',content:[{type:'output_text',text:'Verified fixture result'}]};
const response=(output=[text],usage={input_tokens:100,output_tokens:10})=>Response.json({status:'completed',output,usage});
const tool=(name='search_hotels',args={city:trip.city},id='call-1')=>({type:'function_call',name,arguments:JSON.stringify(args),call_id:id,status:'completed'});
const research={...request,tools:[{type:'web_search'}]};

test('current Standard token envelope is not represented as a global USD100 ledger or invoice',()=>{
 assert.equal(META_TOKEN_ENVELOPE_USD,0.202);
 assert.equal(estimatedMetaTokenUSD(80000,24000),0.202);
 const limits=assistantCapabilities(config()).costControls;
 assert.equal(limits.accountSpendVerified,false);assert.equal(limits.accountUSDHardCapEnforced,false);
 assert.equal(limits.tokenLimits.inputPerCall,24000);assert.equal(limits.tokenLimits.inputTotal,80000);
 assert.equal(limits.tokenLimits.outputTotal,24000);assert.match(limits.excludes,/search-query/);
});

test('queued work preserves first input limit cause and never starts a second paid request',async()=>{
 let counts=0,inferences=0;
 const fetcher=async url=>{if(url.endsWith('/input_tokens')){counts++;return Response.json({input_tokens:24001});}inferences++;assert.fail('over-limit inference');};
 const provider=createAIProvider(config(),{trip,fetcher});
 const results=await Promise.all([provider(request),provider(request)]);
 for(const r of results)assert.equal((await r.json()).error.code,'AI_INPUT_LIMIT');
 assert.equal(counts,1);assert.equal(inferences,0);
});

test('required source grounding cannot be silently skipped or execute an unadvertised function',async()=>{
 let supplierCalls=0;
 const registry={definitions:[{type:'function',name:'search_hotels'}],run:async()=>{supplierCalls++;assert.fail('not exposed in this round');}};
 const mock=mockModel(()=>response([tool('not_exposed')]));
 const result=await createAIProvider(config(),{trip,fetcher:mock.fetcher,toolRegistry:registry})({...research,tool_choice:'required'});
 assert.equal((await result.json()).error.code,'AI_TOOL_REJECTED');assert.equal(supplierCalls,0);
 assert.deepEqual(mock.calls[1].body.tools,[{type:'web_search',search_context_size:'low'},...registry.definitions]);
 assert.equal(mock.calls[1].body.tool_choice,'auto');assert.match(mock.calls[1].body.instructions,/MANDATORY GROUNDING/);
});

test('Meta required grounding fails closed without sources despite auto-only wire compatibility',async()=>{
 const mock=mockModel(()=>response([text]));const provider=createAIProvider(config(),{trip,fetcher:mock.fetcher});
 const result=await provider({...research,tool_choice:'required'});
 assert.equal((await result.json()).error.code,'AI_SOURCES_UNAVAILABLE');assert.equal(mock.calls.length,2);
 assert.equal((await (await provider(request)).json()).error.code,'AI_SOURCES_UNAVAILABLE');assert.equal(mock.calls.length,2);
});

test('search reserves full bounded context before inference and reports the cumulative guard',async()=>{
 const mock=mockModel(()=>response([text],{input_tokens:20000,output_tokens:10}));
 const provider=createAIProvider(config(),{trip,fetcher:mock.fetcher});
 for(let i=0;i<3;i++)assert.equal((await provider(research)).status,200);
 const blocked=await provider(research);assert.equal((await blocked.json()).error.code,'AI_INPUT_TOTAL_LIMIT');
 assert.equal(mock.calls.filter(c=>!c.url.endsWith('/input_tokens')).length,3);
});

test('media preprocessing token expansion is reconciled only within reserved unchanged hard caps',async()=>{
 const model=mockModel(()=>response([text],{input_tokens:3224,output_tokens:388}));
 const p=createAIProvider(config(),{trip,fetcher:model.fetcher});
 assert.equal((await p({...request,max_output_tokens:1200},{media:[mp4(8)]})).status,200);
 const over=mockModel(()=>response([text],{input_tokens:24001,output_tokens:388}));
 const blocked=createAIProvider(config(),{trip,fetcher:over.fetcher});
 assert.equal((await (await blocked({...request,max_output_tokens:1200},{media:[mp4(8)]})).json()).error.code,'AI_INPUT_LIMIT');
 assert.equal((await (await blocked(request)).json()).error.code,'AI_INPUT_LIMIT');assert.equal(over.calls.length,2);
});
function mockModel(fn=()=>response()){
 const calls=[];const fetcher=async(url,options)=>{assert.ok(url.startsWith('https://api.meta.ai/v1/responses'));const b=JSON.parse(options.body);calls.push({url,body:b});return url.endsWith('/input_tokens')?Response.json({input_tokens:100}):fn(b,calls.filter(c=>!c.url.endsWith('/input_tokens')).length);};
 return {calls,fetcher};
}
const jpeg=(side=1)=>({kind:'image',mime:'image/jpeg',data:Buffer.from([255,216,255,192,0,11,8,side>>8,side&255,0,1,1,1,17,0,255,217]).toString('base64')});
function mp4(seconds){const atom=(kind,payload)=>{const b=Buffer.alloc(8+payload.length);b.writeUInt32BE(b.length);b.write(kind,4);payload.copy(b,8);return b;};const head=Buffer.alloc(20);head.writeUInt32BE(1000,12);head.writeUInt32BE(seconds*1000,16);return {kind:'video',mime:'video/mp4',data:Buffer.concat([atom('ftyp',Buffer.concat([Buffer.from('isom'),Buffer.alloc(4),Buffer.from('isom')])),atom('moov',atom('mvhd',head))]).toString('base64')};}

test('media structural validation enforces consent, count, signature, dimensions and MP4 duration',()=>{
 assert.equal(validateAssistantMedia([jpeg(),mp4(60)],true).length,2);
 for(const [items,consent]of [[[jpeg()],false],[[{...jpeg(),mime:'image/gif'}],true],[[{...jpeg(),data:'https://private.test/file'}],true],[[jpeg(1281)],true],[[mp4(61)],true],[[mp4(1),mp4(2)],true]])assert.throws(()=>validateAssistantMedia(items,consent));
 assert.throws(()=>validateAssistantMedia(Array.from({length:4},()=>jpeg()),true));
 const huge={...jpeg(),data:Buffer.alloc(MEDIA_LIMITS.imageBytes+1).toString('base64')};assert.throws(()=>validateAssistantMedia([huge],true),e=>e.status===413);
 const item={...jpeg(),name:'private-filename',duration:0,token:'do-not-forward'};assert.deepEqual(Object.keys(validateAssistantMedia([item],true)[0]),['kind','mime','data']);
});
test('body byte cap applies even when Content-Length is absent',async()=>{
 await assert.rejects(readAssistantBody(new Request('https://app.test',{method:'POST',body:'x'.repeat(101)}),100),e=>e.status===413);
 assert.equal(await readAssistantBody(new Request('https://app.test',{method:'POST',body:'ok'}),100),'ok');
});
test('Meta opt-in fails closed and never falls back to OpenAI',async()=>{
 for(const change of [{META_ASSISTANT_ENABLED:'false'},{META_BILLING_CONFIRMED:'false'},{META_MODEL_API_KEY:''},{AI_PROVIDER:'unknown'}]){
  const env={...config(),...change};assert.equal(providerConfigured(env),false);assert.equal(assistantCapabilities(env).mediaEnabled,false);
  const r=await createAIProvider(env,{fetcher:()=>assert.fail('no egress')})(request);assert.equal(r.status,503);
 }
 assert.equal(providerConfigured({OPENAI_API_KEY:'fixture'}),true);
});
test('OpenAI kill switch blocks readiness and every adapter egress even when its credential exists',async()=>{
 const env={AI_PROVIDER:'openai',OPENAI_DISABLED:'true',OPENAI_API_KEY:'synthetic'};
 assert.equal(providerConfigured(env),false);
 for(const purpose of ['planning','translation']){
  const r=await createAIProvider(env,{purpose,fetcher:()=>assert.fail('OpenAI disabled')})(request);assert.equal(r.status,503);assert.equal((await r.json()).error.code,'AI_PROVIDER_DISABLED');
 }
});
test('Muse uses Standard model, platform context and media only when explicitly supplied',async()=>{
 const {calls,fetcher}=mockModel();const provider=createAIProvider(config(),{trip,fetcher});
 assert.equal((await provider(request,{media:validateAssistantMedia([jpeg(),mp4(2)],true)})).status,200);
 const body=calls[1].body;assert.equal(body.model,'muse-spark-1.3');assert.equal(body.store,false);assert.equal(body.stream,false);assert.equal(body.parallel_tool_calls,false);assert.equal(body.previous_response_id,undefined);assert.match(body.instructions,/SORTTRIP_PLATFORM_CONTEXT/);
 assert.deepEqual(body.input[0].content.map(c=>c.type),['input_text','input_image','input_video']);
 assert.equal((await provider(request)).status,200);assert.equal(typeof calls.at(-1).body.input,'string');
});
test('stateless tool loop preserves evidence and encrypted replay, no booking/SQL tools',async()=>{
 const {calls,fetcher}=mockModel((body,n)=>n===1?response([{type:'reasoning',encrypted_content:'synthetic-opaque'}, {type:'web_search_call',action:{sources:[{url:'https://example.com/reference'}]}},tool()]):response());
 const r=await createAIProvider(config(),{trip,fetcher})(research);assert.equal(r.status,200);
 const first=calls[1].body;assert.deepEqual(first.tools.map(t=>t.name||t.type),['web_search','search_hotels','search_activities']);assert.equal(first.max_tool_calls,2);
 const second=calls[3].body;assert.ok(second.input.some(i=>i.type==='reasoning'&&i.encrypted_content==='synthetic-opaque'));assert.ok(second.input.some(i=>i.type==='function_call_output'&&JSON.parse(i.output).status==='unavailable'));
 assert.match(JSON.stringify((await r.json()).output),/example.com\/reference/);
});
test('unknown tools, cross-city searches, extra arguments and repeats fail without supplier egress',async()=>{
 const registry=assistantSearchTools(trip,config(),{fetcher:()=>assert.fail('supplier egress')});
 for(const [name,args]of [['pay',{city:trip.city}],['search_hotels',{city:'Other city'}],['search_hotels',{city:trip.city,sql:'DROP'}],['search_activities',{city:trip.city,query:'https://localhost/'}]])await assert.rejects(registry.run(name,args));
 const {calls,fetcher}=mockModel((_,n)=>response([tool('search_hotels',{city:trip.city},'call-'+n)]));
 const r=await createAIProvider(config(),{trip,fetcher})(research);assert.equal(r.status,503);assert.equal((await r.json()).error.code,'AI_TOOL_DUPLICATE');assert.equal(calls.length,4);
});
test('token preflight and missing/overrun usage stop generation without retry',async()=>{
 let inferred=0;const tooMany=async url=>{if(!url.endsWith('/input_tokens'))inferred++;return Response.json({input_tokens:META_LIMITS.inputPerCall+1});};
 const r=await createAIProvider(config(),{trip,fetcher:tooMany})(request);assert.equal(r.status,503);assert.equal(inferred,0);
 for(const usage of [null,{input_tokens:100,output_tokens:101},{input_tokens:101,output_tokens:1}]){
  const {calls,fetcher}=mockModel(()=>response([text],usage));const provider=createAIProvider(config(),{trip,fetcher});assert.equal((await provider(request)).status,503);assert.equal((await provider(request)).status,503);assert.equal(calls.length,2);
 }
});
test('search-added input context is reconciled against unchanged hard limits; Meta search result evidence is normalized',async()=>{
 const {fetcher}=mockModel(()=>response([{type:'web_search_call',results:[{url:'https://example.com/museum',title:'Museum'}]},text],{input_tokens:13242,output_tokens:100}));
 const p=createAIProvider(config(),{trip,fetcher});const r=await p({...research,max_output_tokens:3500});assert.equal(r.status,200);assert.match(JSON.stringify(await r.json()),/example.com\/museum/);
 const over=mockModel(()=>response([text],{input_tokens:META_LIMITS.inputPerCall+1,output_tokens:10}));const blocked=createAIProvider(config(),{trip,fetcher:over.fetcher});assert.equal((await blocked(research)).status,503);assert.equal((await blocked(research)).status,503);assert.equal(over.calls.length,2);
});
test('actual search input cannot exceed cumulative budget; route research cannot call supplier functions',async()=>{
 const heavy=mockModel(()=>response([text],{input_tokens:META_LIMITS.inputPerCall,output_tokens:10}));const p=createAIProvider(config(),{trip,fetcher:heavy.fetcher});
 for(let n=0;n<3;n++)assert.equal((await p(research)).status,200);assert.equal((await p(research)).status,503);assert.equal(heavy.calls.length,7); // fourth count allowed, fourth paid inference blocked before search can add context
 const route=mockModel();assert.equal((await createAIProvider(config(),{trip,fetcher:route.fetcher})({...research,input:JSON.stringify({trip,preliminaryResearch:'fixture'})})).status,200);
 assert.deepEqual(route.calls[1].body.tools.map(t=>t.name||t.type),['web_search']);
});
test('numeric diagnostic snapshots are localhost-only and cannot reflect private text',()=>{
 noteAIPhase('private-user-content',999,'private-secret');const s=localAIStats(new Request('http://127.0.0.1:8787/api/ai/capabilities'));
 assert.deepEqual(s.last,{phase:'halt',status:0,code:''});assert.equal(localAIStats(new Request('https://sorttrip.yusufridlo7.workers.dev/api/ai/capabilities')),undefined);
 assert.ok(!JSON.stringify(s).includes('private'));assert.ok(!JSON.stringify(s).includes('fixture'));
});
test('allowed supplier tools preserve full stay, occupancy, tax and starting-price provenance using offline responses',async()=>{
 const calls=[],q={...trip,hotelBudget:{maxNightIDR:500000,exclusive:true}};
 const fetcher=async(url,options)=>{
  calls.push(url);const b=JSON.parse(options.body);
  if(url.startsWith('https://api.liteapi.travel/')){
   assert.equal(b.checkin,trip.start);assert.equal(b.checkout,'2027-01-12');assert.deepEqual(b.occupancies,[{adults:1,children:[]}]);
   return Response.json({data:[{hotelId:'fixture',roomTypes:[{rateType:'standard',rates:[{occupancyNumber:1,adultCount:1,childCount:0,name:'Room',retailRate:{total:[{amount:399980,currency:'IDR'}],suggestedSellingPrice:[{amount:400000,currency:'IDR'}],taxesAndFees:[{included:true}]},cancellationPolicies:{refundableTag:'NRFN'}}]}]}],hotels:[{id:'fixture',name:'Fixture Hotel',city:trip.city,country:'MY',location:{latitude:3.14,longitude:101.71}}]});
  }
  assert.equal(url,'https://api.viator.com/partner/search/freetext');
  if(b.searchTypes[0].searchType==='DESTINATIONS')return Response.json({destinations:{results:[{id:335,name:trip.city}]}});
  assert.equal(b.productFiltering.destination,'335');return Response.json({products:{results:[{productCode:'FIXTURE1',title:'Fixture Activity',pricing:{currency:'IDR',summary:{fromPrice:120000}},productUrl:'https://www.viator.com/tours/Fixture/d335-FIXTURE1'}]}});
 };
 const tools=assistantSearchTools(q,{LITEAPI_ENABLED:'true',LITEAPI_API_KEY:'synthetic',VIATOR_ENVIRONMENT:'production',VIATOR_API_KEY:'synthetic'}, {fetcher});
 const hotel=await tools.run('search_hotels',{city:trip.city});assert.equal(hotel.status,'available');assert.equal(hotel.hotels[0].amountIDR,400000);assert.equal(hotel.hotels[0].taxesIncluded,true);assert.equal(hotel.hotels[0].checkout,'2027-01-12');
 const activity=await tools.run('search_activities',{city:trip.city,query:'Museum'});assert.equal(activity.priceType,'starting_price_per_person');assert.equal(activity.products[0].amountIDR,120000);assert.equal(calls.length,4);
});
test('disabled configuration between token count and inference blocks egress and queued calls',async()=>{
 const env=config();let count=0;const fetcher=async url=>{count++;assert.ok(url.endsWith('/input_tokens'));env.META_ASSISTANT_ENABLED='false';return Response.json({input_tokens:100});};
 const provider=createAIProvider(env,{trip,fetcher});const results=await Promise.all([provider(request),provider(request)]);assert.ok(results.every(r=>r.status===503));assert.equal(count,1);assert.equal((await results[0].json()).error.code,'AI_PROVIDER_UNAVAILABLE');
});
test('Meta remains available after November 5 and ignores obsolete expiration settings',async()=>{
 const saved=Date.now;
 try{
  for(const date of ['2026-11-05T00:00:00+07:00','2030-01-01T00:00:00Z']){
   Date.now=()=>Date.parse(date);
   for(const expiry of [undefined,'invalid','2020-01-01T00:00:00Z']){
    const env={...config(),META_ASSISTANT_EXPIRES_AT:expiry};assert.equal(providerConfigured(env),true);
    const mock=mockModel();const result=await createAIProvider(env,{trip,fetcher:mock.fetcher})(request);
    assert.equal(result.status,200);assert.equal(mock.calls.length,2);
   }
  }
 }finally{Date.now=saved;}
});

test('serial model calls, request count and total output caps are bounded',async()=>{
 let active=0,maxActive=0;const {calls,fetcher}=mockModel(async()=>{maxActive=Math.max(maxActive,++active);await new Promise(resolve=>setTimeout(resolve,5));active--;return response();});
 const provider=createAIProvider(config(),{trip,fetcher});assert.ok((await Promise.all([provider(request),provider(request)])).every(r=>r.ok));assert.equal(maxActive,1);
 for(let n=2;n<META_LIMITS.calls;n++)assert.equal((await provider(request)).status,200);assert.equal((await provider(request)).status,503);assert.equal(calls.length,META_LIMITS.calls*2);
 const limited=mockModel(()=>response([text],{input_tokens:100,output_tokens:8000})),p=createAIProvider(config(),{trip,fetcher:limited.fetcher});for(let n=0;n<3;n++)assert.equal((await p({...request,max_output_tokens:20000})).status,200);assert.equal((await p(request)).status,503);assert.equal(limited.calls.length,6);
});
test('rate-limit response is sanitized, halts pending work and never invokes another provider',async()=>{
 const {calls,fetcher}=mockModel(()=>Response.json({error:{message:'SYNTHETIC_PRIVATE_DETAIL'}},{status:429}));const p=createAIProvider(config(),{trip,fetcher});const r=await p(request);assert.equal(r.status,429);assert.ok(!(await r.text()).includes('SYNTHETIC_PRIVATE_DETAIL'));assert.equal((await p(request)).status,503);assert.equal(calls.length,2);
});
test('authenticated multimodal itinerary uses normal quota and never returns media in saved plan context',async()=>{
 const old=globalThis.fetch;let reserves=0,finishes=[],researchMedia=0;
 const source='https://example.com/reference';const plan={summary:'Fixture plan',activities:[{day:2,time:'10:00',category:'Wisata',title:'A',sourceUrl:source},{day:2,time:'14:00',category:'Wisata',title:'B',sourceUrl:source}]};
 try{globalThis.fetch=async(url,options)=>{
  if(url.endsWith('/auth/v1/user'))return Response.json({id:'fixture'});
  if(url.includes('/reserve_ai_request')){reserves++;return Response.json({allowed:true});}
  if(url.includes('/finish_ai_request')){finishes.push(JSON.parse(options.body).p_success);return Response.json({ok:true});}
  const body=JSON.parse(options.body);if(url.endsWith('/input_tokens'))return Response.json({input_tokens:100});
  assert.equal(url,'https://api.meta.ai/v1/responses');
  if(Array.isArray(body.input)){researchMedia++;assert.equal(body.input[0].content[1].type,'input_image');assert.equal(body.tools,undefined);return response([text]);}
  if(body.tools){assert.equal(typeof body.input,'string');assert.equal(JSON.parse(body.input).unverifiedMediaEvidence,'Verified fixture result');return response([{type:'web_search_call',action:{sources:[{url:source}]}},text]);}
  assert.equal(JSON.parse(body.input).trip.media,undefined);return response([{...text,content:[{type:'output_text',text:JSON.stringify(plan)}]}]);
 };
 const env={...config(),SUPABASE_URL:'https://db.test',SUPABASE_PUBLISHABLE_KEY:'fixture',SUPABASE_SERVICE_ROLE_KEY:'fixture',AI_LIMITER:{limit:async()=>({success:true})}};
 const make=auth=>new Request('https://sorttrip.test/api/itinerary',{method:'POST',headers:auth?{Authorization:'Bearer fixture'}:{},body:JSON.stringify({...trip,media:[jpeg()],mediaConsent:true})});
 assert.equal((await handleItinerary(make(false),env)).status,401);assert.equal(reserves,0);
 for(const bad of [{mediaConsent:false,media:[jpeg()]},{mediaConsent:true,media:[{...jpeg(),mime:'image/gif'}]},{mediaConsent:true,media:[mp4(61)]}]){
  const invalid=await handleItinerary(new Request('https://sorttrip.test/api/itinerary',{method:'POST',headers:{Authorization:'Bearer fixture'},body:JSON.stringify({...trip,language:'en',...bad})}),env);
  assert.equal(invalid.status,400);assert.match((await invalid.json()).error,/Invalid input/);assert.equal(reserves,0);
 }
 const r=await handleItinerary(make(true),env);assert.equal(r.status,200);const result=await r.json();assert.equal(result.plan.context.media,undefined);assert.equal(result.plan.context.mediaConsent,undefined);assert.equal(researchMedia,1);assert.equal(reserves,1);assert.deepEqual(finishes,[true]);
 }finally{globalThis.fetch=old;}
});
test('normal itinerary exposes only fixed Meta failure code and releases failed quota without a model retry',async()=>{
 const old=globalThis.fetch;let models=0,counts=0;const finishes=[];
 try{globalThis.fetch=async(url,options)=>{
  if(url.endsWith('/auth/v1/user'))return Response.json({id:'fixture'});
  if(url.includes('/reserve_ai_request'))return Response.json({allowed:true});
  if(url.includes('/finish_ai_request')){finishes.push(JSON.parse(options.body).p_success);return Response.json({ok:true});}
  if(url.endsWith('/input_tokens')){counts++;return Response.json({error:{message:'PRIVATE_PROVIDER_DETAIL'}},{status:400});}
  models++;assert.fail('no inference after failed preflight');
 };
 const env={...config(),SUPABASE_URL:'https://db.test',SUPABASE_PUBLISHABLE_KEY:'fixture',SUPABASE_SERVICE_ROLE_KEY:'fixture',AI_LIMITER:{limit:async()=>({success:true})}};
 const r=await handleItinerary(new Request('https://sorttrip.test/api/itinerary',{method:'POST',headers:{Authorization:'Bearer fixture'},body:JSON.stringify(trip)}),env);
 assert.equal(r.status,503);const b=await r.json();assert.equal(b.code,'AI_TOKEN_COUNT_UNAVAILABLE');assert.match(b.error,/AI_TOKEN_COUNT_UNAVAILABLE/);assert.ok(!JSON.stringify(b).includes('PRIVATE_PROVIDER_DETAIL'));assert.equal(counts,1);assert.equal(models,0);assert.deepEqual(finishes,[false]);
 }finally{globalThis.fetch=old;}
});
