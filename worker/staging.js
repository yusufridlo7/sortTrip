import {verifyStagingAccess,verifyQAOwner,QA_PROJECT_URL} from './staging-access.js';
import {QA_ROUTES,qaReadRoute} from './qa-read-routes.js';
import {localizedResponse,requestLanguage} from './localization.js';
const reply=(data,status=200)=>Response.json(data,{status});
function secured(response){const headers=new Headers(response.headers);headers.set('Cache-Control','no-store');headers.set('X-Robots-Tag','noindex, nofollow, noarchive');headers.set('X-Content-Type-Options','nosniff');headers.set('Referrer-Policy','same-origin');headers.set('Content-Security-Policy',"frame-ancestors 'none'");return new Response(response.body,{status:response.status,statusText:response.statusText,headers});}
export function createStagingWorker({fetcher=fetch,...adapters}={}){return {async fetch(request,env,ctx){
 try{
  const access=await verifyStagingAccess(request,env,{fetcher}),url=new URL(request.url);
  if(request.headers.get('Origin')&&request.headers.get('Origin')!==url.origin)return secured(reply({code:'ORIGIN_DENIED'},403));
  if(request.method==='GET'&&url.pathname==='/api/staging/identity')return secured(reply({environment:'staging',supabaseURL:QA_PROJECT_URL,ownerAccessVerified:true,authReady:Boolean(env.SUPABASE_PUBLISHABLE_KEY),generationEnabled:false,supplierReadsEnabled:env.QA_SUPPLIER_READS_ENABLED==='true',supplierConfigured:Boolean(env.TRAVELPAYOUTS_API_TOKEN)}));
  if(!url.pathname.startsWith('/api/')){
   const asset=url.pathname==='/'||url.pathname==='/index.html'||/^\/assets\/[A-Za-z0-9_.-]+\.(js|css|woff2?|svg|png|jpg)$/.test(url.pathname)||/^\/branding\/[A-Za-z0-9_.-]+\.(svg|png|ico|css)$/.test(url.pathname)||/^\/images\/hotels\/[A-Za-z0-9_.-]+\.jpg$/.test(url.pathname)||['/hanoi.jpg','/kuala-lumpur.jpg','/singapore.jpg','/bangkok.jpg','/privacy.html','/terms.html','/policies.css','/favicon.ico','/favicon.svg','/site.webmanifest','/apple-touch-icon.png'].includes(url.pathname);
   if(!['GET','HEAD'].includes(request.method)||!asset)return secured(reply({code:'STAGING_ROUTE_UNAVAILABLE'},404));
   if(!env.ASSETS)return secured(reply({code:'STAGING_ASSETS_REQUIRED'},503));
   return secured(await env.ASSETS.fetch(request));
  }
  const route=QA_ROUTES[url.pathname];
  if(!route)return secured(reply({code:'STAGING_ROUTE_UNAVAILABLE'},404));
  if(request.method!==route.method)return secured(reply({code:'METHOD_NOT_ALLOWED'},405));
  await verifyQAOwner(request,env,access,{fetcher});
  return secured(await localizedResponse(await qaReadRoute(request,env,ctx,{fetcher,...adapters}),requestLanguage(request)));
 }catch(error){
  const code=['STAGING_CONFIG_REQUIRED','STAGING_FORBIDDEN_BINDING','STAGING_HOST_DENIED','ACCESS_DENIED','ACCESS_UNAVAILABLE','AUTH_REQUIRED','OWNER_REQUIRED'].includes(error?.message)?error.message:'STAGING_UNAVAILABLE';
  return secured(reply({code},code==='AUTH_REQUIRED'?401:['ACCESS_DENIED','OWNER_REQUIRED','STAGING_HOST_DENIED'].includes(code)?403:503));
 }
}};}
export default createStagingWorker();
