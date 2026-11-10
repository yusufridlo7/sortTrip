// Server-only global admission budget. No prompts/media/tokens/IDs in diagnostics.
export const META_RESERVATION_USD=0.10;
export const META_SPEND_CODES=['AI_BUDGET_UNAVAILABLE','AI_BUDGET_BUSY','AI_BUDGET_EXHAUSTED','AI_COST_UNVERIFIED','AI_SETTLEMENT_UNCONFIRMED'];
const production='https://tznxfgosmjcmwoszvkdk.supabase.co';
export function productionSpendRequired(env){try{return new URL(env.SUPABASE_URL).hostname==='tznxfgosmjcmwoszvkdk.supabase.co';}catch{return false;}}
const uuid=v=>typeof v==='string'&&/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(v);
export function metaSearchQueries(result){
 if(!Array.isArray(result.output))return null;
 const calls=result.output.filter(o=>o.type==='web_search_call');
 // Responses schema: action.queries is the issued query list; action.query is
 // the deprecated single-query form. Raw result counts are NOT query counts.
 let count=0;
 for(const call of calls){
  if(['open_page','find_in_page'].includes(call.action?.type))continue;
  if(call.action?.type&&call.action.type!=='search')return null;
  const queries=call.action?.queries;
  if(Array.isArray(queries)&&queries.length&&queries.every(q=>typeof q==='string'&&q.trim()))count+=queries.length;
  else if(typeof call.action?.query==='string'&&call.action.query.trim())count++;
  else return null;
 }
 return count;
}
export function metaSpendUsage(result){
 const u=result?.usage,queries=metaSearchQueries(result||{});
 if(!u)return null;
 const input=Number.isSafeInteger(u.input_tokens)&&u.input_tokens>=0?u.input_tokens:null,output=Number.isSafeInteger(u.output_tokens)&&u.output_tokens>=0?u.output_tokens:null;
 return {input,output,estimatedUSD:input!==null&&output!==null&&Number.isSafeInteger(queries)&&queries>=0?Math.ceil((input*1.25+output*4.25+queries*2500))/1000000:null};
}
export function metaSpendGuard(env,{fetcher=fetch,actorId}={}){
 // Existing production can NEVER opt out via a missing/false flag. Synthetic/local
 // offline fixtures without production bindings retain the compatibility path.
 if(!productionSpendRequired(env)&&env.META_SPEND_GUARD_ENABLED!=='true')return null;
 const key=env.SUPABASE_SERVICE_ROLE_KEY||env.SUPABASE_SECRET_KEY;
 let pending=null,readyForReservation=false;
 const rpc=async(name,body)=>{
  if(!key||typeof env.SUPABASE_URL!=='string'||env.SUPABASE_URL.replace(/\/$/,'')!==production)throw Error('AI_BUDGET_UNAVAILABLE');
  const r=await fetcher(env.SUPABASE_URL.replace(/\/$/,'')+'/rest/v1/rpc/'+name,{method:'POST',redirect:'manual',signal:AbortSignal.timeout(8000),headers:{apikey:key,'Content-Type':'application/json',...(env.SUPABASE_SERVICE_ROLE_KEY?{Authorization:'Bearer '+key}:{})},body:JSON.stringify(body)});
  if(!r.ok)throw Error('AI_BUDGET_UNAVAILABLE');
  const reader=r.body?.getReader();if(!reader)throw Error('AI_BUDGET_UNAVAILABLE');let size=0,text='';const decoder=new TextDecoder();
  try{while(true){const x=await reader.read();if(x.done)break;size+=x.value.byteLength;if(size>8192){await reader.cancel();throw Error('AI_BUDGET_UNAVAILABLE');}text+=decoder.decode(x.value,{stream:true});}return JSON.parse(text+decoder.decode());}catch{throw Error('AI_BUDGET_UNAVAILABLE');}finally{reader.releaseLock();}
 };
 const ready=async()=>{
   if(!uuid(actorId)||pending)throw Error('AI_BUDGET_UNAVAILABLE');
   const s=await rpc('meta_ai_safety_status',{});
   if(s.version!==3||s.globalExclusive!==true||s.reservedUSD!==META_RESERVATION_USD||s.maxLimitUSD!==100)throw Error('AI_BUDGET_UNAVAILABLE');
   if(typeof s.blocked!=='boolean'||typeof s.pending!=='boolean'||!Number.isFinite(s.allocatedUSD)||!Number.isFinite(s.totalLimitUSD)||s.allocatedUSD<0||s.totalLimitUSD<0||s.totalLimitUSD>100||s.allocatedUSD>s.totalLimitUSD)throw Error('AI_BUDGET_UNAVAILABLE');
   if(s.blocked||s.allocatedUSD+META_RESERVATION_USD>s.totalLimitUSD)throw Error('AI_BUDGET_EXHAUSTED');
   if(s.pending)throw Error('AI_BUDGET_BUSY');
   readyForReservation=true;
 };
 return {
  ready,
  async reserve(){
   if(!readyForReservation)await ready();readyForReservation=false;
   const id=crypto.randomUUID(),r=await rpc('reserve_meta_ai_request',{p_request:id,p_user:actorId});
   if(r.allowed!==true)throw Error(r.reason==='busy'?'AI_BUDGET_BUSY':r.reason==='exhausted'?'AI_BUDGET_EXHAUSTED':'AI_BUDGET_UNAVAILABLE');
   // Retain pending on invalid acknowledgement; never infer or silently retry its reservation.
   pending=id;
   if(r.id!==id||r.reservedUSD!==META_RESERVATION_USD||r.globalExclusive!==true||!Number.isFinite(r.totalLimitUSD)||r.totalLimitUSD<0||r.totalLimitUSD>100)throw Error('AI_BUDGET_UNAVAILABLE');
  },
  async settle(result){
   if(!pending)throw Error('AI_SETTLEMENT_UNCONFIRMED');
   const u=metaSpendUsage(result),id=pending;
   // Settlement is independent of the cancelled inference signal; unknown usage never refunds.
   let r;try{r=await rpc('settle_meta_ai_request',{p_request:id,p_estimated_usd:u?.estimatedUSD??null,p_input_tokens:u?.input??null,p_output_tokens:u?.output??null});}catch{throw Error('AI_SETTLEMENT_UNCONFIRMED');}
   pending=null;
   if(!u||u.estimatedUSD===null)throw Error('AI_COST_UNVERIFIED');
   if(r.ok!==true)throw Error('AI_SETTLEMENT_UNCONFIRMED');
  }
 };
}
