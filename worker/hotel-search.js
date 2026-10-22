import {liteHotelConfigured,liteHotelPrices} from './lite-hotel.js';
// Preserve a stable key: the outer Worker translates the human-readable error.
const reply=(data,status=200)=>Response.json({...data,...(data.error?{errorKey:data.error}:{})},{status,headers:{'Cache-Control':'no-store'}});
export async function handleHotelSearch(request,env){
 if(request.method!=='POST')return reply({error:'hotel_post_required'},405);
 if(request.headers.get('Origin')&&request.headers.get('Origin')!==new URL(request.url).origin)return reply({error:'hotel_origin_rejected'},403);
 if(!liteHotelConfigured(env))return reply({code:'LITEAPI_PRODUCTION_REQUIRED',error:'lite_production_required'},503);
 try{
  const text=await request.text();if(text.length>3000)return reply({error:'hotel_invalid_search'},400);
  let input;try{input=JSON.parse(text);}catch{return reply({error:'hotel_invalid_search'},400);}
  if(!input||typeof input!=='object'||Array.isArray(input))return reply({error:'hotel_invalid_search'},400);
  const {city,country,checkin,checkout,people,area=''}=input;
  if(typeof city!=='string'||city.trim().length<2||city.length>100||typeof country!=='string'||!/^[a-zA-Z]{2}$/.test(country)||typeof area!=='string'||area.length>120||!Number.isInteger(people)||people<1||people>8||!/^\d{4}-\d{2}-\d{2}$/.test(checkin||'')||!/^\d{4}-\d{2}-\d{2}$/.test(checkout||'')||!Number.isFinite(Date.parse(checkin))||!Number.isFinite(Date.parse(checkout))||new Date(checkin).toISOString().slice(0,10)!==checkin||new Date(checkout).toISOString().slice(0,10)!==checkout||checkin>=checkout||Date.parse(checkout)-Date.parse(checkin)>31*86400000||checkin<new Date().toISOString().slice(0,10))return reply({error:'hotel_invalid_search'},400);
  if(!env.AI_LIMITER||(await env.AI_LIMITER.limit({key:'hotel-search:'+(request.headers.get('CF-Connecting-IP')||'unknown')})).success!==true)return reply({error:'hotel_search_limit'},429);
  const q={city:city.trim(),country:country.toUpperCase(),start:checkin,days:Math.round((Date.parse(checkout)-Date.parse(checkin))/86400000)+1,people};
  const diagnostics={};await liteHotelPrices(q,[{id:'hotel-search',category:'Penginapan',title:'',city:q.city,day:1,checkin,checkout,rooms:Math.ceil(people/2),area:area.trim(),searchAny:true}],env,Date.now()+45000,diagnostics);
  if(diagnostics.liteHotelSandbox)return reply({error:'lite_production_required'},503);
  if(diagnostics.liteHotelUnavailable&&!diagnostics.liteHotelCandidates?.length)return reply({error:'hotel_search_unavailable'},502);
  return reply({hotels:diagnostics.liteHotelCandidates||[],city:q.city,country:q.country,checkin,checkout,people,rooms:Math.ceil(people/2),source:'LiteAPI',scope:'dated',currency:'IDR'});
 }catch{return reply({error:'hotel_search_unavailable'},502);}
}
