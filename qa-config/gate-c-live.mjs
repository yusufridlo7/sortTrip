import fs from 'node:fs';
import path from 'node:path';
import {parseQuery,searchFlights} from '../worker/index.js';
import {checkedLiteOffer} from '../worker/lite-hotel.js';
import {boundedBytes} from '../lib/video-itinerary.mjs';
import {gateCBudget,gateCTransport} from './gate-c-budget.mjs';
import {localGateBSession} from './gate-b-session.mjs';
import {QA_LOCAL_ORIGIN} from './gate-a.mjs';
const hotel={id:'lp65706cc6',name:'Kingston Hotel 1 - Bukit Bintang',city:'Kuala Lumpur',country:'MY',address:'74 - 76 Jalan Bukit Bintang',latitude:3.145779,longitude:101.70981};
export function createGateCLive(config,{directory,bindings,fetcher=fetch,authFetcher=fetch,verify=localGateBSession}={}){
 const budget=gateCBudget(directory),transport=gateCTransport(budget,async(u,i)=>{
  const kind=new URL(u).hostname==='api.travelpayouts.com'?'flight':'hotel';
  const r=await fetcher(u,i);fs.writeFileSync(path.join(directory,kind+'.http.json'),JSON.stringify({http:r.status,checkedAt:new Date().toISOString()}));return r;
 });
 const used=k=>fs.existsSync(path.join(directory,k+'.claimed'));
 const enabled=()=>!fs.existsSync(path.join(directory,'closed'))&&(!used('flight')||!used('hotel'));
 const reply=(body,status=200)=>Response.json(body,{status,headers:{'Cache-Control':'no-store'}});
 return {enabled,async handle(req,body,connection){
  const u=new URL(req.url),kind=u.pathname==='/api/flights'?'flight':u.pathname==='/api/hotels/search'?'hotel':null;
  if(!kind)return reply({code:'GATE_C_ROUTE_DENIED'},404);
  if(connection.host!=='127.0.0.1:5176'||!['127.0.0.1','::ffff:127.0.0.1','::1'].includes(connection.remoteAddress)||(req.headers.get('Origin')!==QA_LOCAL_ORIGIN&&!(req.headers.get('Origin')===null&&req.headers.get('Sec-Fetch-Site')==='same-origin')))return reply({code:'GATE_C_ORIGIN_DENIED'},403);
  const owner=await verify({url:QA_LOCAL_ORIGIN+'/api/staging/session',host:connection.host,origin:QA_LOCAL_ORIGIN,remoteAddress:connection.remoteAddress,authorization:req.headers.get('Authorization'),method:'POST'},config,{enabled:true,fetcher:authFetcher});
  if(!owner.ok)return owner;
  let q;
  try{
   if(kind==='flight'){
    if(req.method!=='GET')throw Error();q=parseQuery(req.url);
    if(q.origin!=='CGK'||!['kl','KUL'].includes(q.destination)||q.journey!=='return'||q.outFrom!=='2026-11-10'||q.outTo!==q.outFrom||q.backFrom!=='2026-11-12'||q.backTo!==q.backFrom||q.minDays!==3||q.maxDays!==3||q.page!==1)throw Error();
   }else{
    if(req.method!=='POST')throw Error();q=JSON.parse(body);
    if(q.city?.toLowerCase()!=='kuala lumpur'||q.country!=='MY'||q.checkin!=='2026-11-10'||q.checkout!=='2026-11-12'||q.people!==1||q.area||q.hotelName&&!hotel.name.toLowerCase().includes(q.hotelName.toLowerCase())||q.minNightly||q.maxNightly)throw Error();
   }
  }catch{return reply({code:'GATE_C_FIXED_QUERY_REQUIRED',error:'Gate C: gunakan CGK–KUL / Kuala Lumpur, 10–12 November 2026, 3 hari, 1 dewasa; tanpa filter harga/area.'},400);}
  const cache=path.join(directory,kind+'.result.json');
  if(fs.existsSync(cache)){try{const c=JSON.parse(fs.readFileSync(cache,'utf8'));return reply({...c.body,qaStoredLiveResult:true},c.status);}catch{return reply({code:'GATE_C_RESULT_UNAVAILABLE'},503);}}
  if(!enabled()||used(kind))return reply({code:'GATE_C_REQUEST_USED',error:'Gate C request sudah terpakai; tidak diulang.'},503);
  const key=kind==='flight'?bindings.TRAVELPAYOUTS_API_TOKEN:bindings.LITEAPI_API_KEY;
  if(typeof key!=='string'||key.trim().length<=8)return reply({code:'GATE_C_BINDING_REQUIRED'},503);
  if(kind==='hotel'&&/^(sand_|sandbox_)/i.test(key))return reply({code:'GATE_C_PRODUCTION_RATES_KEY_REQUIRED'},503);
  let result;
  try{
   if(kind==='flight'){
    const r=await searchFlights(q,{TRAVELPAYOUTS_API_TOKEN:key},{waitUntil(){}},{fetcher:transport,cache:null});
    result={status:r.status,body:{...await r.json(),qaLiveSupplier:true,indicative:true}};
   }else{
    const r=await transport('https://api.liteapi.travel/v3.0/hotels/rates',{method:'POST',headers:{'X-API-Key':key,Accept:'application/json','Content-Type':'application/json'},body:JSON.stringify({hotelIds:[hotel.id],checkin:q.checkin,checkout:q.checkout,currency:'IDR',guestNationality:'ID',occupancies:[{adults:1,children:[]}],timeout:12,maxRatesPerHotel:4,includeHotelData:true})});
    if(!r.ok){await r.body?.cancel();throw Error();}
    const data=JSON.parse(new TextDecoder().decode(await boundedBytes(r.body,6000000,AbortSignal.timeout(19000))));
    if(!Array.isArray(data.data)||[true,1,'true','1'].includes(data.sandbox))throw Error();
    const offers=data.data.filter(h=>h.hotelId===hotel.id).flatMap(h=>Array.isArray(h.roomTypes)?h.roomTypes:[]);
    const quotes=offers.map(o=>checkedLiteOffer(hotel,o,{people:1},{id:'gate-c-hotel',rooms:1,checkin:q.checkin,checkout:q.checkout})).filter(Boolean).sort((a,b)=>a.amountIDR-b.amountIDR);
    result={status:200,body:{hotels:quotes.slice(0,1),coverage:{checkedHotels:1,partial:false},source:'LiteAPI',currency:'IDR',rooms:1,people:1,checkin:q.checkin,checkout:q.checkout,qaLiveSupplier:true}};
   }
  }catch{result={status:502,body:{code:'GATE_C_UPSTREAM_FAILED',error:'Supplier belum memberikan hasil terverifikasi. Request tidak diulang.',errorKey:'hotel_search_unavailable'}};}
  try{fs.writeFileSync(cache,JSON.stringify(result),{flag:'wx'});}catch{}
  if(used('flight')&&used('hotel')){try{fs.writeFileSync(path.join(directory,'closed'),'Live supplier testing complete. Do not reset.\n',{flag:'wx'});}catch{}}
  return reply(result.body,result.status);
 }};
}
