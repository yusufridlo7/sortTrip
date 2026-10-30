import {handleAssistantDiscovery} from './assistant-discovery.js';
import {verifyQAOwner,QA_PROJECT_URL} from './staging-access.js';
import {assertMetaActive} from './meta-request.js';
export const GATE_D_PROMPT='Buat itinerary Kuala Lumpur 3 hari untuk 1 orang, museum dan transportasi hemat. Tandai harga yang belum tersedia.';
const reply=(code,status)=>Response.json({code},{status,headers:{'Cache-Control':'no-store'}});
export function createGateDWorker({fetcher=fetch,discover=handleAssistantDiscovery}={}){
 let attempted=false;
 return {async fetch(request,env){
  const url=new URL(request.url);
  if(url.hostname!=='127.0.0.1'||env.SUPABASE_URL!==QA_PROJECT_URL||env.META_VIDEO_NONPRODUCTION!=='true'||!env.STAGING_OWNER_QA_USER_ID||!env.STAGING_OWNER_EMAIL)return reply('QA_ISOLATION_REQUIRED',503);
  if(!['/api/assistant/access','/api/assistant/discover'].includes(url.pathname))return reply('QA_ROUTE_UNAVAILABLE',404);
  if(request.method!=='POST')return reply('METHOD_NOT_ALLOWED',405);
  if(request.headers.get('Origin')&&request.headers.get('Origin')!=='http://127.0.0.1:5176')return reply('ORIGIN_DENIED',403);
  try{
   await verifyQAOwner(request,env,{email:env.STAGING_OWNER_EMAIL},{fetcher});
   if(url.pathname.endsWith('/discover')){
    assertMetaActive(env);
    const raw=await request.clone().text();if(new TextEncoder().encode(raw).length>8000)return reply('INVALID_INPUT',400);
    let body;try{body=JSON.parse(raw)}catch{return reply('INVALID_INPUT',400)}
    if(body.prompt!==GATE_D_PROMPT||body.preferences?.days!==3||body.preferences?.people!==1||body.preferences?.language!=='id'||body.consent!==true)return reply('GATE_D_SCENARIO_REQUIRED',400);
    // Additional fail-closed isolate latch. The local proxy also keeps a durable
    // one-attempt file across restarts. Neither replaces Trip Pass/SQL08.
    if(attempted)return reply('GATE_D_ATTEMPT_USED',409);
    attempted=true;
   }
   const cleanHeaders=new Headers(request.headers);cleanHeaders.delete('Origin');
   return await discover(new Request(request,{headers:cleanHeaders}),env,{fetcher});
  }catch(error){const code=['AUTH_REQUIRED','OWNER_REQUIRED','META_AI_EXPIRED','META_AI_CUTOFF_INVALID'].includes(error?.code||error?.message)?error.code||error.message:'QA_UNAVAILABLE';return reply(code,code==='AUTH_REQUIRED'?401:code==='OWNER_REQUIRED'?403:503);}
 }};
}
export default createGateDWorker();
