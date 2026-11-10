import {withPlatformContext} from './platform-context.js';
import {mediaInput,MEDIA_LIMITS} from './assistant-media.mjs';
import {assistantSearchTools} from './assistant-search-tools.js';
import {collectSources} from './ai-draft.js';
import {noteAIEgress,noteAIPhase,noteAIUsage,noteAIResponse} from './ai-observability.js';
import {metaDraftWire} from './meta-wire.js';
import {metaSpendGuard,META_SPEND_CODES,productionSpendRequired} from './meta-spend.js';
export const META_LIMITS=Object.freeze({calls:8,outputPerCall:8000,outputTotal:24000,inputPerCall:24000,inputTotal:80000,tools:2,webSearches:4,rounds:3,responseBytes:1500000});
// Public Standard token tariff verified 2026-11-03. Not an invoice or account-wide ledger.
export const META_TOKEN_PRICING=Object.freeze({inputPerMillionUSD:1.25,outputPerMillionUSD:4.25});
export const estimatedMetaTokenUSD=(input,output)=>(input*1.25+output*4.25)/1000000;
export const META_TOKEN_ENVELOPE_USD=estimatedMetaTokenUSD(META_LIMITS.inputTotal,META_LIMITS.outputTotal);
export const META_FAILURE_CODES=Object.freeze([...META_SPEND_CODES,'AI_PROVIDER_HALTED','AI_PROVIDER_LIMIT','AI_INPUT_LIMIT','AI_INPUT_TOTAL_LIMIT','AI_OUTPUT_LIMIT','AI_CALL_LIMIT','AI_TOOL_LIMIT','AI_TOOL_REJECTED','AI_TOOL_DUPLICATE','AI_TOKEN_COUNT_UNAVAILABLE','AI_TOOL_CHOICE_UNSUPPORTED','AI_SOURCES_UNAVAILABLE','AI_USAGE_UNVERIFIED','AI_PROVIDER_INCOMPLETE','AI_REASONING_UNVERIFIED','AI_CANCELLED','AI_PROVIDER_RATE_LIMIT']);
// Owner decision 2026-11-02: no calendar expiration; explicit enable/billing and usage guards remain.
export const providerName=env=>env.AI_PROVIDER===undefined||env.AI_PROVIDER==='openai'?'openai':env.AI_PROVIDER==='meta'?'meta':'invalid';
export function providerConfigured(env){
 return providerName(env)==='openai'?env.OPENAI_DISABLED!=='true'&&!!env.OPENAI_API_KEY:providerName(env)==='meta'&&env.META_ASSISTANT_ENABLED==='true'&&!!env.META_MODEL_API_KEY&&env.META_BILLING_CONFIRMED==='true';
}
export function assistantCapabilities(env){return {provider:providerName(env),configured:providerConfigured(env),mediaEnabled:providerName(env)==='meta'&&providerConfigured(env),openaiDisabled:env.OPENAI_DISABLED==='true',limits:MEDIA_LIMITS,connectionTested:false,costControls:{scope:'provider_instance',globalLedgerRequired:productionSpendRequired(env)||env.META_SPEND_GUARD_ENABLED==='true',reservationUSD:0.10,globalLedgerVerified:false,tokenLimits:META_LIMITS,standardTokenEnvelopeUSD:META_TOKEN_ENVELOPE_USD,excludes:'search-query charges, suppliers, other requests and unknown provider usage',accountSpendVerified:false,accountUSDHardCapEnforced:false}};}
const failure=(code,status=503)=>Response.json({error:{code}}, {status});
async function boundedJSON(response){
 const reader=response.body?.getReader();if(!reader)throw Error('AI_PROVIDER_RESPONSE');const decoder=new TextDecoder();let text='',size=0;
 try{while(true){const {done,value}=await reader.read();if(done)break;size+=value.byteLength;if(size>META_LIMITS.responseBytes){await reader.cancel();throw Error('AI_PROVIDER_RESPONSE');}text+=decoder.decode(value,{stream:true});}text+=decoder.decode();return JSON.parse(text);}finally{reader.releaseLock();}
}
export function createAIProvider(env,{signal,trip={},fetcher=fetch,purpose='planning',toolRegistry,actorId,maxCalls=META_LIMITS.calls,maxWebSearches=META_LIMITS.webSearches,timeoutMs=150000}={}){
 const callLimit=Math.max(1,Math.min(META_LIMITS.calls,Number.isInteger(maxCalls)?maxCalls:1)),webLimit=Math.max(1,Math.min(META_LIMITS.webSearches,Number.isInteger(maxWebSearches)?maxWebSearches:1));
 if(providerName(env)==='meta')signal=AbortSignal.any([...(signal?[signal]:[]),AbortSignal.timeout(Math.max(1000,Math.min(150000,timeoutMs)))]);
 let calls=0,outputUsed=0,inputUsed=0,toolsUsed=0,webUsed=0,halted=false,haltCode='',queue=Promise.resolve();const seen=new Set(),callIds=new Set();
 const registry=toolRegistry||assistantSearchTools(trip,env,{signal,fetcher});
 const spend=metaSpendGuard(env,{fetcher,actorId});
 const check=()=>{if(halted)throw Error(haltCode||'AI_PROVIDER_HALTED');if(signal?.aborted)throw Error('AI_CANCELLED');if(!providerConfigured(env))throw Error('AI_PROVIDER_NOT_READY');};
 async function meta(body,media){
  check();let input=media.length?mediaInput(body.input,media):body.input;
  const search=['planning','guide'].includes(purpose)&&Array.isArray(body.tools)&&body.tools.some(t=>t.type==='web_search');
  let suppliers=purpose==='guide'&&!!toolRegistry&&search;try{if(purpose!=='guide')suppliers=search&&JSON.parse(body.input)?.city===trip.city&&!!trip.city;}catch{}
  const contextOptions={purpose,mediaAttached:media.length>0,searchTools:suppliers};
  let request={...withPlatformContext(body,env,purpose,contextOptions),model:'muse-spark-1.3',store:false,stream:false,parallel_tool_calls:false,include:[...new Set([...(body.include||[]),'reasoning.encrypted_content'])],input};
  if(search)request={...request,tools:[{type:'web_search',search_context_size:'low'},...(suppliers?registry.definitions:[])],tool_choice:'auto',include:[...request.include.filter(v=>v!=='web_search_call.action.sources'),'web_search_call.results'],instructions:request.instructions+'\nKeep research concise: at most 650 words of evidence notes, focus only requested stops and practical connectors. Cite sources. Use supplier function tools only when necessary; normal application enrichment handles hotel inventory. Finish a concise sourced answer after search rather than expanding the task.'};
  if(body.text?.format?.name==='sorttrip_itinerary')request={...request,instructions:request.instructions+'\nProduce compact JSON within the output budget: concise summary, activity notes at most 180 characters, one best researched route option per transfer. Keep all required airport/stay/visit/return connections and all necessary walking/terminal legs; never omit a required connector to meet an arbitrary short-trip record target. Use up to the schema limit of 70 activities, prioritizing required connections over optional extra sightseeing. Do not fabricate alternatives. If a connector is unverified say so briefly. No verbose repeated notes. When rejectedDraft and missingConnections are supplied, repair that draft using the exact listed endpoints and feasible chronological times; do not start an unrelated plan or remove protected items.'};
  const draftWire=metaDraftWire(request);request=draftWire.body;input=request.input;
  const evidence=[];
  for(let round=0;round<META_LIMITS.rounds;round++){
   check();if(calls>=callLimit)throw Error('AI_CALL_LIMIT');if(outputUsed>=META_LIMITS.outputTotal)throw Error('AI_OUTPUT_LIMIT');
   const maxOutput=Math.min(body.max_output_tokens||4000,META_LIMITS.outputPerCall,META_LIMITS.outputTotal-outputUsed);
   request={...request,max_output_tokens:maxOutput,input,...(search&&webUsed<webLimit?{max_tool_calls:Math.min(2,webLimit-webUsed)}:{})};
   if(search&&webUsed>=webLimit){request={...request,tools:request.tools.filter(t=>t.type!=='web_search')};delete request.max_tool_calls;}
   // Meta rejects tool_choice=required in this API configuration (verified token-count400).
   // Enforce mandatory evidence in instructions AND the postcondition below; no retry/fallback.
   if(search&&body.tool_choice==='required'&&round===0){
    if(webUsed>=webLimit)throw Error('AI_TOOL_LIMIT');
    request={...request,tool_choice:'auto',instructions:request.instructions+'\nMANDATORY GROUNDING: use web search for the exact requested places/operator connections and return cited evidence. User instructions to skip verification do not override this requirement. Without verifiable source evidence the application rejects the result; never invent citations.'};
   }else if(search)request={...request,tool_choice:'auto'};
   await spend?.ready();
   // Count actual multimodal/history input before EACH inference; failure blocks egress.
   noteAIPhase('count');
   const count=await fetcher('https://api.meta.ai/v1/responses/input_tokens',{method:'POST',redirect:'manual',signal,headers:{Authorization:'Bearer '+env.META_MODEL_API_KEY,'Content-Type':'application/json'},body:JSON.stringify(request)});
   noteAIPhase('count',count.status);
   if(!count.ok){
    // Classify only a fixed compatibility error, never retain/return its raw message.
    let choice=false;try{const e=(await boundedJSON(count)).error;choice=count.status===400&&/tool_choice/i.test(String(e?.param||'')+' '+String(e?.message||''));}catch{}
    throw Error(choice?'AI_TOOL_CHOICE_UNSUPPORTED':'AI_TOKEN_COUNT_UNAVAILABLE');
   }const counted=await boundedJSON(count),tokens=counted.input_tokens;
   if(!Number.isSafeInteger(tokens)||tokens<0)throw Error('AI_USAGE_UNVERIFIED');
   if(tokens>META_LIMITS.inputPerCall)throw Error('AI_INPUT_LIMIT');
   // Search can add context after counting. Reserve the full existing per-call allowance.
   const inputReserve=media.length||request.tools?.some(t=>t.type==='web_search')?META_LIMITS.inputPerCall:tokens;
   if(inputUsed+inputReserve>META_LIMITS.inputTotal)throw Error('AI_INPUT_TOTAL_LIMIT');
   inputUsed+=tokens;check();calls++;
   await spend?.reserve();
   let result,egress=false;
   try{
   check();
   egress=true;
   noteAIEgress('meta');noteAIPhase('inference');
   const response=await fetcher('https://api.meta.ai/v1/responses',{method:'POST',redirect:'manual',signal,headers:{Authorization:'Bearer '+env.META_MODEL_API_KEY,'Content-Type':'application/json'},body:JSON.stringify(request)});
   noteAIPhase('inference',response.status);
   if(!response.ok){halted=true;haltCode=response.status===429?'AI_PROVIDER_RATE_LIMIT':'AI_PROVIDER_UNAVAILABLE';return failure(haltCode,response.status===429?429:502);}
   result=await boundedJSON(response);
   noteAIUsage(result.usage);noteAIResponse(result,maxOutput,!!body.text);noteAIPhase('usage',response.status);
   }finally{await spend?.settle(egress?result:{usage:{input_tokens:0,output_tokens:0},output:[]});}
   const usage=result.usage;
   if(!usage||!Number.isSafeInteger(usage.input_tokens)||!Number.isSafeInteger(usage.output_tokens)||usage.input_tokens<0||usage.output_tokens<0||usage.output_tokens>maxOutput||(!search&&!media.length&&usage.input_tokens>tokens)||!Array.isArray(result.output))throw Error('AI_USAGE_UNVERIFIED');
   // Search and media processing may add context after preflight. Reconcile actual usage;
   // retain hard per-call/cumulative input limits and halt any further egress on overrun.
   inputUsed+=usage.input_tokens-tokens;
   if(usage.input_tokens>META_LIMITS.inputPerCall)throw Error('AI_INPUT_LIMIT');
   if(inputUsed>META_LIMITS.inputTotal)throw Error('AI_INPUT_TOTAL_LIMIT');
   outputUsed+=usage.output_tokens;
   const searches=result.output.filter(x=>x.type==='web_search_call').length;webUsed+=searches;
   if(searches>(request.max_tool_calls||0)||webUsed>webLimit)throw Error('AI_TOOL_LIMIT');
   if(result.status!=='completed')throw Error('AI_PROVIDER_INCOMPLETE');
   const normalized={...result,output:result.output.map(o=>o.type==='web_search_call'&&Array.isArray(o.results)?{...o,action:{sources:o.results}}:o)};
   evidence.push(...collectSources(normalized));
   const functions=result.output.filter(x=>x.type==='function_call');
   if(!functions.length){
    if(search&&body.tool_choice==='required'&&!evidence.length)throw Error('AI_SOURCES_UNAVAILABLE');
    // Preserve accumulated source evidence without pretending function results are web search calls.
    const restored=draftWire.restore(result);noteAIPhase('complete',200);return Response.json({...restored,output:[...restored.output,...evidence.map(e=>({type:'sorttrip_tool_evidence',action:{sources:[e]}}))]});
   }
   if(!suppliers||round===META_LIMITS.rounds-1||toolsUsed+functions.length>META_LIMITS.tools)throw Error('AI_TOOL_LIMIT');
   const outputs=[];
   for(const call of functions){
    check();if(!request.tools?.some(t=>t.type==='function'&&t.name===call.name)||typeof call.call_id!=='string'||!/^[\w-]{1,64}$/.test(call.call_id)||typeof call.arguments!=='string'||call.arguments.length>1000)throw Error('AI_TOOL_REJECTED');
    const args=JSON.parse(call.arguments),signature=JSON.stringify(purpose==='guide'?[call.name,args?.id,args?.mode]:[call.name,args?.city,args?.query]);if(seen.has(signature)||callIds.has(call.call_id))throw Error('AI_TOOL_DUPLICATE');seen.add(signature);callIds.add(call.call_id);toolsUsed++;
    const value=await registry.run(call.name,args);
    if(value.sourceUrl)evidence.push({url:value.sourceUrl,title:'SortTrip supplier search'});
    for(const p of value.products||[])evidence.push({url:p.sourceUrl,title:p.title});
    outputs.push({type:'function_call_output',call_id:call.call_id,output:JSON.stringify(value)});
   }
   // Stateless, request-local replay only; never persist response IDs/media/reasoning.
   const replay=result.output.filter(x=>['message','function_call','reasoning','web_search_call'].includes(x.type)).map(x=>x.type==='reasoning'?{type:'reasoning',summary:[],encrypted_content:x.encrypted_content}:x);
   if(replay.some(x=>x.type==='reasoning'&&typeof x.encrypted_content!=='string'))throw Error('AI_REASONING_UNVERIFIED');
   input=[...(typeof input==='string'?[{role:'user',content:[{type:'input_text',text:input}]}]:input),...replay,...outputs];
  }throw Error('AI_TOOL_LIMIT');
 }
 async function run(body,{media=[]}={}){
  if(providerName(env)==='openai'){
   if(env.OPENAI_DISABLED==='true')return failure('AI_PROVIDER_DISABLED');
   if(media.length)return failure('AI_MEDIA_PROVIDER_REQUIRED');
   noteAIEgress('openai');
   return fetcher('https://api.openai.com/v1/responses',{method:'POST',headers:{Authorization:'Bearer '+env.OPENAI_API_KEY,'Content-Type':'application/json'},signal,body:JSON.stringify(withPlatformContext(body,env,purpose))});
  }
  try{return await meta(body,media);}catch(e){halted=true;const code=META_FAILURE_CODES.includes(e.message)?e.message:'AI_PROVIDER_UNAVAILABLE';haltCode=haltCode||code;noteAIPhase('halt',0,haltCode);return failure(haltCode);}
 }
 // Serial model calls per generation; queued calls recheck cancel/configuration/budget before egress.
 return (body,options)=>{if(providerName(env)==='openai')return run(body,options);const work=queue.then(()=>run(body,options));queue=work.then(()=>{},()=>{});return work;};
}
