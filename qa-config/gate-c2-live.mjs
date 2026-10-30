import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {parseQuery,searchFlights,normalize} from '../worker/index.js';
import {checkedLiteOffer} from '../worker/lite-hotel.js';
import {assertLiteApiFreeEndpoint} from '../worker/liteapi-cost-policy.js';
import {liteRatesEnvelope} from '../worker/liteapi-rates-response.js';
import {localGateBSession} from './gate-b-session.mjs';
import {QA_LOCAL_ORIGIN} from './gate-a.mjs';
import {gateC2Budget,C2_LIMITS} from './gate-c2-budget.mjs';
import {supplierJSON} from './gate-c2-diagnostics.mjs';
export const C2_HOTEL={id:'lp65706cc6',name:'Kingston Hotel 1 - Bukit Bintang',city:'Kuala Lumpur',country:'MY',address:'74 - 76 Jalan Bukit Bintang',latitude:3.145779,longitude:101.70981};
// Both IDs come from the prior actual QA metadata response, not fixtures.
export const C2_HULO={id:'lp656f7c12',name:'Kingston Hotel 4 - Hulo Bukit Bintang',city:'Kuala Lumpur',country:'MY',address:'196, Jalan Changkat Thambi Dollah',latitude:3.139794,longitude:101.713785};
export function createGateC2Live(config,{directory,bindings,fetcher=fetch,authFetcher=fetch,verify=localGateBSession}={}){
 const budget=gateC2Budget(directory),closed=kind=>fs.existsSync(path.join(directory,'closed'))||fs.existsSync(path.join(directory,kind+'.success'))||fs.existsSync(path.join(directory,kind+'.blocked'))||budget.count(kind)>=C2_LIMITS[kind];
 const enabled=()=>!closed('flight')||!closed('hotel');
 const reply=(body,status=200)=>Response.json(body,{status,headers:{'Cache-Control':'no-store'}});
 const persist=(file,body)=>fs.writeFileSync(path.join(directory,file),JSON.stringify(body,null,2),{flag:'wx'});
 return {phase:'C2',enabled,async handle(req,body,connection){
  const u=new URL(req.url),kind=u.pathname==='/api/flights'?'flight':u.pathname==='/api/hotels/search'?'hotel':null;
  if(!kind)return reply({code:'C2_ROUTE_DENIED'},404);
  if(connection.host!=='127.0.0.1:5176'||!['127.0.0.1','::ffff:127.0.0.1','::1'].includes(connection.remoteAddress)||(req.headers.get('Origin')!==QA_LOCAL_ORIGIN&&!(req.headers.get('Origin')===null&&req.headers.get('Sec-Fetch-Site')==='same-origin')))return reply({code:'C2_ORIGIN_DENIED'},403);
  const owner=await verify({url:QA_LOCAL_ORIGIN+'/api/staging/session',host:connection.host,origin:QA_LOCAL_ORIGIN,remoteAddress:connection.remoteAddress,authorization:req.headers.get('Authorization'),method:'POST'},config,{enabled:true,fetcher:authFetcher});if(!owner.ok)return owner;
  let q,hotel=C2_HOTEL;
  try{
   if(kind==='flight'){
    if(req.method!=='GET')throw Error();q=parseQuery(req.url);
    if(q.origin!=='CGK'||!['KUL','kl'].includes(q.destination)||q.journey!=='return'||q.page!==1||q.outTo>'2027-02-28'||q.backTo>'2027-03-31'||q.minDays>14||q.maxDays>366)throw Error();
   }else{
    if(req.method!=='POST')throw Error();q=JSON.parse(body);
    const valid=d=>typeof d==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(d)&&Number.isFinite(Date.parse(d))&&new Date(d).toISOString().slice(0,10)===d;
    if(q.hotelName&&C2_HULO.name.toLowerCase().includes(q.hotelName.toLowerCase()))hotel=C2_HULO;
    if(q.city?.toLowerCase()!=='kuala lumpur'||q.country!=='MY'||!valid(q.checkin)||!valid(q.checkout)||q.checkin<new Date().toISOString().slice(0,10)||q.checkout<=q.checkin||q.checkout>'2027-03-31'||Date.parse(q.checkout)-Date.parse(q.checkin)>14*86400000||q.people!==1||q.area||q.hotelName&&!hotel.name.toLowerCase().includes(q.hotelName.toLowerCase())||q.minNightly||q.maxNightly)throw Error();
   }
  }catch{return reply({code:'C2_QUERY_DENIED',error:'Gate C.2: CGK–KUL/Kuala Lumpur, tanggal mendatang, 1 dewasa dan tanpa filter tambahan.'},400);}
  const cacheKey=createHash('sha256').update(JSON.stringify(q)).digest('hex').slice(0,24),cache=path.join(directory,kind+'-'+cacheKey+'.result.json');
  if(fs.existsSync(cache)){try{const r=JSON.parse(fs.readFileSync(cache,'utf8'));return reply({...r.body,qaStoredLiveResult:true},r.status);}catch{return reply({code:'C2_CACHE_UNAVAILABLE'},503);}}
  if(closed(kind))return reply({code:'C2_PROVIDER_CLOSED',error:'Gate C.2 provider sudah selesai atau batas request tercapai.'},503);
  const key=kind==='flight'?bindings.TRAVELPAYOUTS_API_TOKEN:bindings.LITEAPI_API_KEY;
  if(typeof key!=='string'||key.trim().length<=8)return reply({code:'C2_BINDING_REQUIRED'},503);
  if(kind==='hotel'&&/^(sand_|sandbox_)/i.test(key))return reply({code:'C2_SANDBOX_KEY_REJECTED'},503);
  let reservation;try{reservation=budget.reserve(kind);}catch{return reply({code:'C2_BUDGET_OR_BUSY'},429);}
  const diagnostic={kind,slot:reservation.slot,checkedAt:new Date().toISOString(),query:kind==='hotel'?{hotelId:hotel.id,checkin:q.checkin,checkout:q.checkout,people:1,rooms:1,currency:'IDR'}:q};let result,successful=false;
  try{
   let sent=false;const read=async(target,init={})=>{
    const dest=new URL(target),method=init.method||'GET';const allowed=kind==='flight'?dest.origin==='https://api.travelpayouts.com'&&dest.pathname==='/aviasales/v3/prices_for_dates'&&method==='GET':dest.origin==='https://api.liteapi.travel'&&dest.pathname==='/v3.0/hotels/rates'&&method==='POST';
    if(sent||!allowed||dest.username||dest.password||dest.hash||new Headers(init.headers).has('Authorization')||new Headers(init.headers).has('Cookie'))throw Error('EGRESS_DENIED');sent=true;
    const r=await fetcher(dest.href,{...init,redirect:'manual',signal:AbortSignal.any([AbortSignal.timeout(19000),...(init.signal?[init.signal]:[])])});
    const raw=await supplierJSON(r,kind,diagnostic);
    if(kind==='flight'&&Array.isArray(raw?.data)){diagnostic.acceptedByNormalizer=raw.data.filter(row=>normalize(row,q,q.destination)).length;}
    return raw;
   };
   if(kind==='hotel'){
    assertLiteApiFreeEndpoint('hotels/rates','POST');
    const raw=liteRatesEnvelope(await read('https://api.liteapi.travel/v3.0/hotels/rates',{method:'POST',headers:{'X-API-Key':key,Accept:'application/json','Content-Type':'application/json'},body:JSON.stringify({hotelIds:[hotel.id],checkin:q.checkin,checkout:q.checkout,currency:'IDR',guestNationality:'ID',occupancies:[{adults:1,children:[]}],timeout:12,maxRatesPerHotel:12,includeHotelData:true})}));
    if(diagnostic.sandbox)throw Error('SANDBOX_RESPONSE');if(!Array.isArray(raw?.data))throw Error('DATA_NOT_ARRAY');
    const rejects={},quotes=raw.data.filter(h=>h.hotelId===hotel.id).flatMap(h=>Array.isArray(h.roomTypes)?h.roomTypes:[]).map(o=>checkedLiteOffer(hotel,o,{people:1},{id:'gate-c2-hotel',rooms:1,checkin:q.checkin,checkout:q.checkout},rejects,{allowPayAtProperty:true})).filter(Boolean).map(quote=>({...quote,readOnlyQuote:true})).sort((a,b)=>a.amountIDR-b.amountIDR);
    diagnostic.rejections=rejects;diagnostic.validQuotes=quotes.length;diagnostic.failure=quotes.length?null:raw.noAvailability?'NO_AVAILABILITY':'NO_VALID_QUOTES';successful=quotes.length>0;
    result={status:200,body:{hotels:quotes.slice(0,1),coverage:{checkedHotels:1,partial:false},source:'LiteAPI',currency:'IDR',rooms:1,people:1,checkin:q.checkin,checkout:q.checkout,qaLiveSupplier:true}};
   }else{
    const r=await searchFlights(q,{TRAVELPAYOUTS_API_TOKEN:key},{waitUntil(){}},{cache:null,fetcher:async(u,i)=>Response.json(await read(u,i))});const data=await r.json();diagnostic.validFlights=data.flights?.length||0;diagnostic.failure=r.ok?(diagnostic.validFlights?null:'NO_MATCHING_FLIGHTS'):diagnostic.failure||'FLIGHT_ADAPTER_REJECTED';successful=r.ok&&diagnostic.validFlights>0;result={status:r.status,body:{...data,indicative:true,qaLiveSupplier:true}};
   }
  }catch(e){const safe=['HTTP_ERROR','JSON_OR_STREAM_ERROR','SANDBOX_RESPONSE','DATA_NOT_ARRAY','EGRESS_DENIED','lite_rates_invalid_envelope','lite_rates_api_error','lite_production_required'];diagnostic.failure=safe.includes(e?.message)?e.message:diagnostic.failure||'TRANSPORT_OR_VALIDATOR_ERROR';result={status:502,body:{code:'C2_SUPPLIER_UNAVAILABLE',error:'Hasil supplier belum dapat diverifikasi. Periksa diagnostik Gate C.2.',errorKey:'hotel_search_unavailable'}};}
  finally{try{persist(kind+'-'+reservation.slot+'.diagnostic.json',diagnostic);}finally{reservation.release();}}
  persist(path.basename(cache),result);if(successful)persist(kind+'.success',{checkedAt:new Date().toISOString()});
  if([401,403,429].includes(diagnostic.http)||['UNAUTHORIZED','ACCOUNT_SUSPENDED','RATE_LIMIT','RATE_LIMIT_SYSTEM'].includes(diagnostic.apiErrorCategory))persist(kind+'.blocked',{http:diagnostic.http});
  return reply(result.body,result.status);
 }};
}
