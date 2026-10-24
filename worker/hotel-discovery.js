import {KLIA_SCOPE,withinAirportScope} from './hotel-stay-policy.mjs';
import {checkedLiteOffer,liteHotelLink} from './lite-hotel.js';
import {hotelPreview} from './hotel-content.js';
import {assertLiteApiFreeEndpoint} from './liteapi-cost-policy.js';
const safeId=v=>typeof v==='string'&&/^[A-Za-z0-9_-]{1,100}$/.test(v);
const norm=v=>String(v||'').normalize('NFKD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,' ').trim();
// City searches include an explicit budget-hotel pass so catalogue order cannot
// hide economy properties. At most two rate calls and one metadata fallback.
export async function discoverHotelRates(q,env,fetcher=fetch,outerDeadline=Infinity){
 const deadline=Math.min(Date.now()+42000,outerDeadline);
 async function api(path,body){
  assertLiteApiFreeEndpoint(path,body?'POST':'GET');
  const remaining=deadline-Date.now();if(remaining<1000)throw Error('hotel_search_unavailable');
  const r=await fetcher('https://api.liteapi.travel/v3.0/'+path,{method:body?'POST':'GET',redirect:'manual',headers:{'X-API-Key':env.LITEAPI_API_KEY,Accept:'application/json',...(body?{'Content-Type':'application/json'}:{})},...(body?{body:JSON.stringify(body)}:{}),signal:AbortSignal.timeout(Math.min(19000,remaining))});
  if(!r.ok)throw Error('hotel_search_unavailable');const raw=await r.text();if(raw.length>6000000)throw Error('hotel_search_unavailable');
  const data=JSON.parse(raw);if([true,1,'true','1'].includes(data.sandbox))throw Error('lite_production_required');
  if(!Array.isArray(data.data))throw Error('hotel_search_unavailable');return data;
 }
 const rooms=Math.ceil(q.people/2),occupancies=Array.from({length:rooms},(_,i)=>({adults:Math.min(2,q.people-i*2),children:[]}));
 const base={...(q.airportScope?{latitude:KLIA_SCOPE.latitude,longitude:KLIA_SCOPE.longitude,radius:KLIA_SCOPE.radius}:{countryCode:q.country,cityName:q.city}),checkin:q.checkin,checkout:q.checkout,currency:'IDR',guestNationality:'ID',occupancies,includeHotelData:true,limit:200,timeout:12,maxRatesPerHotel:4,...(q.hotelName?{hotelName:q.hotelName}:{})};
 const requests=[api('hotels/rates',{...base,starRating:[1,1.5,2,2.5,3]})];
 if(q.tier!=='budget')requests.push(api('hotels/rates',base));
 const results=await Promise.allSettled(requests);
 if(results.some(r=>r.status==='rejected'&&r.reason?.message==='lite_production_required'))throw Error('lite_production_required');
 const completed=results.filter(r=>r.status==='fulfilled').map(r=>r.value);if(!completed.length)throw Error('hotel_search_unavailable');
 const hotels=new Map(),inventory=new Map();
 for(const result of completed){
  for(const h of Array.isArray(result.hotels)?result.hotels:[]){const id=h.id||h.hotelId;if(safeId(id))hotels.set(id,{...h,id});}
  for(const h of result.data){if(!safeId(h.hotelId))continue;const offers=Array.isArray(h.roomTypes)?h.roomTypes:[];inventory.set(h.hotelId,[...(inventory.get(h.hotelId)||[]),...offers]);}
 }
 const missing=[...inventory.keys()].filter(id=>!hotels.has(id)).slice(0,200);
 if(missing.length){try{const meta=await api('data/hotels?'+new URLSearchParams({hotelIds:missing.join(','),limit:String(missing.length)}));for(const h of meta.data){const id=h.id||h.hotelId;if(missing.includes(id))hotels.set(id,{...h,id});}}catch{ /* Never invent missing hotel identity. */ }}
 const area=norm(q.area).replace(norm(q.city),'').trim(),found=[];let matchedOfferCount=0;
 for(const [id,offers] of inventory){
  const hotel=hotels.get(id);if(!hotel)continue;
  const code=hotel.country_code||(/^[A-Z]{2}$/.test(hotel.country||'')?hotel.country:null);
  if(code&&code!==q.country)continue;
  if(area&&!norm([hotel.name,hotel.address].join(' ')).includes(area))continue;
  const checked=offers.map(o=>checkedLiteOffer(hotel,o,{people:q.people},{id:'hotel-search',rooms,checkin:q.checkin,checkout:q.checkout,area:q.area})).filter(Boolean).sort((a,b)=>a.amountIDR-b.amountIDR);
  matchedOfferCount+=checked.length;if(!checked.length)continue;
  const quote=checked[0];if(q.airportScope&&!withinAirportScope(quote.geo))continue;const preview=hotelPreview(hotel);
  if(q.tier==='budget'&&preview.stars!==null&&preview.stars>3)continue;
  found.push({...quote,...preview,hotelCity:q.city,bookingUrl:liteHotelLink(env,quote)});
 }
 const nights=Math.round((Date.parse(q.checkout)-Date.parse(q.checkin))/86400000);
 const matches=found.filter(h=>{const nightly=h.amountIDR/(nights*rooms);return nightly>=(q.minNightly||0)&&(!q.maxNightly||nightly<=q.maxNightly);}).sort((a,b)=>a.amountIDR-b.amountIDR||a.hotelId.localeCompare(b.hotelId));
 return {hotels:matches.slice(0,60).map(h=>({...h,checkedHotelCount:inventory.size,matchedOfferCount})),coverage:{checkedHotels:inventory.size,matchedHotels:found.length,returnedHotels:Math.min(60,matches.length),partial:completed.length!==requests.length,capped:true},source:'LiteAPI'};
}
