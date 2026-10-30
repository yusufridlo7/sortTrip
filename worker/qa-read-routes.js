import {parseQuery,searchFlights} from './index.js';
import {handleHotelSearch} from './hotel-search.js';
import {handleHotelContent} from './hotel-content.js';
import {searchLocations,resolveLocations} from './location-search.js';
import {recommendationResponse} from './recommendation-budgets.js';
import {boundedBytes} from '../lib/video-itinerary.mjs';
const reply=(body,status=200)=>Response.json(body,{status});
// This router is called ONLY after Access + QA owner verification in staging.js.
// Registered paid routes are terminal errors: no Meta/ledger/payment delegation.
export const QA_ROUTES=Object.freeze({
 '/api/staging/session':{method:'POST',kind:'session'},
 '/api/assistant/access':{method:'POST',kind:'disabled-entitlement'},
 '/api/payments/access':{method:'POST',kind:'disabled-entitlement'},
 '/api/assistant/discover':{method:'POST',kind:'disabled-ai'},
 '/api/video-itinerary':{method:'POST',kind:'disabled-ai'},
 '/api/itinerary':{method:'POST',kind:'disabled-ai'},
 '/api/itinerary/translate':{method:'POST',kind:'disabled-ai'},
 '/api/flights':{method:'GET',kind:'supplier'},
 '/api/hotels/search':{method:'POST',kind:'supplier'},
 '/api/hotels/content':{method:'GET',kind:'supplier'},
 '/api/locations':{method:'GET',kind:'catalogue'},
 '/api/locations/resolve':{method:'POST',kind:'catalogue'},
 '/api/recommendations':{method:'GET',kind:'reference'}
});
export function readOnlySupplierFetch(request,fetcher){return async(target,init={})=>{
 const u=new URL(target),method=init.method||'GET';
 const flight=u.origin==='https://api.travelpayouts.com'&&u.pathname==='/aviasales/v3/prices_for_dates'&&method==='GET';
 const hotel=u.origin==='https://api.liteapi.travel'&&((u.pathname==='/v3.0/hotels/rates'&&method==='POST')||(['/v3.0/data/hotels','/v3.0/data/hotel','/v3.0/data/reviews'].includes(u.pathname)&&method==='GET'));
 const headers=new Headers(init.headers);
 if((!flight&&!hotel)||u.username||u.password||headers.has('Authorization')||headers.has('Cookie'))throw Error('SUPPLIER_EGRESS_DENIED');
 const signal=AbortSignal.any([request.signal,AbortSignal.timeout(19000),...(init.signal?[init.signal]:[])]);
 const r=await fetcher(u.href,{...init,method,headers:Object.fromEntries(headers),redirect:'manual',signal});
 if(!r.ok){await r.body?.cancel();return new Response(null,{status:r.status});}
 return new Response(await boundedBytes(r.body,hotel?6000000:1000000,signal),{status:r.status,headers:{'Content-Type':'application/json'}});
};}
export async function qaReadRoute(request,env,ctx,{fetcher=fetch,flights=searchFlights,hotels=handleHotelSearch,content=handleHotelContent}={}){
 const url=new URL(request.url),route=QA_ROUTES[url.pathname];
 if(!route)return reply({code:'STAGING_ROUTE_UNAVAILABLE'},404);
 if(request.method!==route.method)return reply({code:'METHOD_NOT_ALLOWED'},405);
 if(route.kind==='session')return reply({ownerVerified:true,environment:'staging',cloudflareAccessVerified:true});
 if(route.kind==='disabled-ai')return reply({code:'QA_AI_DISABLED',errorKey:'qa_ai_disabled'},503);
 if(route.kind==='disabled-entitlement')return reply({code:'QA_ENTITLEMENT_UNVERIFIED',errorKey:'qa_entitlement_unverified'},503);
 if(url.pathname==='/api/locations')return reply({locations:searchLocations(url.searchParams.get('q')||'')});
 if(url.pathname==='/api/locations/resolve')return resolveLocations(request);
 if(url.pathname==='/api/recommendations')return recommendationResponse(request,{});
 if(env.QA_SUPPLIER_READS_ENABLED!=='true')return reply({code:'QA_SUPPLIER_DISABLED',errorKey:'qa_supplier_disabled'},503);
 if(!env.AI_LIMITER)return reply({code:'STAGING_CONFIG_REQUIRED'},503);
 const read=readOnlySupplierFetch(request,fetcher);
 if(url.pathname==='/api/flights'){
  if(!env.TRAVELPAYOUTS_API_TOKEN)return reply({code:'SUPPLIER_UNAVAILABLE'},503);
  if(!(await env.AI_LIMITER.limit({key:'staging-supplier:'+env.STAGING_OWNER_QA_USER_ID})).success)return reply({code:'RATE_LIMITED'},429);
  let q;try{q=parseQuery(request.url);}catch{return reply({code:'INVALID_INPUT'},400);}
  return flights(q,env,ctx,{fetcher:read,cache:null});
 }
 if(!env.LITEAPI_API_KEY||env.LITEAPI_ENABLED!=='true')return reply({code:'SUPPLIER_UNAVAILABLE',errorKey:'hotel_search_unavailable'},503);
 // Drop optional White-label and all checkout/payment bindings for these reads.
 const supplier={LITEAPI_API_KEY:env.LITEAPI_API_KEY,LITEAPI_ENABLED:'true',AI_LIMITER:env.AI_LIMITER};
 return url.pathname==='/api/hotels/search'?hotels(request,supplier,{fetcher:read}):content(request,supplier,read);
}
