import {boundedBytes} from '../lib/video-itinerary.mjs';
export const QA_PROJECT_URL='https://aytrcvfncsklhqozreyk.supabase.co';
export const STAGING_ORIGIN='https://sorttrip-staging.yusufridlo7.workers.dev';
const uuid=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
export function stagingConfiguration(env){
 if(env.APP_ENV!=='staging'||env.SUPABASE_URL!==QA_PROJECT_URL||env.STAGING_ORIGIN!==STAGING_ORIGIN||env.META_VIDEO_NONPRODUCTION!=='true'||!uuid.test(env.STAGING_OWNER_QA_USER_ID||''))throw Error('STAGING_CONFIG_REQUIRED');
 if(!/^https:\/\/[a-z0-9-]+\.cloudflareaccess\.com$/.test(env.CF_ACCESS_ISSUER||'')||!/^[a-f0-9]{64}$/i.test(env.CF_ACCESS_AUD||'')||!/^\S+@\S+\.\S+$/.test(env.STAGING_OWNER_EMAIL||''))throw Error('STAGING_CONFIG_REQUIRED');
 // Accidental production bindings fail closed, including unused credentials.
 if(['SUPABASE_SERVICE_ROLE_KEY','MIDTRANS_SERVER_KEY','OPENAI_API_KEY','HOTEL_BROWSER','RECOMMENDATION_BUDGETS','TELEGRAM_BOT_TOKEN','RESEND_API_KEY'].some(k=>Boolean(env[k])))throw Error('STAGING_FORBIDDEN_BINDING');
}
function decode(value){
 if(!/^[A-Za-z0-9_-]+$/.test(value)||value.length>16000)throw Error('ACCESS_DENIED');
 const raw=atob(value.replace(/-/g,'+').replace(/_/g,'/').padEnd(Math.ceil(value.length/4)*4,'='));return Uint8Array.from(raw,c=>c.charCodeAt(0));
}
export async function verifyStagingAccess(request,env,{fetcher=fetch,now=Date.now()}={}){
 stagingConfiguration(env);
 if(new URL(request.url).origin!==STAGING_ORIGIN)throw Error('STAGING_HOST_DENIED');
 const token=request.headers.get('Cf-Access-Jwt-Assertion')||'';if(token.length>20000)throw Error('ACCESS_DENIED');
 const segments=token.split('.');if(segments.length!==3)throw Error('ACCESS_DENIED');
 let head,claims;try{head=JSON.parse(new TextDecoder().decode(decode(segments[0])));claims=JSON.parse(new TextDecoder().decode(decode(segments[1])));}catch{throw Error('ACCESS_DENIED');}
 if(head.alg!=='RS256'||typeof head.kid!=='string'||head.kid.length>200||head.jku||head.jwk||head.x5u||head.crit)throw Error('ACCESS_DENIED');
 const seconds=Math.floor(now/1000),aud=Array.isArray(claims.aud)?claims.aud:[claims.aud];
 if(claims.iss!==env.CF_ACCESS_ISSUER||!aud.includes(env.CF_ACCESS_AUD)||!Number.isFinite(claims.exp)||claims.exp<=seconds||!Number.isFinite(claims.iat)||claims.iat>seconds+60||(claims.nbf!==undefined&&(!Number.isFinite(claims.nbf)||claims.nbf>seconds))||typeof claims.sub!=='string'||!claims.sub||claims.email!==env.STAGING_OWNER_EMAIL)throw Error('ACCESS_DENIED');
 // Fetch only the configured issuer's fixed JWKS endpoint. Never token jku.
 const r=await fetcher(env.CF_ACCESS_ISSUER+'/cdn-cgi/access/certs',{redirect:'manual',signal:AbortSignal.any([request.signal,AbortSignal.timeout(5000)]),headers:{Accept:'application/json'}});
 if(!r.ok)throw Error('ACCESS_UNAVAILABLE');
 const data=JSON.parse(new TextDecoder().decode(await boundedBytes(r.body,48000,request.signal)));
 if(!Array.isArray(data.keys)||data.keys.length>20)throw Error('ACCESS_UNAVAILABLE');
 const keys=data.keys.filter(k=>k.kid===head.kid&&k.kty==='RSA'&&(!k.use||k.use==='sig')&&(!k.alg||k.alg==='RS256'));
 if(keys.length!==1)throw Error('ACCESS_DENIED');
 const key=await crypto.subtle.importKey('jwk',keys[0],{name:'RSASSA-PKCS1-v1_5',hash:'SHA-256'},false,['verify']);
 if(!await crypto.subtle.verify('RSASSA-PKCS1-v1_5',key,decode(segments[2]),new TextEncoder().encode(segments[0]+'.'+segments[1])))throw Error('ACCESS_DENIED');
 return {email:claims.email};
}
export async function verifyQAOwner(request,env,access,{fetcher=fetch}={}){
 const authorization=request.headers.get('Authorization')||'';
 if(!/^Bearer [\w.-]+$/.test(authorization))throw Error('AUTH_REQUIRED');
 if(!env.SUPABASE_PUBLISHABLE_KEY)throw Error('STAGING_CONFIG_REQUIRED');
 const r=await fetcher(QA_PROJECT_URL+'/auth/v1/user',{redirect:'manual',headers:{Authorization:authorization,apikey:env.SUPABASE_PUBLISHABLE_KEY},signal:AbortSignal.any([request.signal,AbortSignal.timeout(8000)])});
 if(!r.ok)throw Error('AUTH_REQUIRED');
 const u=JSON.parse(new TextDecoder().decode(await boundedBytes(r.body,16000,request.signal)));
 if(u.id!==env.STAGING_OWNER_QA_USER_ID||u.email!==access.email||!u.email_confirmed_at)throw Error('OWNER_REQUIRED');
 return {id:u.id};
}
