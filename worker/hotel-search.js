import {liteHotelConfigured} from './lite-hotel.js';
import {discoverHotelRates} from './hotel-discovery.js';
// Preserve a stable key: the outer Worker translates the human-readable error.
const reply=(data,status=200)=>Response.json({...data,...(data.error?{errorKey:data.error}:{})},{status,headers:{'Cache-Control':'no-store'}});
export async function handleHotelSearch(request,env){
 if(request.method!=='POST')return reply({error:'hotel_post_required'},405);
 if(request.headers.get('Origin')&&request.headers.get('Origin')!==new URL(request.url).origin)return reply({error:'hotel_origin_rejected'},403);
 if(!liteHotelConfigured(env))return reply({code:'LITEAPI_PRODUCTION_REQUIRED',error:'lite_production_required',configuration:env.LITEAPI_ENABLED!=='true'?'disabled':!env.LITEAPI_API_KEY?'key_missing':/^(sand_|sandbox_)/i.test(env.LITEAPI_API_KEY)?'sandbox_key':'invalid_key'},503);
 try{
  const text=await request.text();if(text.length>3000)return reply({error:'hotel_invalid_search'},400);
  let input;try{input=JSON.parse(text);}catch{return reply({error:'hotel_invalid_search'},400);}
  if(!input||typeof input!=='object'||Array.isArray(input))return reply({error:'hotel_invalid_search'},400);
  const {city,country,checkin,checkout,people,area='',hotelName='',tier='all',minNightly=0,maxNightly=0}=input;
  if(typeof hotelName!=='string'||hotelName.length>100||!['all','budget'].includes(tier)||![minNightly,maxNightly].every(n=>Number.isInteger(n)&&n>=0&&n<=1e9)||(maxNightly>0&&minNightly>maxNightly))return reply({error:'hotel_invalid_search'},400);
  if(typeof city!=='string'||city.trim().length<2||city.length>100||typeof country!=='string'||!/^[a-zA-Z]{2}$/.test(country)||typeof area!=='string'||area.length>120||!Number.isInteger(people)||people<1||people>8||!/^\d{4}-\d{2}-\d{2}$/.test(checkin||'')||!/^\d{4}-\d{2}-\d{2}$/.test(checkout||'')||!Number.isFinite(Date.parse(checkin))||!Number.isFinite(Date.parse(checkout))||new Date(checkin).toISOString().slice(0,10)!==checkin||new Date(checkout).toISOString().slice(0,10)!==checkout||checkin>=checkout||Date.parse(checkout)-Date.parse(checkin)>31*86400000||checkin<new Date().toISOString().slice(0,10))return reply({error:'hotel_invalid_search'},400);
  if(!env.AI_LIMITER||(await env.AI_LIMITER.limit({key:'hotel-search:'+(request.headers.get('CF-Connecting-IP')||'unknown')})).success!==true)return reply({error:'hotel_search_limit'},429);
  const q={city:city.trim(),country:country.toUpperCase(),checkin,checkout,people,area:area.trim(),hotelName:hotelName.trim(),tier,minNightly,maxNightly};
  const result=await discoverHotelRates(q,env);
  return reply({...result,city:q.city,country:q.country,checkin,checkout,people,rooms:Math.ceil(people/2),scope:'dated',currency:'IDR'});
 }catch(e){const sandbox=e?.message==='lite_production_required';return reply({error:sandbox?'lite_production_required':'hotel_search_unavailable'},sandbox?503:502);}
}
