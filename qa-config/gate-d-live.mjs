import {existsSync,mkdirSync,openSync,closeSync,writeFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {localGateBSession} from './gate-b-session.mjs';
import {assertMetaActive,META_HARD_CUTOFF} from '../worker/meta-request.js';
const claim=resolve('.sorttrip-qa/gate-d-one-request.claim');
// Called only by the explicit local live profile. Wrangler privately loads the
// existing QA credential file; no secrets are read, copied or returned here.
export function gateDLive(config){
 let runtime=null,starting=null;
 async function start(){
  if(runtime)return runtime;if(starting)return starting;
  if(!existsSync('.dev.vars.meta-qa'))throw Error('QA_PRIVATE_CONFIG_REQUIRED');
  starting=(async()=>{const {getPlatformProxy}=await import('wrangler');
   const bindings=await getPlatformProxy({configPath:'wrangler.meta-qa.jsonc',environment:'meta-qa',envFiles:['.dev.vars.meta-qa'],persist:false,remoteBindings:false});
   const {createGateDWorker}=await import('../worker/gate-d-qa.js');const worker=createGateDWorker();
   const env={...bindings.env,STAGING_OWNER_QA_USER_ID:config.owner.qaUserId,STAGING_OWNER_EMAIL:config.owner.email,META_AI_CUTOFF_AT:META_HARD_CUTOFF};
   return runtime={stop:()=>bindings.dispose(),fetch:(url,init)=>worker.fetch(new Request(url,init),env)};
  })();return starting;
 }
 return {async close(){if(runtime)await runtime.stop();},async handle(req,url,body){
  const checked=await localGateBSession({url:'http://127.0.0.1:5176/api/staging/session',host:req.headers.host,origin:req.headers.origin,remoteAddress:req.socket.remoteAddress,authorization:req.headers.authorization,method:req.method},config,{enabled:true});
  if(!checked.ok)return checked;
  if(url.pathname.endsWith('/discover')){
   assertMetaActive({META_AI_CUTOFF_AT:META_HARD_CUTOFF});
   const parsed=JSON.parse(body);const {GATE_D_PROMPT}=await import('../worker/gate-d-qa.js');
   if(parsed.prompt!==GATE_D_PROMPT||parsed.preferences?.days!==3||parsed.preferences?.people!==1||parsed.consent!==true)return Response.json({code:'GATE_D_SCENARIO_REQUIRED'},{status:400});
   // Verify remaining entitlement through the normal authenticated access route
   // before spending the one local test attempt. No reserve/model call here.
   const worker=await start();const access=await worker.fetch('http://127.0.0.1:5176/api/assistant/access',{method:'POST',headers:{Authorization:req.headers.authorization,'Content-Type':'application/json'},body:'{}'});
   if(!access.ok)return access;const info=await access.json();if(!(info.pass?.remaining>=1))return Response.json({code:'TRIP_PASS_REQUIRED'},{status:402});
   mkdirSync(resolve('.sorttrip-qa'),{recursive:true});
   let fd;try{fd=openSync(claim,'wx');}catch{return Response.json({code:'GATE_D_ATTEMPT_USED'},{status:409});}
   try{writeFileSync(fd,JSON.stringify({attemptClaimedAt:new Date().toISOString(),maximumInferenceRequests:1}));}finally{closeSync(fd);}
  }
  const worker=await start();
  return worker.fetch('http://127.0.0.1:5176'+url.pathname,{method:'POST',headers:{Authorization:req.headers.authorization,'Content-Type':'application/json'},body});
 }};
}
