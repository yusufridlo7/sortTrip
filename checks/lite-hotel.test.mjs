import {test} from 'node:test';
import assert from 'node:assert/strict';
import {liteHotelConfigured,checkedLiteOffer,liteHotelPrices,groupHotelAreas,applyLiteHotels,LITE_HOTEL_SOURCE} from '../worker/lite-hotel.js';
import {researchPrices} from '../worker/price-research.js';
import {researchRequest,draftRequest} from '../worker/ai-draft.js';
import {handleItinerary} from '../worker/itinerary.js';
const env={LITEAPI_ENABLED:'true',LITEAPI_API_KEY:'fixture-not-a-real-key'};
const q={city:'Kuala Lumpur',country:'Malaysia',start:'2027-01-10',days:4,people:2,budget:4000000,dailyCities:[]};
const target={id:'ai-plan-a',title:'Bukit Bintang',area:'Bukit Bintang',category:'Penginapan',city:q.city,day:1,checkin:q.start,checkout:'2027-01-13',rooms:1};
const hotel={id:'lpfixture',name:'Hotel B',address:'Bukit Bintang, Kuala Lumpur',city:'Kuala Lumpur',country:'MY',location:{latitude:3.14,longitude:101.71}};
const rate=(n=300)=>({rateType:'standard',rates:[{occupancyNumber:1,adultCount:2,childCount:0,name:'Double Room',retailRate:{total:[{amount:n,currency:'IDR'}],suggestedSellingPrice:[{amount:n+20,currency:'IDR'}],taxesAndFees:[{included:true}]},cancellationPolicies:{refundableTag:'NRFN'}}]});
test('sandbox cannot activate customer hotel prices; invalid/private rates never become public totals',()=>{
 assert.equal(liteHotelConfigured(env),true);assert.equal(liteHotelConfigured({...env,LITEAPI_API_KEY:'sand_fixture'}),false);assert.equal(liteHotelConfigured({...env,LITEAPI_ENABLED:'false'}),false);
 assert.equal(checkedLiteOffer(hotel,rate(),q,target).amountIDR,320);
 const variants=[{...rate(),rateType:'package'},rate(-1),rate(Infinity),{...rate(),rates:[]},rate()];variants.at(-1).rates[0].retailRate.taxesAndFees=[{included:false}];
 for(const offer of variants)assert.equal(checkedLiteOffer(hotel,offer,q,target),null);
 for(const field of ['adultCount','childCount','occupancyNumber']){const offer=rate();offer.rates[0][field]=field==='adultCount'?1:field==='childCount'?1:null;assert.equal(checkedLiteOffer(hotel,offer,q,target),null);}
});
test('area search uses only matching catalogue hotels, public comparable totals and no AI/browser calls',async()=>{
 const calls=[];
 const fetcher=async(url,options)=>{calls.push(String(url));if(String(url).includes('data/hotels'))return Response.json({data:[hotel,{...hotel,id:'lpcheaper',name:'Hotel A'}, {...hotel,id:'lpwrong',address:'Airport Road'}]});const input=JSON.parse(options.body);assert.deepEqual(input.hotelIds,['lpfixture','lpcheaper']);assert.equal(input.checkin,q.start);assert.deepEqual(input.occupancies,[{adults:2,children:[]}]);return Response.json({sandbox:false,data:[{hotelId:'lpfixture',roomTypes:[rate(500)]},{hotelId:'lpcheaper',roomTypes:[rate(200)]},{hotelId:'lpwrong',roomTypes:[rate(1)]}]});};
 const quotes=await liteHotelPrices(q,[target],env,Date.now()+45000,{},fetcher);
 assert.equal(calls.length,2);assert.equal(quotes[0].hotelId,'lpcheaper');assert.equal(quotes[0].amountIDR,220);assert.equal(quotes[0].checkin,q.start);assert.equal(quotes[0].rooms,1);assert.equal(quotes[0].selection,'lowest_checked_public_total');
 const old=globalThis.fetch;try{globalThis.fetch=fetcher;const result=await researchPrices(q,[target],env,()=>{throw Error('Unexpected AI call')},Date.now()+45000,{},()=>{throw Error('Unexpected browser')});assert.equal(result.length,1);}finally{globalThis.fetch=old;}
});
test('unavailable or sandbox responses preserve unknown prices and fixed hotel identity on refresh',async()=>{
 let calls=0;const fetcher=async(url)=>{calls++;return String(url).includes('data/hotels')?Response.json({data:[hotel]}):Response.json({sandbox:true,data:[{hotelId:hotel.id,roomTypes:[rate()]}]});};
 const diagnostics={};assert.deepEqual(await liteHotelPrices(q,[target],env,Date.now()+45000,diagnostics,fetcher),[]);assert.equal(diagnostics.liteHotelSandbox,true);
 calls=0;assert.deepEqual(await liteHotelPrices(q,[{...target,hotelId:hotel.id,title:'Another hotel',area:''}],env,Date.now()+45000,{},fetcher),[]);assert.equal(calls,1);
 calls=0;assert.deepEqual(await liteHotelPrices(q,[{...target,checkout:'2027-02-30'}],env,Date.now()+45000,{},fetcher),[]);assert.equal(calls,0);
});
test('consecutive area nights group into one stay; sourced supplier enrichment preserves route research',()=>{
 const source='https://tourism.test/area';const a={id:'a',day:1,time:'16:00',category:'Area menginap',title:'Bukit Bintang',location:'Bukit Bintang',city:q.city,sourceUrl:source};
 const route={id:'route',day:1,category:'Transfer',fromPlace:'Bukit Bintang',toPlace:'Park',routeOptions:[]};
 const plan={activities:[a,route,{...a,id:'b',day:2},{...a,id:'c',day:3,city:'Melaka'}],sources:[{url:source,title:'Area'}]};
 const grouped=groupHotelAreas(plan,q);assert.equal(grouped.activities.length,3);assert.equal(grouped.activities[0].checkout,'2027-01-12');
 const quote=checkedLiteOffer(hotel,rate(),q,{...target,checkout:'2027-01-12'});const enriched=applyLiteHotels(grouped,[quote]);assert.equal(enriched.activities[0].title,'Hotel B');assert.equal(enriched.activities[0].provider,'LiteAPI');assert.equal(enriched.activities[1],route);assert.ok(enriched.sources.some(s=>s.url===LITE_HOTEL_SOURCE));
});
test('AI chooses sourced neighborhoods instead of hotel properties when the API is available',()=>{
 const research=researchRequest(q,env),draft=draftRequest(q,env,'Sourced area',[{url:'https://tourism.test',title:'Area'}]);
 assert.match(research.instructions,/do not search individual hotels/);assert.doesNotMatch(research.instructions,/then actual named hotels/);
 assert.deepEqual(draft.text.format.schema.properties.activities.items.properties.category.enum,['Wisata','Area menginap','Transfer']);assert.match(draft.instructions,/Do not invent or choose hotels/);
});
test('area grouping never covers an already selected hotel night',()=>{
 const activities=[1,2,3].map(day=>({id:'a'+day,day,category:'Area menginap',city:q.city,location:'Bukit Bintang'}));
 const grouped=groupHotelAreas({activities},{...q,retained:[{day:2,category:'Penginapan',checkin:'2027-01-11',checkout:'2027-01-12'}]});
 assert.equal(grouped.activities.length,2);assert.equal(grouped.activities[0].checkout,'2027-01-11');assert.equal(grouped.activities[1].checkin,'2027-01-12');
});
test('authenticated hotel refresh uses supplier API and one successful quota result; sandbox activation spends none',async()=>{
 const old=globalThis.fetch,finishes=[];let reserves=0,aiCalls=0;
 try{
  globalThis.fetch=async(url,options)=>{
   if(String(url).endsWith('/auth/v1/user'))return Response.json({id:'fixture'});
   if(String(url).includes('reserve_ai_request')){reserves++;return Response.json({allowed:true});}
   if(String(url).includes('finish_ai_request')){finishes.push(JSON.parse(options.body).p_success);return Response.json({ok:true});}
   if(String(url).includes('openai')){aiCalls++;throw Error('Unexpected AI');}
   return String(url).includes('data/hotels')?Response.json({data:[hotel]}):Response.json({sandbox:false,data:[{hotelId:hotel.id,roomTypes:[rate()]}]});
  };
  const configured={...env,OPENAI_API_KEY:'fixture',SUPABASE_URL:'https://db.test',SUPABASE_PUBLISHABLE_KEY:'fixture',SUPABASE_SERVICE_ROLE_KEY:'fixture',AI_LIMITER:{limit:async()=>({success:true})}};
  const request=()=>new Request('https://sorttrip.test/api/itinerary',{method:'POST',headers:{Authorization:'Bearer fixture'},body:JSON.stringify({...q,mode:'prices',priceTargets:[{...target,hotelId:hotel.id,title:hotel.name,area:''}]})});
  const response=await handleItinerary(request(),configured);assert.equal(response.status,200);assert.equal((await response.json()).prices[0].amountIDR,320);assert.deepEqual(finishes,[true]);assert.equal(reserves,1);assert.equal(aiCalls,0);
  const sandbox=await handleItinerary(request(),{...configured,LITEAPI_API_KEY:'sand_fixture'});assert.equal(sandbox.status,503);assert.equal((await sandbox.json()).code,'LITEAPI_PRODUCTION_REQUIRED');assert.equal(reserves,1);assert.equal(aiCalls,0);
 }finally{globalThis.fetch=old;}
});
