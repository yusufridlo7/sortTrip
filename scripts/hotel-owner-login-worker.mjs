// Local-only owner handoff experiment. Never export to production routing.
import {launch} from '@cloudflare/playwright';
function createOwnerSession(){
let browser,context,page,loginWindowEndsAt=0;
const reply=(status=200,data={ok:true})=>Response.json(data,{status,headers:{'Cache-Control':'no-store'}});
async function close(){page=undefined;context=undefined;const b=browser;browser=undefined;await b?.close().catch(()=>{});}
async function key(passphrase,salt,usage){
 if(typeof passphrase!=='string'||passphrase.length<16||passphrase.length>256)throw Error('PASSPHRASE_REQUIRED');
 const source=await crypto.subtle.importKey('raw',new TextEncoder().encode(passphrase),'PBKDF2',false,['deriveKey']);
 return crypto.subtle.deriveKey({name:'PBKDF2',salt,iterations:210000,hash:'SHA-256'},source,{name:'AES-GCM',length:256},false,[usage]);
}
const encode=bytes=>{const values=new Uint8Array(bytes);let text='';for(let i=0;i<values.length;i+=8192)text+=String.fromCharCode(...values.subarray(i,i+8192));return btoa(text);};
const decode=value=>Uint8Array.from(atob(value),x=>x.charCodeAt(0));
return {async fetch(request,env){
 if(request.headers.get('X-SortTrip-Owner-Control')!=='local-panel'||request.headers.has('Origin'))return reply(403,{code:'FORBIDDEN'});
 let stage='REQUEST';
 try{
  const path=new URL(request.url).pathname;
  if(path==='/status'&&request.method==='GET'){
   let active=!!browser?.isConnected();
   const keepAliveAllowed=Date.now()<loginWindowEndsAt;
   if(active&&page&&keepAliveAllowed){try{await page.evaluate(()=>true);}catch{active=false;}}
   return reply(200,{active,keepAliveAllowed});
  }
  if(path==='/view'&&request.method==='GET'){
   if(!browser?.isConnected()||!context||!page)return reply(409,{code:'SESSION_NOT_ACTIVE'});
   // Generate at click time; the previous five-minute link may have expired.
   try{
    const cdp=await context.newCDPSession(page);
    try{
     const result=await cdp.send('Cloudflare.getLiveView',{mode:'tab',expiresInMs:300000});
     const link=new URL(result.devtoolsFrontendUrl);
     if(link.protocol!=='https:'||link.hostname!=='live.browser.run')throw Error('LIVE_VIEW_UNAVAILABLE');
     return Response.redirect(link.href,302);
    }finally{await cdp.detach().catch(()=>{});}
   }catch{return reply(409,{code:'SESSION_NOT_ACTIVE'});}
  }
  if(request.method!=='POST')return reply(405,{code:'METHOD_NOT_ALLOWED'});
  if(path==='/start'||path==='/restore'){
   let state;
   if(path==='/restore'){
    const {passphrase,envelope}=await request.json();
    if(envelope?.version!==1||typeof envelope.data!=='string'||envelope.data.length>500000)throw Error('INVALID_STATE');
    const plaintext=await crypto.subtle.decrypt({name:'AES-GCM',iv:decode(envelope.iv)},await key(passphrase,decode(envelope.salt),'decrypt'),decode(envelope.data));
    const saved=JSON.parse(new TextDecoder().decode(plaintext));
    if(saved.expiresAt<Date.now())throw Error('STATE_EXPIRED');state=saved.state;
   }
   await close();
   stage='LAUNCH';
   browser=await launch(env.HOTEL_BROWSER,{keep_alive:600000});
   stage='CONTEXT';
   context=await browser.newContext({locale:'id-ID',...(state?{storageState:state}:{})});
   page=await context.newPage();
   loginWindowEndsAt=Date.now()+20*60000;
   await page.goto('https://id.trip.com/hotels/',{waitUntil:'domcontentloaded',timeout:20000}).catch(()=>{});
   return reply();
  }
  if(path==='/save'){
   if(!context||!page||!(await page.url()).startsWith('https://id.trip.com/'))return reply(409,{code:'SESSION_NOT_ACTIVE'});
   const {passphrase,confirmed}=await request.json();if(confirmed!==true)return reply(400,{code:'OWNER_CONFIRMATION_REQUIRED'});
   const salt=crypto.getRandomValues(new Uint8Array(16)),iv=crypto.getRandomValues(new Uint8Array(12));
   const encryption=await key(passphrase,salt,'encrypt');
   // Runtime only: state is never printed, sent to chat, or written in plaintext.
   const state=await context.storageState({indexedDB:true});
   state.cookies=state.cookies.filter(c=>/(^|\.)trip\.com$/.test(c.domain.replace(/^\./,'')));
   state.origins=state.origins.filter(o=>{try{return /(^|\.)trip\.com$/.test(new URL(o.origin).hostname);}catch{return false;}});
   const plaintext=new TextEncoder().encode(JSON.stringify({state,expiresAt:Date.now()+7*86400000}));
   if(plaintext.byteLength>200000)throw Error('STATE_TOO_LARGE');
   const data=await crypto.subtle.encrypt({name:'AES-GCM',iv},encryption,plaintext);
   return reply(200,{envelope:{version:1,salt:encode(salt),iv:encode(iv),data:encode(data)}});
  }
  if(path==='/close'){await close();return reply();}
  return reply(404,{code:'NOT_FOUND'});
 }catch(error){
  if(!context)await close();
  // Classify only known categories. Never expose provider error text, URLs or session IDs.
  const text=String(error?.message||'');
  const code=stage==='LAUNCH'?(/browser time limit exceeded for today/i.test(text)?'CLOUD_BROWSER_DAILY_LIMIT':/rate limit|too many requests/i.test(text)?'CLOUD_BROWSER_RATE_LIMIT':/code:\s*429|limit exceeded/i.test(text)?'CLOUD_BROWSER_LIMIT':/code:\s*40[13]/i.test(text)?'CLOUD_BROWSER_PERMISSION':'CLOUD_BROWSER_LAUNCH_FAILED'):stage==='CONTEXT'?'CLOUD_BROWSER_CONTEXT_FAILED':'OWNER_SESSION_ACTION_FAILED';
  return reply(502,{code});
 }
}};

}
export class OwnerHotelSession {
 constructor(state,env){this.env=env;this.session=createOwnerSession();}
 fetch(request){return this.session.fetch(request,this.env);}
}
export default {fetch(request,env){return env.OWNER_HOTEL_SESSION.get(env.OWNER_HOTEL_SESSION.idFromName("owner-login")).fetch(request);}};
