import {productionMetaEnabled,PRODUCTION_SUPABASE} from './meta-environment.js';
// Server-only: distinct production objects; never copy QA rows or inject budgets.
export function metaVideoBudget(env,fetcher=fetch){
 const production=productionMetaEnabled(env);
 if(env.SUPABASE_URL===PRODUCTION_SUPABASE&&!production)return null;
 const key=env.SUPABASE_SECRET_KEY||env.SUPABASE_SERVICE_ROLE_KEY;
 if((production?env.META_AI_BUDGET_READY:env.META_VIDEO_BUDGET_READY)!=='true'||!env.SUPABASE_URL||!key)return null;
 const names=production?{status:'meta_ai_safety_status',reserve:'reserve_meta_ai_request',settle:'settle_meta_ai_request'}:{status:'meta_video_test_safety_status',reserve:'reserve_meta_video_test',settle:'settle_meta_video_test'};
 // sb_secret_ keys are gateway API keys, not JWT bearer tokens. Preserve the
 // legacy service_role JWT header only for that explicit compatibility binding.
 const headers={apikey:key,'Content-Type':'application/json',...(env.SUPABASE_SECRET_KEY?{}:{Authorization:'Bearer '+key})};
 const rpc=async(name,body)=>{const r=await fetcher(env.SUPABASE_URL.replace(/\/$/,'')+'/rest/v1/rpc/'+name,{method:'POST',redirect:'manual',signal:AbortSignal.timeout(8000),headers,body:JSON.stringify(body)});if(!r.ok)throw Error('BUDGET_UNAVAILABLE');return r.json();};
 return {reserve:async r=>{
  // Missing migration fails before allocation or provider egress. This is not
  // an isolate-local mutex: every user/Worker must share the database guard.
  const control=await rpc(names.status,{});
  if(control?.version!==2||control.globalExclusive!==true)throw Error('BUDGET_CONTROL_REQUIRED');
  const reservation=await rpc(names.reserve,{p_request:r.id,p_user:r.userId});
  if(reservation?.allowed===true&&reservation.globalExclusive!==true)throw Error('BUDGET_CONTROL_REQUIRED');
  return reservation;
 },settle:async r=>{
  const result=await rpc(names.settle,{p_request:r.id,p_estimated_usd:r.usage?.estimatedUSD??null,p_input_tokens:r.usage?.inputTokens??null,p_output_tokens:r.usage?.outputTokens??null});
  if(result?.ok!==true)throw Error('SETTLEMENT_FAILED');
  return result;
 }};
}
