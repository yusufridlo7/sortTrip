import {liteHotelConfigured,liteHotelPrices,LITE_HOTEL_SOURCE} from './lite-hotel.js';
import {handleViator} from './viator.js';
const countryCodes={malaysia:'MY',singapore:'SG',singapura:'SG',thailand:'TH',indonesia:'ID',vietnam:'VN',philippines:'PH',filipina:'PH'};
export function assistantSearchTools(q,env,{fetcher=fetch,signal}={}){
 const cities=[...new Set([q.city,...(q.dailyCities||[]).map(d=>d.city)].filter(Boolean))];
 const definitions=[
  {type:'function',name:'search_hotels',description:'Read-only supplier hotel search for the CURRENT trip stay/guests. Returns dated public prices or unavailable. Cannot book, save or change a trip.',strict:true,parameters:{type:'object',additionalProperties:false,required:['city'],properties:{city:{type:'string',enum:cities}}}},
  {type:'function',name:'search_activities',description:'Read-only Viator starting-price search in a current itinerary city. Not an admission fee or dated availability. Cannot book or save.',strict:true,parameters:{type:'object',additionalProperties:false,required:['city','query'],properties:{city:{type:'string',enum:cities},query:{type:'string',maxLength:100}}}}
 ];
 const boundedFetch=(url,options={})=>fetcher(url,{...options,signal:AbortSignal.any([signal||new AbortController().signal,...(options.signal?[options.signal]:[])])});
 async function run(name,args){
  if(signal?.aborted)throw Error('AI_CANCELLED');
  const allowed=name==='search_hotels'?['city']:name==='search_activities'?['city','query']:null;
  if(!allowed||!args||Array.isArray(args)||Object.keys(args).length!==allowed.length||Object.keys(args).some(k=>!allowed.includes(k))||!cities.includes(args.city))throw Error('AI_TOOL_REJECTED');
  if(name==='search_hotels'){
   // The normal hotel enrichment remains authoritative, including airport/split stays.
   if(!liteHotelConfigured(env)||q.days<2||q.hotelStay||cities.length!==1)return {status:'unavailable',reason:'STAY_SCOPE_OR_PROVIDER_UNAVAILABLE'};
   const country=/^[A-Z]{2}$/.test(q.country||'')?q.country:countryCodes[String(q.country).toLowerCase()];
   if(!country)return {status:'unavailable',reason:'COUNTRY_UNVERIFIED'};
   const target={id:'assistant-search',category:'Penginapan',day:1,city:args.city,title:'Budget stay',area:'',rooms:Math.ceil(q.people/2),checkin:q.start,checkout:new Date(Date.parse(q.start)+(q.days-1)*86400000).toISOString().slice(0,10),searchAny:true,maxNightIDR:q.hotelBudget?.maxNightIDR,maxNightExclusive:q.hotelBudget?.exclusive};
   const quotes=await liteHotelPrices({...q,country},[target],env,Date.now()+22000,{},boundedFetch);
   return {status:quotes.length?'available':'unavailable',priceType:'dated_public_stay_total',sourceUrl:LITE_HOTEL_SOURCE,hotels:quotes.slice(0,3).map(p=>({name:p.hotelName,checkin:p.checkin,checkout:p.checkout,adults:p.adults,rooms:p.rooms,amountIDR:p.amountIDR,taxesIncluded:p.taxesIncluded,checkedAt:p.checkedAt})),note:'Not a reservation; final room, conditions and price must be checked at checkout.'};
  }
  if(typeof args.query!=='string'||!args.query.trim()||args.query.length>100||/https?:|[\r\n]/i.test(args.query))throw Error('AI_TOOL_REJECTED');
  if(env.VIATOR_ENVIRONMENT!=='production')return {status:'unavailable',reason:'PRODUCTION_ACTIVITY_SEARCH_UNAVAILABLE'};
  const url=new URL('https://sorttrip.invalid/api/activities');url.search=new URLSearchParams({city:args.city,search:args.query,count:'3'}).toString();
  const response=await handleViator(new Request(url),env,{fetcher:boundedFetch});
  if(!response.ok)return {status:'unavailable',reason:'ACTIVITY_SEARCH_UNAVAILABLE'};
  const data=await response.json();if(data.environment!=='production')return {status:'unavailable',reason:'ACTIVITY_SEARCH_UNAVAILABLE'};
  return {status:data.products.length?'available':'unavailable',priceType:'starting_price_per_person',checkedAt:data.fetchedAt,products:data.products.slice(0,3).map(p=>({title:p.title,amountIDR:p.fromPrice,sourceUrl:p.bookingUrl})),note:'Not a dated quote, museum admission fee or booking. Review inclusions at the partner.'};
 }
 return {definitions,run};
}
