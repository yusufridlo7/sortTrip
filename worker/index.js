import {handlePayments} from './payments.js';
import {runPriceWatches} from './price-watch.js';
import {handleItinerary} from './itinerary.js';
import {handleViator} from './viator.js';
import locations from './locations.json' with {type:'json'};
// Tokens stay in Worker runtime secrets, never in the Vite bundle.
const routes = {kl: 'KUL', bkk: 'BKK', sin: 'SIN'};
const day = s => /^\d{4}-\d{2}-\d{2}$/.test(s || '') && Number.isFinite(Date.parse(s)) && new Date(s).toISOString().slice(0,10) === s;
const difference = (a,b) => Math.round((Date.parse(b)-Date.parse(a))/86400000);
const json = (data,status=200) => Response.json(data,{status,headers:{'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}});
export function parseQuery(url) {
 const p = new URL(url).searchParams;
 const q = Object.fromEntries(['origin','destination','outFrom','outTo','backFrom','backTo','journey'].map(k=>[k,p.get(k)||'']));
 q.page=Number(p.get('page')||1);if(!Number.isInteger(q.page)||q.page<1||q.page>20)throw Error('Halaman pencarian tidak valid.');
 q.scope=p.get('scope')==='all'?'all':'international';
 q.minDays=Number(p.get('minDays'));q.maxDays=Number(p.get('maxDays'));
 if(!['CGK','SUB','DPS'].includes(q.origin)||!(q.destination==='all'||routes[q.destination]||/^[A-Z]{3}$/.test(q.destination)&&locations[q.destination])||!['oneway','return'].includes(q.journey)) throw Error('Kota atau jenis perjalanan tidak valid.');
 if(![q.outFrom,q.outTo,q.backFrom,q.backTo].every(day)||q.outFrom>q.outTo||q.backFrom>q.backTo||difference(q.outFrom,q.outTo)>366||q.outFrom<new Date().toISOString().slice(0,10)) throw Error('Gunakan tanggal mendatang dan rentang maksimal satu tahun.');
 if(!Number.isSafeInteger(q.minDays)||!Number.isSafeInteger(q.maxDays)||q.minDays<1||q.minDays>q.maxDays) throw Error('Durasi harus berupa jumlah hari positif.');
 return q;
}
const dateFormatters=new Map();
function localDate(value, zone) {let f=dateFormatters.get(zone);if(!f){f=new Intl.DateTimeFormat('en-CA',{timeZone:zone,year:'numeric',month:'2-digit',day:'2-digit'});dateFormatters.set(zone,f);}return f.format(new Date(value));}
export function normalize(row,q,id) {
 const origin=row.origin_airport||row.origin, dest=row.destination_airport||row.destination;
 const meta=locations[dest]||locations[row.destination];
 const target=routes[id]||id;
 if(origin!==q.origin||!meta||q.scope!=='all'&&meta.country==='ID'||id!=='all'&&dest!==target&&meta.cityCode!==target||!Number.isFinite(row.price)||row.price<=0) return null;
 if(!/(Z|[+-]\d\d:\d\d)$/.test(row.departure_at||'')||!Number.isFinite(Date.parse(row.departure_at))) return null;
 const start=localDate(row.departure_at,q.origin==='DPS'?'Asia/Makassar':'Asia/Jakarta');
 if(start<q.outFrom||start>q.outTo||Date.parse(row.departure_at)<Date.now())return null;
 let end='',days=q.minDays;
 if(q.journey==='return'){
  if(!/(Z|[+-]\d\d:\d\d)$/.test(row.return_at||'')||!Number.isFinite(Date.parse(row.return_at)))return null;
  end=meta.zone?localDate(row.return_at,meta.zone):row.return_at.slice(0,10);days=difference(start,end)+1;
  if(end<q.backFrom||end>q.backTo||days<q.minDays||days>q.maxDays||Date.parse(row.return_at)<=Date.parse(row.departure_at))return null;
 } else if(row.return_at) return null;
 if(row.expires_at&&Date.parse(row.expires_at)<=Date.now())return null;
 let url;try{url=new URL(row.link,'https://www.aviasales.com');if(url.origin!=='https://www.aviasales.com'||!url.pathname.startsWith('/search/')||url.username||url.password) return null;}catch{return null;}
 // One-adult price and provider-generated one-adult search URL are kept together.
 return {id:[origin,dest,row.departure_at,row.return_at||'',row.airline,row.flight_number,row.price].join('|'),destinationId:({KUL:'kl',BKK:'bkk',SIN:'sin'}[meta.cityCode]||meta.cityCode),city:meta.city,country:countryName(meta.country),countryCode:meta.country,cityCode:meta.cityCode,destinationZone:meta.zone,origin,destination:dest,start,end,days,price:row.price,airline:String(row.airline||'Tidak tersedia').slice(0,60),flightNumber:String(row.flight_number||'').slice(0,16),departureAt:row.departure_at,returnAt:q.journey==='return'?row.return_at:null,durationTo:Number.isFinite(row.duration_to)&&row.duration_to>0?row.duration_to:null,durationBack:Number.isFinite(row.duration_back)&&row.duration_back>0?row.duration_back:null,transfers:Number.isInteger(row.transfers)?row.transfers:null,bookingUrl:url.toString()};
}
export async function searchFlights(q,env,ctx,{fetcher=fetch,cache=globalThis.caches?.default}={}) {
 if(!env.TRAVELPAYOUTS_API_TOKEN)return json({error:'API belum dikonfigurasi. Tambahkan Secret TRAVELPAYOUTS_API_TOKEN pada Settings Worker, di luar Build.'},503);
 const ids=[q.destination];
 const results=await Promise.allSettled(ids.map(async id=>{
  const u=new URL('https://api.travelpayouts.com/aviasales/v3/prices_for_dates');
  Object.entries({origin:q.origin,currency:'idr',one_way:String(q.journey==='oneway'),unique:'false',sorting:'price',limit:'250',page:String(q.page||1)}).forEach(([k,v])=>u.searchParams.set(k,v));
  if(id!=='all')u.searchParams.set('destination',routes[id]||id);
  if(q.outFrom===q.outTo)u.searchParams.set('departure_at',q.outFrom);
  else if(q.outFrom.slice(0,7)===q.outTo.slice(0,7))u.searchParams.set('departure_at',q.outFrom.slice(0,7));
  if(q.journey==='return'&&q.backFrom===q.backTo)u.searchParams.set('return_at',q.backFrom);
  // Cache only sanitized provider responses; token is never part of URL/cache key.
  const key=new Request('https://sorttrip-cache.invalid/v2?'+u.searchParams);
  let data=await cache?.match(key).then(r=>r?.json());
  if(!data){
   const r=await fetcher(u,{headers:{'X-Access-Token':env.TRAVELPAYOUTS_API_TOKEN},signal:AbortSignal.timeout(12000)});
   if(!r.ok)throw Error(r.status===401||r.status===403?'ACCESS':r.status===429?'LIMIT':'UPSTREAM');
   const raw=await r.json();
   if(raw.success!==true||!Array.isArray(raw.data))throw Error('UPSTREAM');
   if(String(raw.currency||'').toLowerCase()!=='idr')throw Error('CURRENCY');
   // Whitelist fields before caching; never forward provider errors to visitors.
   const fields=['origin','origin_airport','destination','destination_airport','price','airline','flight_number','departure_at','return_at','duration_to','duration_back','transfers','link','expires_at'];
   data={currency:'idr',fetchedAt:new Date().toISOString(),rows:raw.data.slice(0,250).map(row=>Object.fromEntries(fields.map(k=>[k,row[k]])))};
   if(cache)ctx.waitUntil(cache.put(key,new Response(JSON.stringify(data),{headers:{'Content-Type':'application/json','Cache-Control':'public, max-age=900'}})));
  }
  return {id,fetchedAt:data.fetchedAt,limited:data.rows.length>=250,flights:data.rows.map(row=>normalize(row,q,id)).filter(Boolean)};
 }));
 const ok=results.filter(r=>r.status==='fulfilled').map(r=>r.value);
 if(!ok.length){const errors=results.map(r=>r.reason?.message);return json({error:errors.includes('ACCESS')?'Token ditolak atau akses API belum tersedia. Periksa token dan akun Travelpayouts.':errors.includes('LIMIT')?'Batas permintaan penyedia tercapai. Coba beberapa saat lagi.':errors.includes('CURRENCY')?'Penyedia belum mengembalikan harga IDR yang dapat diverifikasi.':'Penyedia belum dapat dihubungi. Silakan coba lagi.'},502);}
 const flights=[...new Map(ok.flatMap(r=>r.flights).map(f=>[f.id,f])).values()].sort((a,b)=>a.price-b.price);
 return json({flights,source:'Aviasales Data API',currency:'IDR',fetchedAt:ok.map(r=>r.fetchedAt).sort()[0],partial:ok.length!==ids.length,limited:ok.some(r=>r.limited),nextPage:ok.some(r=>r.limited)&&(q.page||1)<20?(q.page||1)+1:null,oneAdult:true});
}
export default {async scheduled(event,env,ctx){ctx.waitUntil(runPriceWatches(env,ctx,searchFlights));},async fetch(request,env,ctx){
 const u=new URL(request.url);
 if(!u.pathname.startsWith('/api/'))return env.ASSETS.fetch(request);
 if(u.pathname.startsWith('/api/payments/'))return handlePayments(request,env);
 if(u.pathname==='/api/itinerary')return handleItinerary(request,env);
 if(u.pathname==='/api/activities'||u.pathname.startsWith('/api/activities/'))return handleViator(request,env);
 if(request.method!=='GET')return json({error:'Metode tidak didukung.'},405);
 if(u.pathname==='/api/health')return json({ok:true,aiConfigured:Boolean(env.OPENAI_API_KEY&&env.SUPABASE_URL&&env.SUPABASE_PUBLISHABLE_KEY&&env.SUPABASE_SERVICE_ROLE_KEY&&env.AI_LIMITER),flightsConfigured:Boolean(env.TRAVELPAYOUTS_API_TOKEN),version:'flights-v2-worldwide'});
 if(u.pathname==='/api/locations')return json({locations:searchLocations(u.searchParams.get('q')||'')});
 if(u.pathname!=='/api/flights')return json({error:'Endpoint tidak ditemukan.'},404);
 let q;try{q=parseQuery(u);}catch(e){return json({error:e.message},400);}
 try{return await searchFlights(q,env,ctx);}catch{return json({error:'Pencarian belum dapat diproses. Coba lagi.'},502);}
}};

const countryLabels=new Map();
const regionNames=new Intl.DisplayNames(['id'],{type:'region'});
function countryName(code){if(!countryLabels.has(code)){try{countryLabels.set(code,regionNames.of(code)||code);}catch{countryLabels.set(code,code);}}return countryLabels.get(code);}
export function searchLocations(query){
 const text=query.trim().toLowerCase();if(text.length<2)return [];
 const aliases={bali:'DPS',jakarta:'JKT',bangkok:'BKK','kuala lumpur':'KUL',tokyo:'TYO',singapore:'SIN',singapura:'SIN'};
 const rank=([code,m])=>code.toLowerCase()===text?0:code===aliases[text]?1:m.city.toLowerCase()===text?2:m.city.toLowerCase().startsWith(text)?3:m.city.toLowerCase().includes(text)?4:5;
 return Object.entries(locations).filter(([code,m])=>code.toLowerCase().includes(text)||m.city.toLowerCase().includes(text)||m.name.toLowerCase().includes(text)||countryName(m.country).toLowerCase().includes(text))
 .sort((a,b)=>rank(a)-rank(b)||a[1].city.localeCompare(b[1].city)||a[0].localeCompare(b[0]))
 .slice(0,25).map(([code,m])=>({code,city:m.city,name:m.name,country:countryName(m.country)}));
}
