import {boundedBytes} from '../lib/video-itinerary.mjs';
import {metaVideoBudget} from './meta-video-budget.js';
const reply=(body,status=200)=>Response.json(body,{status,headers:{'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}});
// QA entry only. This diagnostic permanently consumes one $0.05 allocation,
// but calls no Meta endpoint and never refunds the allocation.
export async function handleQABudget(request,env,{fetcher=fetch}={}){
 if(request.method!=='POST')return reply({code:'METHOD_NOT_ALLOWED'},405);
 if(request.headers.get('Origin')&&request.headers.get('Origin')!==new URL(request.url).origin)return reply({code:'ORIGIN_DENIED'},403);
 const authorization=request.headers.get('Authorization')||'';
 if(!/^Bearer [\w.-]+$/.test(authorization))return reply({code:'AUTH_REQUIRED'},401);
 if(env.SUPABASE_URL!=='https://aytrcvfncsklhqozreyk.supabase.co'||env.META_VIDEO_NONPRODUCTION!=='true'||!['localhost','127.0.0.1'].includes(new URL(request.url).hostname))return reply({code:'QA_ISOLATION_REQUIRED'},503);
 if(!env.SUPABASE_PUBLISHABLE_KEY||!env.SUPABASE_SECRET_KEY||!env.AI_LIMITER)return reply({code:'QA_CONFIG_REQUIRED'},503);
 const signal=AbortSignal.any([request.signal,AbortSignal.timeout(25000)]);
 let stage='qa-auth',providerStatus,reason;
 try{
  const auth=await fetcher(env.SUPABASE_URL+'/auth/v1/user',{headers:{Authorization:authorization,apikey:env.SUPABASE_PUBLISHABLE_KEY},redirect:'manual',signal});
  if(!auth.ok)return reply({code:'AUTH_REQUIRED'},401);
  const user=JSON.parse(new TextDecoder().decode(await boundedBytes(auth.body,16384,signal)));
  if(typeof user.id!=='string'||!user.id)return reply({code:'AUTH_REQUIRED'},401);
  if(!(await env.AI_LIMITER.limit({key:'metaqa-budget:'+user.id})).success)return reply({code:'RATE_LIMITED'},429);
  const body=JSON.parse(new TextDecoder().decode(await boundedBytes(request.body,256,signal)));
  if(Object.keys(body).length!==1||!['allocate-005-no-refund','read-status'].includes(body.confirm))return reply({code:'CONSENT_REQUIRED'},400);
  const snapshot=async()=>{
   const r=await fetcher(env.SUPABASE_URL+'/rest/v1/meta_video_test_budget?id=eq.true&select=allocated_usd,blocked',{headers:{apikey:env.SUPABASE_SECRET_KEY},redirect:'manual',signal});
   if(!r.ok){
    providerStatus=r.status;
    const error=JSON.parse(new TextDecoder().decode(await boundedBytes(r.body,4000,signal)));
    if(error.code==='42501')reason='DATABASE_PERMISSION_DENIED';
    else if(/secret.*browser/i.test(String(error.message||error.error||'')))reason='SERVER_KEY_BROWSER_CONTEXT_DENIED';
    else if(['PGRST301','PGRST302','PGRST303'].includes(error.code))reason='SERVER_AUTH_REJECTED';
    throw Error('BUDGET_UNAVAILABLE');
   }
   const rows=JSON.parse(new TextDecoder().decode(await boundedBytes(r.body,2000,signal)));
   if(!Array.isArray(rows)||rows.length!==1||!Number.isFinite(Number(rows[0].allocated_usd))||Number(rows[0].allocated_usd)<0||Number(rows[0].allocated_usd)>10||typeof rows[0].blocked!=='boolean')throw Error('BUDGET_UNAVAILABLE');
   return {allocatedUSD:Number(rows[0].allocated_usd),blocked:rows[0].blocked};
  };
  stage='budget-read';const before=await snapshot();
  if(body.confirm==='read-status')return reply({readVerified:true,allocatedUSD:before.allocatedUSD,remainingUSD:10-before.allocatedUSD,blocked:before.blocked,metaCalls:0});
  stage='budget-reserve';
  const ledger=metaVideoBudget({...env,META_VIDEO_BUDGET_READY:'true'},fetcher);
  const reservation=await ledger.reserve({id:crypto.randomUUID(),userId:user.id});
  if(reservation?.allowed===false)return reply({code:'BUDGET_EXHAUSTED'},429);
  if(!reservation?.id||reservation.hardCap!==true||reservation.totalLimitUSD!==10||reservation.reservedUSD!==.05)throw Error('BUDGET_UNAVAILABLE');
  stage='budget-settle';const settled=await ledger.settle({id:reservation.id,usage:null});
  if(settled?.ok!==true)throw Error('SETTLEMENT_UNCONFIRMED');
  stage='budget-after';const after=await snapshot();
  if(after.blocked||Math.abs(after.allocatedUSD-before.allocatedUSD-.05)>0.000001)throw Error('ALLOCATION_UNCONFIRMED');
  return reply({reserveVerified:true,settleVerified:true,unknownUsageRetained:true,allocatedUSD:after.allocatedUSD,remainingUSD:10-after.allocatedUSD,retainedAllocationUSD:.05,metaCalls:0});
 }catch{return reply({code:'BUDGET_UNAVAILABLE',stage,...(providerStatus?{providerStatus}:{}),...(reason?{reason}:{}),automaticRetry:false},503);}
}
