import {boundedBytes} from '../lib/video-itinerary.mjs';
export const KINGSTONE_QUERY='https://api.liteapi.travel/v3.0/data/hotels?countryCode=MY&cityName=Kuala+Lumpur&hotelName=Kingstone&limit=25&offset=0';
const text=v=>typeof v==='string'?v.replace(/[\x00-\x1f]/g,' ').slice(0,200):null;
// Separate owner authorization: ONE metadata request, no redirects/retry/pagination.
export async function kingstoneMetadata({key,budget,fetcher=fetch,variant='Kingstone'}){
 const variants={Kingstone:['hotel-metadata',KINGSTONE_QUERY],Kingston:['hotel-metadata-kingston',KINGSTONE_QUERY.replace('hotelName=Kingstone','hotelName=Kingston')],Riccarton:['hotel-metadata-riccarton',KINGSTONE_QUERY.replace('hotelName=Kingstone','hotelName=Riccarton')]};
 if(!Object.hasOwn(variants,variant))return {status:'QUERY_NOT_AUTHORIZED',upstreamRequests:0};
 if(typeof key!=='string'||key.trim().length<=8)return {status:'BINDING_REQUIRED',upstreamRequests:0};
 try{budget.claim(variants[variant][0]);}catch{return {status:'REQUEST_USED_OR_STATE_UNAVAILABLE',upstreamRequests:0};}
 const signal=AbortSignal.timeout(19000);
 try{
  const r=await fetcher(variants[variant][1],{method:'GET',redirect:'manual',headers:{'X-API-Key':key,Accept:'application/json'},signal});
  if(!r.ok){await r.body?.cancel();return {status:'UPSTREAM_FAILED',http:r.status,upstreamRequests:1};}
  const body=JSON.parse(new TextDecoder().decode(await boundedBytes(r.body,1000000,signal)));
  if(!Array.isArray(body.data)||[true,1,'true','1'].includes(body.sandbox))return {status:'UNVERIFIED_RESPONSE',http:r.status,upstreamRequests:1};
  const hotels=body.data.slice(0,25).map(h=>({id:typeof h.id==='string'&&/^[A-Za-z0-9_-]{1,100}$/.test(h.id)?h.id:null,name:text(h.name),city:text(h.city),country:text(h.country),address:text(h.address),latitude:Number.isFinite(h.latitude)?h.latitude:null,longitude:Number.isFinite(h.longitude)?h.longitude:null}));
  return {status:hotels.length?'REVIEW_REQUIRED':'EMPTY',http:r.status,upstreamRequests:1,hotels};
 }catch{return {status:'REQUEST_FAILED_NO_RETRY',upstreamRequests:1};}
}
