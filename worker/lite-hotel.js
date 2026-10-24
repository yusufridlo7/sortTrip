import {airportStayPolicy,withinAirportScope} from './hotel-stay-policy.mjs';
// Supplier facts are deterministic API data, never model-generated prices/IDs.
import {assertLiteApiFreeEndpoint} from './liteapi-cost-policy.js';
import {hotelPreview} from './hotel-content.js';
export const LITE_HOTEL_SOURCE='https://docs.liteapi.travel/reference/post_hotels-rates';
export function liteHotelConfigured(env){return env.LITEAPI_ENABLED==='true'&&typeof env.LITEAPI_API_KEY==='string'&&env.LITEAPI_API_KEY.length>8&&!/^(sand_|sandbox_)/i.test(env.LITEAPI_API_KEY);}
const clean=v=>String(v||'').normalize('NFKD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,' ').trim();
const countries={malaysia:'MY',singapore:'SG',singapura:'SG',thailand:'TH',indonesia:'ID',japan:'JP',jepang:'JP',vietnam:'VN',philippines:'PH',filipina:'PH',china:'CN',taiwan:'TW','south korea':'KR','korea selatan':'KR',australia:'AU','united kingdom':'GB',inggris:'GB',france:'FR',prancis:'FR',italy:'IT',italia:'IT','united states':'US','amerika serikat':'US'};
const cityAliases={singapura:'Singapore',melaka:'Melaka','george town penang':'George Town'};
const safeId=v=>typeof v==='string'&&/^[a-zA-Z0-9_-]{1,100}$/.test(v);
const date=v=>/^\d{4}-\d{2}-\d{2}$/.test(v||'')&&Number.isFinite(Date.parse(v+'T12:00:00Z'))&&new Date(v+'T12:00:00Z').toISOString().slice(0,10)===v;
const amount=v=>Number.isFinite(Number(v))&&Number(v)>0&&Number(v)<=1e9;
function scope(q,t){
 const dayCity=q.dailyCities?.find(x=>x.day===t.day);
 const city=t.airportScope===true?'Sepang':cityAliases[clean(t.city||dayCity?.city||q.city)]||t.city||dayCity?.city||q.city;
 const c=dayCity?.country||q.country,country=/^[A-Z]{2}$/.test(c||'')?c:countries[clean(c)];
 if(t.airportScope&&country!=='MY')return null;
 if(!city||!country||!date(t.checkin)||!date(t.checkout)||t.checkin>=t.checkout||t.checkin<q.start||Date.parse(t.checkout)>Date.parse(q.start)+(q.days-1)*86400000||Date.parse(t.checkout)-Date.parse(t.checkin)>31*86400000)return null;
 if(!Number.isInteger(q.people)||q.people<1||q.people>8||t.rooms!==Math.ceil(q.people/2))return null;
 return {city,country};
}
export function groupHotelAreas(plan,q){
 const at=d=>new Date(Date.parse(q.start+'T12:00:00Z')+(d-1)*86400000).toISOString().slice(0,10);
 const retainedNight=a=>(q.retained||[]).some(r=>{
  if(r.category!=='Penginapan'||!Number.isInteger(r.day)||r.day<1||r.day>q.days)return false;
  const checkin=date(r.checkin)?r.checkin:at(r.day),checkout=date(r.checkout)?r.checkout:at(r.day+1);
  return checkin<=at(a.day)&&checkout>at(a.day);
 });
 const protectedIds=new Set(plan.activities.filter(a=>a.category==='Area menginap'&&retainedNight(a)).map(a=>a.id));
 const airport=airportStayPolicy(q);
 const airportSource='https://www.samasamahotels.com/location-map/'; // Geographic KLIA/Sepang reference only; not a hotel selection.
 const scoped=plan.activities.map(a=>a.category==='Area menginap'&&a.day===airport?.day?{...a,city:airport.city,title:airport.area,location:airport.area,airportScope:true,sourceUrl:airportSource,note:q.language==='en'?'Requested final night near KLIA. Check terminal access and onward transport.':'Permintaan malam terakhir dekat KLIA. Periksa akses terminal dan transportasi selanjutnya.'}:a);
 const lodging=scoped.filter(a=>a.category==='Area menginap'&&!protectedIds.has(a.id)).sort((a,b)=>a.day-b.day);
 const groups=[];
 for(const a of lodging){
  const previous=groups.at(-1),key=clean(a.city||q.city)+'|'+clean(a.location||a.title);
  if(previous&&previous.key===key&&previous.lastDay+1===a.day){previous.lastDay=a.day;previous.ids.push(a.id);previous.activity.checkout=at(a.day+1);}
  else groups.push({key,lastDay:a.day,ids:[a.id],activity:{...a,checkin:at(a.day),checkout:at(a.day+1)}});
 }
 const grouped=new Map(groups.map(g=>[g.ids[0],g.activity])),removed=new Set([...protectedIds,...groups.flatMap(g=>g.ids.slice(1))]);
 return {...plan,...(airport&&scoped.some(a=>a.airportScope)?{sources:[...(plan.sources||[]).filter(s=>s.url!==airportSource),{url:airportSource,title:'KLIA / Sepang location reference'}]}:{}),activities:scoped.filter(a=>!removed.has(a.id)).map(a=>grouped.get(a.id)||a)};
}
// Require public standard rates, full occupancy, IDR and an explicit tax breakdown.
export function checkedLiteOffer(hotel,offer,q,t,diagnostics,{memberCheckout=false}={}){
 const reject=reason=>{if(diagnostics)diagnostics[reason]=(diagnostics[reason]||0)+1;return null;};
 if(offer?.rateType!=='standard')return reject('rate_type');
 if(!safeId(hotel?.id||hotel?.hotelId)||typeof hotel.name!=='string'||!hotel.name.trim()||hotel.name.length>160)return reject('hotel_identity');
 const rates=offer.rates;if(!Array.isArray(rates)||rates.length!==t.rooms)return reject('room_count');
 let total=0,guests=0;const roomNames=[],policies=[];
 for(const r of rates){
  if(!Number.isInteger(r.adultCount)||r.adultCount<1||r.childCount!==0||!Number.isInteger(r.occupancyNumber))return reject('occupancy');
  if(typeof r.name!=='string'||!r.name.trim()||r.name.length>160)return reject('room_name');
  guests+=r.adultCount;
  const retail=r.retailRate?.total,publicPrice=r.retailRate?.suggestedSellingPrice,taxes=r.retailRate?.taxesAndFees;
  if(!Array.isArray(retail)||retail.length!==1||retail[0].currency!=='IDR'||!amount(retail[0].amount))return reject('total');
  if(!Array.isArray(taxes)||taxes.some(tax=>tax.included!==true))return reject('taxes');
  if(!Array.isArray(publicPrice)||publicPrice.length!==1||publicPrice[0].currency!=='IDR'||!amount(publicPrice[0].amount))return reject('public_price');
  // Public discovery respects SSP. Authenticated member checkout must match the
  // supplier's actual payable total (account margin is already included there).
  total+=memberCheckout?Number(retail[0].amount):Math.max(Number(retail[0].amount),Number(publicPrice[0].amount));
  roomNames.push(r.name);const policy=r.cancellationPolicies?.refundableTag;
  if(!['RFN','NRFN'].includes(policy))return reject('cancellation');policies.push(policy);
 }
 if(guests!==q.people||new Set(rates.map(r=>r.occupancyNumber)).size!==t.rooms||!amount(total))return reject('occupancy_total');
 const geo=hotel.location||hotel;
 return {id:t.id,provider:'LiteAPI',scope:'dated',basis:'stay_total',amountIDR:Math.round(total*100)/100,sourceUrl:LITE_HOTEL_SOURCE,quote:'LiteAPI: '+hotel.name+' · IDR '+(Math.round(total*100)/100)+' · '+t.checkin+' → '+t.checkout+' · '+t.rooms+' room(s), '+q.people+' adults',checkedAt:new Date().toISOString(),checkin:t.checkin,checkout:t.checkout,adults:q.people,rooms:t.rooms,taxesIncluded:true,roomType:[...new Set(roomNames)].join(' / '),policy:policies.every(p=>p==='RFN')?'RFN':'NRFN',hotelId:hotel.id||hotel.hotelId,hotelName:hotel.name,hotelArea:t.area&&clean([hotel.address,hotel.name].join(' ')).includes(clean(t.area))?t.area:'',selection:'lowest_checked_public_total',...(Number.isFinite(geo.latitude)&&Number.isFinite(geo.longitude)&&Math.abs(geo.latitude)<=90&&Math.abs(geo.longitude)<=180?{geo:{lat:geo.latitude,lng:geo.longitude}}:{})};
}
export function selectHotelPool(hotels){
 const bands=[[],[],[],[]];
 for(const h of hotels){const s=hotelPreview(h).stars;bands[s===null?3:s<=3?0:s<5?1:2].push(h);}
 const chosen=[...bands[0].slice(0,100),...bands[1].slice(0,60),...bands[2].slice(0,40)];
 const seen=new Set(chosen.map(h=>h.id||h.hotelId));
 for(const h of hotels){if(chosen.length>=200)break;const id=h.id||h.hotelId;if(!seen.has(id)){chosen.push(h);seen.add(id);}}
 return chosen;
}
export async function liteHotelPrices(q,targets,env,deadline=Date.now()+45000,diagnostics={},fetcher=fetch){
 if(!liteHotelConfigured(env))return [];
 const cache=new Map(),quotes=[];
 async function api(path,body){
  assertLiteApiFreeEndpoint(path,body?'POST':'GET');
  const remaining=deadline-Date.now();if(remaining<1000){diagnostics.liteHotelUnavailable=true;return null;}
  try{const response=await fetcher('https://api.liteapi.travel/v3.0/'+path,{method:body?'POST':'GET',redirect:'manual',signal:AbortSignal.timeout(Math.min(18000,remaining)),headers:{'X-API-Key':env.LITEAPI_API_KEY,Accept:'application/json',...(body?{'Content-Type':'application/json'}:{})},...(body?{body:JSON.stringify(body)}:{})});
   if(!response.ok){diagnostics.liteHotelUnavailable=true;return null;}const text=await response.text();if(text.length>6000000){diagnostics.liteHotelUnavailable=true;return null;}const data=JSON.parse(text);if([true,1,'true','1'].includes(data.sandbox)){diagnostics.liteHotelSandbox=true;return null;}if(!Array.isArray(data.data)){diagnostics.liteHotelUnavailable=true;return null;}return data;
  }catch{diagnostics.liteHotelUnavailable=true;return null;}
 }
 for(const t of targets.filter(t=>t.category==='Penginapan').slice(0,6)){
  const location=scope(q,t);if(!location)continue;
  if(t.searchAny===true&&(t.maxNightIDR||t.airportScope)&&!t.hotelId){
   // Use the same city/rates discovery as the native search form. Sampling
   // the first catalogue hotels can miss real budget stock available there.
   try{
    const {discoverHotelRates}=await import('./hotel-discovery.js');
    const key='discovery|'+JSON.stringify([location,t.checkin,t.checkout,q.people,t.maxNightIDR,t.airportScope,t.area]);
    if(!cache.has(key))cache.set(key,await discoverHotelRates({city:location.city,country:location.country,checkin:t.checkin,checkout:t.checkout,people:q.people,airportScope:t.airportScope,area:t.airportScope?'':(t.maxNightIDR?'':t.area),hotelName:'',tier:'all',minNightly:0,maxNightly:t.maxNightIDR},env,fetcher,deadline));
    const result=cache.get(key),candidates=result.hotels.filter(h=>(!t.airportScope||withinAirportScope(h.geo))&&(!t.maxNightExclusive||h.amountIDR/((Date.parse(t.checkout)-Date.parse(t.checkin))/86400000)/t.rooms<t.maxNightIDR)).map(h=>({...h,id:t.id}));
    diagnostics.liteHotelCandidates=candidates.slice(0,12);
    if(result.coverage.partial)diagnostics.liteHotelUnavailable=true;
    if(candidates[0])quotes.push(candidates[0]);
   }catch{diagnostics.liteHotelUnavailable=true;}
   continue;
  }
  let hotels;
  if(t.hotelId&&safeId(t.hotelId)){
   const result=await api('data/hotels?'+new URLSearchParams({hotelIds:t.hotelId,limit:'1'}));hotels=(result?.data||[]).filter(h=>(h.id||h.hotelId)===t.hotelId&&clean(h.name)===clean(t.title));
  }else{
   const cacheKey=location.country+'|'+location.city;
   if(!cache.has(cacheKey)){const result=await api('data/hotels?'+new URLSearchParams({countryCode:location.country,cityName:location.city,limit:'1000'}));cache.set(cacheKey,Array.isArray(result?.data)?result.data:[]);}
   const area=clean(t.area).replace(clean(location.city),'').trim();
   hotels=cache.get(cacheKey).filter(h=>t.searchAny===true&&t.maxNightIDR?true:area?clean([h.address,h.name].join(' ')).includes(area):t.searchAny===true||clean(h.name)===clean(t.title));
  }
  hotels=selectHotelPool(hotels.filter(h=>safeId(h.id||h.hotelId)&&(!h.country||clean(h.country)===clean(location.country))&&(!h.city||clean(cityAliases[clean(h.city)]||h.city)===clean(location.city))));if(!hotels.length)continue;
  const occupancies=Array.from({length:t.rooms},(_,i)=>({adults:Math.min(2,q.people-i*2),children:[]}));
  const result=await api('hotels/rates',{hotelIds:hotels.map(h=>h.id||h.hotelId),checkin:t.checkin,checkout:t.checkout,currency:'IDR',guestNationality:'ID',occupancies,timeout:12,maxRatesPerHotel:4});
  const offers=(Array.isArray(result?.data)?result.data:[]).flatMap(h=>{const hotel=hotels.find(v=>(v.id||v.hotelId)===h.hotelId);return hotel?(h.roomTypes||[]).map(offer=>checkedLiteOffer(hotel,offer,q,t)).filter(Boolean):[];}).filter(o=>{if(!t.maxNightIDR)return true;const nights=(Date.parse(t.checkout)-Date.parse(t.checkin))/86400000;const perNight=o.amountIDR/nights/t.rooms;return t.maxNightExclusive?perNight<t.maxNightIDR:perNight<=t.maxNightIDR;}).sort((a,b)=>a.amountIDR-b.amountIDR||a.hotelId.localeCompare(b.hotelId));
  const distinct=[...new Map(offers.map(o=>[o.hotelId,offers.find(v=>v.hotelId===o.hotelId)])).values()].map(o=>({...o,...hotelPreview(hotels.find(h=>(h.id||h.hotelId)===o.hotelId)||{}),hotelCity:location.city,checkedHotelCount:hotels.length,matchedOfferCount:offers.length,bookingUrl:liteHotelLink(env,o)}));
  if(t.searchAny===true)diagnostics.liteHotelCandidates=distinct.slice(0,12);
  if(distinct[0])quotes.push(distinct[0]);
 }
 return quotes;
}
export function liteHotelLink(env,quote){
 try{const base=new URL(env.LITEAPI_WHITELABEL_URL);if(base.protocol!=='https:'||base.username||base.password||base.port||base.search||base.hash||base.pathname!=='/'||!/[a-z]/i.test(base.hostname)||/^(localhost|127\.|0\.|10\.|192\.168\.|169\.254\.|172\.(?:1[6-9]|2\d|3[01])\.|\[|.*\.local$)/i.test(base.hostname)||!safeId(quote.hotelId)||!date(quote.checkin)||!date(quote.checkout))return null;
  const u=new URL('/hotels/'+quote.hotelId,base);const occupancies=Array.from({length:quote.rooms},(_,i)=>({adults:Math.min(2,quote.adults-i*2),children:[]}));
  u.search=new URLSearchParams({checkin:quote.checkin,checkout:quote.checkout,occupancies:btoa(JSON.stringify(occupancies))}).toString();return u.href;
 }catch{return null;}
}
export function applyLiteHotels(plan,prices){
 const quotes=new Map(prices.filter(p=>p.provider==='LiteAPI').map(p=>[p.id,p]));
 const activities=plan.activities.map(a=>{
  const price=quotes.get('ai-plan-'+a.id);if(!price||a.category!=='Area menginap')return a;
  return {...a,category:'Penginapan',title:price.hotelName,location:price.hotelName,sourceUrl:LITE_HOTEL_SOURCE,hotelId:price.hotelId,provider:'LiteAPI',hotelArea:price.hotelArea,geo:price.geo};
 });
 return {...plan,activities,sources:prices.some(p=>p.provider==='LiteAPI')?[...plan.sources.filter(s=>s.url!==LITE_HOTEL_SOURCE),{url:LITE_HOTEL_SOURCE,title:'LiteAPI hotel rate data'}]:plan.sources};
}
