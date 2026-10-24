import {discoverHotelRates} from './hotel-discovery.js';
import {liteHotelConfigured} from './lite-hotel.js';
import {handleViator} from './viator.js';
import seed from './data/recommendation-seed.json' with {type:'json'};
export const recommendedCities=[
 {id:'kl',city:'Kuala Lumpur',country:'MY',airport:'KUL',image:'/kuala-lumpur.jpg',days:4,foodPerDay:100000},
 {id:'hanoi',city:'Hanoi',country:'VN',airport:'HAN',image:'/hanoi.jpg?v=2',days:5,foodPerDay:80000},
 {id:'singapore',city:'Singapore',country:'SG',airport:'SIN',image:'/singapore.jpg',days:4,foodPerDay:180000}
];
const add=(s,n)=>new Date(Date.parse(s+'T12:00:00Z')+n*86400000).toISOString().slice(0,10);
export function statistics(values){
 const v=values.filter(n=>Number.isFinite(n)&&n>0&&n<=1e9);if(!v.length)return null;
 const mean=v.reduce((a,b)=>a+b,0)/v.length,m2=v.reduce((a,b)=>a+(b-mean)**2,0);
 return {n:v.length,mean,m2,sd:v.length>1?Math.sqrt(m2/(v.length-1)):null,min:Math.min(...v),max:Math.max(...v)};
}
export function combineStatistics(rows){
 let count=0,mean=0,m2=0,min=Infinity,max=0;
 for(const r of rows.filter(r=>r&&Number.isInteger(r.n)&&r.n>0&&Number.isFinite(r.mean)&&r.mean>0&&Number.isFinite(r.m2)&&r.m2>=0&&Number.isFinite(r.min)&&r.min>0&&Number.isFinite(r.max)&&r.max>=r.min)){const n=count+r.n,delta=r.mean-mean;m2+=r.m2+delta**2*count*r.n/n;mean+=delta*r.n/n;count=n;min=Math.min(min,r.min);max=Math.max(max,r.max);}
 return count?{n:count,mean,m2,sd:count>1?Math.sqrt(m2/(count-1)):null,min,max}:null;
}
// Only comparable ticket series are pooled. Hotels deliberately use a minimum,
// never a mean/deviation. No unknown local fare or admission is counted as free.
export function publishBudgets(history){
 const latest=history.at(-1);if(!latest)return {updatedAt:null,cities:[]};
 return {budgetVersion:2,updatedAt:latest.capturedAt,cities:recommendedCities.map(city=>{
  const days=city.days,nights=days-1;
  const observations=history.map(s=>s.cities.find(c=>c.id===city.id)).filter(c=>c&&(c.tripDays??4)===days),current=latest.cities.find(c=>c.id===city.id&&(c.tripDays??4)===days);
  const flights=combineStatistics(observations.map(c=>c.flight)),hotel=current?.hotelMinimum??null;
  const enough=flights?.n>=1&&Number.isFinite(hotel)&&hotel>0;
  const flightFloor=flights?Math.max(flights.min,flights.mean-(flights.sd||0)):null;
  const hotelTotal=Number.isFinite(hotel)&&hotel>0?hotel*nights:null,foodTotal=city.foodPerDay*days;
  const budget=enough?Math.ceil((flightFloor+hotelTotal+foodTotal)/50000)*50000:null;
  const tickets=(current?.tickets||[]).map(ticket=>({...ticket,stats:combineStatistics(observations.flatMap(c=>(c.tickets||[]).filter(t=>t.series===ticket.series&&t.kind===ticket.kind&&t.basis===ticket.basis).map(t=>t.stats)))}));
  return {...city,nights,journey:'return',people:1,origin:'CGK',hotelTarget:500000,hotelAboveTarget:hotel>500000,hotelMinimum:hotel,hotelTotal,foodTotal,flightEstimate:flightFloor,flight:flights,tickets,budget,months:observations.filter(c=>c.flight).length,flightTravelMonths:current?.travelMonths||[],excludes:['local_transport','paid_attractions','baggage','insurance'],updatedAt:latest.capturedAt};
 })};
}
export async function collectRecommendationSnapshot(env,ctx,searchFlights,fetcher=fetch,now=new Date()){
 const today=now.toISOString().slice(0,10),cities=[];
 for(const city of recommendedCities){
  const days=city.days,nights=days-1;
  const query={origin:'CGK',destination:city.airport,scope:'all',region:'world',journey:'return',outFrom:add(today,7),outTo:add(today,350),backFrom:add(today,7+nights),backTo:add(today,350+nights),minDays:days,maxDays:days,page:1};
  let flight=null,travelMonths=[];
  const perDate=new Map();
  // Query three departure months explicitly: a global cheapest-price cache page
  // can otherwise omit dates for the chosen trip duration.
  for(const offset of [30,120,240])try{
   const month=add(today,offset).slice(0,7),end=new Date(Date.UTC(+month.slice(0,4),+month.slice(5,7),0)).toISOString().slice(0,10);
   const r=await searchFlights({...query,outFrom:month+'-01',outTo:end},env,ctx,{fetcher,cache:null});const body=await r.json();
   if(r.ok)for(const f of body.flights||[])if(f.days===days&&f.end&&f.returnAt&&f.price>0&&(!perDate.has(f.start)||f.price<perDate.get(f.start).price))perDate.set(f.start,f);
  }catch{}
  const fares=[...perDate.values()];flight=statistics(fares.map(f=>f.price));travelMonths=[...new Set(fares.map(f=>f.start.slice(0,7)))];
  const hotels=[];
  // Three future travel-date samples, not a fabricated year of past prices.
  for(const offset of liteHotelConfigured(env)?[30,120,240]:[]){
   try{const checkin=add(today,offset),result=await discoverHotelRates({city:city.city,country:city.country,checkin,checkout:add(checkin,nights),people:1,area:'',hotelName:'',tier:'budget',minNightly:0,maxNightly:0},env,fetcher);
    const eligible=result.hotels.filter(h=>!/female|women|male.only|wanita|khusus.pria/i.test(h.roomType||''));if(eligible.length)hotels.push(Math.min(...eligible.map(h=>h.amountIDR/nights)));
   }catch{}
  }
  // Starting prices are kept separate from dated admission fares and the base
  // budget. Pool only the same supplier product, never unrelated attractions.
  const tickets=[];
  if(env.VIATOR_ENVIRONMENT==='production')try{
   const r=await handleViator(new Request('https://sorttrip.invalid/api/activities?'+new URLSearchParams({search:city.city+' attraction ticket',city:city.city,count:'3'})),env,{fetcher});
   const body=await r.json();if(r.ok)for(const p of body.products||[])if(p.fromPrice>0)tickets.push({series:'viator:'+p.productCode,title:p.title,kind:'attraction',basis:'starting_price',stats:statistics([p.fromPrice])});
  }catch{}
  cities.push({id:city.id,tripDays:days,flight,travelMonths,tickets,hotelMinimum:hotels.length?Math.min(...hotels):null,hotelDateSamples:hotels.length});
 }
 return {month:today.slice(0,7),capturedAt:now.toISOString(),cities};
}
export async function recommendationResponse(request,env,now=new Date()){
 if(request.method!=='GET')return Response.json({error:'METHOD_NOT_ALLOWED'},{status:405,headers:{Allow:'GET'}});
 let data;try{data=await env.RECOMMENDATION_BUDGETS?.get('published','json');}catch{}
 if(data?.budgetVersion!==2)data=publishBudgets(seed);
 const captured=Date.parse(data.updatedAt),stale=!Number.isFinite(captured)||captured>now.getTime()+86400000||now.getTime()-captured>60*86400000;
 return Response.json({...data,stale,...(stale?{cities:data.cities.map(c=>({...c,budget:null}))}:{})},{headers:{'Cache-Control':'public, max-age=3600','X-Content-Type-Options':'nosniff'}});
}
export async function monthlyRecommendationRefresh(env,ctx,searchFlights,now=new Date(),collector=collectRecommendationSnapshot){
 if(!env.RECOMMENDATION_BUDGETS||env.RECOMMENDATIONS_REFRESH_ENABLED!=='true')return;
 const month=now.toISOString().slice(0,7),key='snapshot:'+month;
 if(await env.RECOMMENDATION_BUDGETS.get(key))return;
 const attemptKey='attempt:'+month,last=await env.RECOMMENDATION_BUDGETS.get(attemptKey,'json');
 if(last&&(last.count>=3||Date.parse(last.at)>now.getTime()-86400000))return;
 await env.RECOMMENDATION_BUDGETS.put(attemptKey,JSON.stringify({at:now.toISOString(),count:(last?.count||0)+1}),{expirationTtl:370*86400});
 const snapshot=await collector(env,ctx,searchFlights,fetch,now);
 if(!snapshot.cities.some(c=>c.flight&&c.hotelMinimum))return;
 await env.RECOMMENDATION_BUDGETS.put(key,JSON.stringify(snapshot),{expirationTtl:370*86400});
 // One bounded history read avoids twelve per-month reads and keeps the
 // scheduled invocation's subrequest count bounded.
 const history=await env.RECOMMENDATION_BUDGETS.get('history','json')||[];
 const merged=[...new Map([...seed,...history,snapshot].map(s=>[s.month,s])).values()].sort((a,b)=>a.month.localeCompare(b.month)).slice(-12);
 await env.RECOMMENDATION_BUDGETS.put('history',JSON.stringify(merged));
 await env.RECOMMENDATION_BUDGETS.put('published',JSON.stringify(publishBudgets(merged)));
}
