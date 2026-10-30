import {verifyQAOwner} from '../worker/staging-access.js';
import {QA_LOCAL_ORIGIN} from './gate-a.mjs';
export async function localGateBSession({url,host,origin,remoteAddress,authorization,method},config,{fetcher=fetch,enabled=false}={}){
 const reply=(code,status)=>Response.json({code},{status});
 if(!enabled)return reply('QA_AUTH_DISABLED',503);
 if(url!==QA_LOCAL_ORIGIN+'/api/staging/session'||host!=='127.0.0.1:5176'||origin!==QA_LOCAL_ORIGIN||!['127.0.0.1','::ffff:127.0.0.1','::1'].includes(remoteAddress))return reply('LOOPBACK_ORIGIN_REQUIRED',403);
 if(method!=='POST')return reply('METHOD_NOT_ALLOWED',405);
 try{
  await verifyQAOwner(new Request(url,{method:'POST',headers:{Authorization:authorization||''}}),{SUPABASE_PUBLISHABLE_KEY:config.publishableKey,STAGING_OWNER_QA_USER_ID:config.owner.qaUserId},{email:config.owner.email},{fetcher});
  return Response.json({ownerVerified:true,environment:'qa-gate-b-local',cloudflareAccessVerified:false},{headers:{'Cache-Control':'no-store'}});
 }catch(error){const code=['AUTH_REQUIRED','OWNER_REQUIRED','STAGING_CONFIG_REQUIRED'].includes(error?.message)?error.message:'QA_AUTH_UNAVAILABLE';return reply(code,code==='OWNER_REQUIRED'?403:code==='AUTH_REQUIRED'?401:503);}
}
