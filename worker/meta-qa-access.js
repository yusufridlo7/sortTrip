import {boundedBytes} from '../lib/video-itinerary.mjs';
import {assertMetaActive,metaRequest} from './meta-request.js';
const reply=(code,status,diagnostic={})=>Response.json({code,...diagnostic},{status,headers:{'Cache-Control':'no-store'}});
// Read-only model metadata. Never generation, token count, Files or budget RPC.
export async function handleMetaQAAccess(request,env,{fetcher=fetch}={}){
 if(request.method!=='POST')return reply('METHOD_NOT_ALLOWED',405);
 if(request.headers.get('Origin')&&request.headers.get('Origin')!==new URL(request.url).origin)return reply('ORIGIN_DENIED',403);
 const authorization=request.headers.get('Authorization')||'';
 if(!/^Bearer [\w.-]+$/.test(authorization))return reply('AUTH_REQUIRED',401);
 if(!env.SUPABASE_URL||!env.SUPABASE_PUBLISHABLE_KEY||!env.AI_LIMITER||!env.META_MODEL_API_KEY)return reply('QA_CONFIG_REQUIRED',503);
 let stage='qa-auth-request';
 try{
  assertMetaActive(env);
  const signal=AbortSignal.any([request.signal,AbortSignal.timeout(15000)]);
  const auth=await fetcher(env.SUPABASE_URL+'/auth/v1/user',{headers:{Authorization:authorization,apikey:env.SUPABASE_PUBLISHABLE_KEY},redirect:'manual',signal});
  if(!auth.ok)return reply('AUTH_REQUIRED',401);
  stage='qa-auth-response';
  const user=JSON.parse(new TextDecoder().decode(await boundedBytes(auth.body,16384,signal)));
  if(typeof user.id!=='string'||!user.id)return reply('AUTH_REQUIRED',401);
  stage='qa-rate-limit';
  if(!(await env.AI_LIMITER.limit({key:'metaqa-metadata:'+user.id})).success)return reply('RATE_LIMITED',429);
  stage='meta-metadata';
  const response=await metaRequest(env,'https://api.meta.ai/v1/models/muse-spark-1.3',{headers:{Authorization:'Bearer '+env.META_MODEL_API_KEY},signal},fetcher);
  if(!response.ok)return reply([401,403].includes(response.status)?'MODEL_ACCESS_REQUIRED':response.status===404?'MODEL_UNAVAILABLE':response.status===429?'RATE_LIMITED':'MODEL_METADATA_FAILED',response.status===429?429:503,{stage,providerStatus:response.status});
  stage='meta-response';
  const data=JSON.parse(new TextDecoder().decode(await boundedBytes(response.body,32768,signal)));
  if(data.id!=='muse-spark-1.3')return reply('MODEL_METADATA_FAILED',502);
  return Response.json({model:'muse-spark-1.3',metadataAccessible:true,inferencePerformed:false,paidGenerationRequests:0},{headers:{'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}});
 }catch(error){
  if(['META_AI_EXPIRED','META_AI_CUTOFF_INVALID'].includes(error?.code))return reply(error.code,503);
  // Classify locally; never return or log an error message that might contain
  // header/credential text. A bad header requires private owner correction.
  const message=error instanceof Error?error.message:'';
  const reason=/header|ByteString|ISO-8859|non-ASCII/i.test(message)?'HEADER_FORMAT_INVALID':error?.name==='TimeoutError'||error?.name==='AbortError'?'TIMEOUT':'REQUEST_FAILED';
  return reply('MODEL_METADATA_FAILED',503,{stage,reason});
 }
}
export async function probeQANetwork(fetcher=fetch,env={}){
 const results={};for(const [name,url] of [['qaAuth','https://aytrcvfncsklhqozreyk.supabase.co/auth/v1/health'],['metaHealth','https://api.meta.ai/v1/status']]){
  try{const init={redirect:'manual',signal:AbortSignal.timeout(5000)};const r=await(name==='metaHealth'?metaRequest(env,url,init,fetcher):fetcher(url,init));results[name]={http:r.status};await r.body?.cancel();}catch(error){
   // These probes carry no headers, keys or user data; only fixed public URLs.
   // Report a bounded diagnostic for this credential-free connection test.
   results[name]={reachable:false,diagnostic:error?.code||'REQUEST_FAILED'};
  }
 }return Response.json(results,{headers:{'Cache-Control':'no-store'}});
}
