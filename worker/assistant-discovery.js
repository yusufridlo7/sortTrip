import {boundedBytes,VideoError} from '../lib/video-itinerary.mjs';
import {extractMetaText} from './video-itinerary.js';
import {passSummary} from './trip-access.js';
import {tiktokReference} from './tiktok-reference.js';
import {assertMetaActive} from './meta-request.js';
const reply=(data,status=200)=>Response.json(data,{status,headers:{'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}});
// Uses the configured project's own identity and entitlement. Never forwards a
// QA identity to production or treats free basic quota as a subscription.
export async function handleAssistantDiscovery(request,env,{fetcher=fetch,extract=extractMetaText,qaPreview=false}={}){
 const url=new URL(request.url);
 // Explicit local QA tool only, never a fallback from the paid product route.
 if(qaPreview&&(!['127.0.0.1','localhost'].includes(url.hostname)||env.SUPABASE_URL!=='https://aytrcvfncsklhqozreyk.supabase.co'||env.META_VIDEO_NONPRODUCTION!=='true'||url.pathname!=='/api/meta-qa/discovery-preview'))return reply({code:'QA_ISOLATION_REQUIRED'},503);
 const access=new URL(request.url).pathname.endsWith('/access');
 if(request.method!=='POST')return reply({code:'METHOD_NOT_ALLOWED'},405);
 if(request.headers.get('Origin')&&request.headers.get('Origin')!==new URL(request.url).origin)return reply({code:'ORIGIN_DENIED'},403);
 const authorization=request.headers.get('Authorization')||'';
 if(!/^Bearer [\w.-]+$/.test(authorization))return reply({code:'AUTH_REQUIRED'},401);
 const key=env.SUPABASE_SECRET_KEY||env.SUPABASE_SERVICE_ROLE_KEY;
 if(!key||!env.SUPABASE_URL||!env.SUPABASE_PUBLISHABLE_KEY||!env.AI_LIMITER)return reply({code:'SUBSCRIPTION_UNAVAILABLE'},503);
 const signal=AbortSignal.any([request.signal,AbortSignal.timeout(42000)]);
 const headers={apikey:key,'Content-Type':'application/json',...(env.SUPABASE_SECRET_KEY?{}:{Authorization:'Bearer '+key})};
 let reservation=null,user=null,finished=false,finishAttempted=false;
 const db=async(path,body)=>{
  const r=await fetcher(env.SUPABASE_URL.replace(/\/$/,'')+'/rest/v1/'+path,{method:body?'POST':'GET',headers,redirect:'manual',signal:AbortSignal.timeout(8000),...(body?{body:JSON.stringify(body)}:{})});
  if(!r.ok)throw new VideoError('SUBSCRIPTION_UNAVAILABLE',503);
  return JSON.parse(new TextDecoder().decode(await boundedBytes(r.body,16000,signal)));
 };
 try{
  const r=await fetcher(env.SUPABASE_URL+'/auth/v1/user',{headers:{Authorization:authorization,apikey:env.SUPABASE_PUBLISHABLE_KEY},redirect:'manual',signal});
  if(!r.ok)return reply({code:'AUTH_REQUIRED'},401);
  user=JSON.parse(new TextDecoder().decode(await boundedBytes(r.body,16000,signal)));
  if(typeof user.id!=='string'||!user.id)return reply({code:'AUTH_REQUIRED'},401);
  if(!(await env.AI_LIMITER.limit({key:'assistant-discovery:'+user.id})).success)return reply({code:'RATE_LIMITED'},429);
  if(request.headers.get('Content-Type')?.split(';')[0]!=='application/json')return reply({code:'INVALID_INPUT'},400);
  let body;try{body=JSON.parse(new TextDecoder().decode(await boundedBytes(request.body,8000,signal)));}catch{return reply({code:'INVALID_INPUT'},400);}
  if(access){
   const rows=await db('trip_passes?user_id=eq.'+encodeURIComponent(user.id)+'&expires_at=gt.'+encodeURIComponent(new Date().toISOString())+'&select=expires_at,request_limit,requests,payment_reference&order=expires_at.desc&limit=20');
   if(!Array.isArray(rows))throw new VideoError('SUBSCRIPTION_UNAVAILABLE',503);
   let metaCode='META_AI_ACTIVE';try{assertMetaActive(env)}catch(error){metaCode=error.code||'META_AI_CUTOFF_INVALID'}
   return reply({pass:passSummary(rows),meta:{code:metaCode},environment:env.META_VIDEO_NONPRODUCTION==='true'?'nonproduction':'production'});
  }
  if(typeof body.prompt!=='string'||!body.prompt.trim()||body.prompt.length>1000||new TextEncoder().encode(body.prompt).length>3000||body.consent!==true)return reply({code:'INVALID_INPUT'},400);
  const preferences=body.preferences;
  if(!preferences||!['CGK','SUB','DPS'].includes(preferences.origin)||!Number.isInteger(preferences.people)||preferences.people<1||preferences.people>8||!Number.isFinite(preferences.budget)||preferences.budget<0||preferences.budget>1e9||!(preferences.days===null||Number.isInteger(preferences.days)&&preferences.days>=1&&preferences.days<=14)||!['id','en'].includes(preferences.language))return reply({code:'INVALID_INPUT'},400);
  if(!qaPreview){
   assertMetaActive(env);
   reservation=crypto.randomUUID();
   const reserved=await db('rpc/reserve_paid_ai_request',{p_user:user.id,p_request:reservation});
   if(reserved?.allowed!==true){reservation=null;return reply({code:reserved?.busy?'AI_BUSY':'TRIP_PASS_REQUIRED'},reserved?.busy?429:402);}
  }
  const reference=await tiktokReference(body.prompt,{fetcher,signal});
  const source=reference.caption?JSON.stringify({travelerRequest:body.prompt,publicCaption:reference.caption,captionSource:reference.url,videoAccessed:false}):body.prompt;
  const result=await extract(source,env,{fetcher,signal,userId:user.id,discovery:true,instructions:JSON.stringify(preferences)});
  if(!Array.isArray(result.options)||preferences.days!==null&&result.options.some(option=>option.days!==preferences.days))throw new VideoError('INVALID_MODEL_OUTPUT',502);
  const regions=new Intl.DisplayNames([preferences.language],{type:'region'});
  result.options=result.options.map(option=>({...option,country:option.countryCode?regions.of(option.countryCode):option.country}));
  // Clarification is not a successful itinerary result and consumes no user
  // result quota. The separate Meta dollar allocation still records the call.
  const success=Array.isArray(result.options)&&result.options.length>0;
  if(!qaPreview){
   finishAttempted=true;
   const settled=await db('rpc/finish_ai_request',{p_user:user.id,p_request:reservation,p_success:success});
   if(settled?.ok!==true)throw new VideoError('QUOTA_SETTLEMENT_FAILED',503);
  }
  finished=true;
  return reply({...result,referenceStatus:reference.status,videoAccessed:false,quotaConsumed:qaPreview?false:success,...(qaPreview?{qaPreview:true}: {})});
 }catch(error){return reply({code:error instanceof VideoError?error.code:'SUBSCRIPTION_UNAVAILABLE',...(qaPreview&&error instanceof VideoError&&error.qa?{qa:error.qa}:{})},error instanceof VideoError?error.status:503);}
 finally{if(reservation&&!finished&&!finishAttempted&&user)try{await db('rpc/finish_ai_request',{p_user:user.id,p_request:reservation,p_success:false});}catch{/* Never retry uncertain finalization or fabricate success. */}}
}
