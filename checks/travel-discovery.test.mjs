import {test} from 'node:test';
import assert from 'node:assert/strict';
import {discoverHotelRates} from '../worker/hotel-discovery.js';
import {selectHotelPool} from '../worker/lite-hotel.js';
import {rankedHotels,rankedFlights} from '../app/travel-discovery.mjs';
import {normalize,parseQuery} from '../worker/index.js';
import {handleHotelSearch} from '../worker/hotel-search.js';
const q={city:'Jakarta',country:'ID',people:3,checkin:'2027-01-10',checkout:'2027-01-12',area:'',tier:'all',maxNightly:300000,hotelName:'OYO'};
const hotel=(id,stars=2)=>({id,name:'OYO '+id,country_code:'ID',country:'Indonesia',stars,rating:8,address:'Jakarta'});
const rates=(id,amount)=>({hotelId:id,roomTypes:[{rateType:'standard',rates:[2,1].map((adultCount,i)=>({name:'Standard',adultCount,childCount:0,occupancyNumber:i+1,retailRate:{total:[{amount,currency:'IDR'}],suggestedSellingPrice:[{amount,currency:'IDR'}],taxesAndFees:[]},cancellationPolicies:{refundableTag:'NRFN'}}))}]});
test('city discovery includes budget pass, brand, ID occupancy and no margin or paid endpoints',async()=>{
 const calls=[];const fetcher=async(url,options)=>{calls.push({url,body:JSON.parse(options.body)});return Response.json({data:[rates('economy',250000),rates('expensive',800000)],hotels:[hotel('economy'),hotel('expensive',5)]});};
 const result=await discoverHotelRates(q,{},fetcher);assert.equal(calls.length,2);
 for(const c of calls){assert.ok(c.url.endsWith('/hotels/rates'));assert.equal(c.body.hotelName,'OYO');assert.equal(c.body.countryCode,'ID');assert.deepEqual(c.body.occupancies,[{adults:2,children:[]},{adults:1,children:[]}]);assert.equal(c.body.includeHotelData,true);assert.equal(c.body.margin,undefined);}
 assert.deepEqual(calls[0].body.starRating,[1,1.5,2,2.5,3]);assert.equal(calls[1].body.starRating,undefined);
 assert.equal(result.hotels.length,1);assert.equal(result.hotels[0].hotelId,'economy');assert.equal(result.hotels[0].amountIDR,500000);assert.equal(result.coverage.checkedHotels,2);
});
test('budget-only discovery limits requests and partial failure is explicit; sandbox fails closed',async()=>{
 let count=0;const fetcher=async()=>{count++;return Response.json({data:[],hotels:[]});};await discoverHotelRates({...q,tier:'budget'}, {},fetcher);assert.equal(count,1);
 let step=0;const partial=await discoverHotelRates(q,{},async()=>++step===1?new Response('',{status:503}):Response.json({data:[],hotels:[]}));assert.equal(partial.coverage.partial,true);
 await assert.rejects(discoverHotelRates(q,{},async()=>Response.json({sandbox:true,data:[]})),/lite_production_required/);
 await assert.rejects(discoverHotelRates(q,{},async()=>new Response('',{status:503})),/hotel_search_unavailable/);
});
test('nightly budget range uses inclusive per-room per-night totals and allows either open end',async()=>{
 const fetcher=async()=>Response.json({data:[rates('low',200000),rates('middle',400000),rates('high',800000)],hotels:[hotel('low'),hotel('middle'),hotel('high')]});
 const search=async(minNightly,maxNightly)=>(await discoverHotelRates({...q,tier:'budget',minNightly,maxNightly},{},fetcher)).hotels.map(h=>h.hotelId);
 assert.deepEqual(await search(200000,200000),['middle']);
 assert.deepEqual(await search(0,200000),['low','middle']);
 assert.deepEqual(await search(200000,0),['middle','high']);
 assert.deepEqual(await search(250000,350000),[]);
});
test('invalid budget ranges are rejected before any supplier call',async()=>{
 const env={LITEAPI_ENABLED:'true',LITEAPI_API_KEY:'fixture-not-a-key'};
 for(const bounds of [{minNightly:400000,maxNightly:300000},{minNightly:-1},{minNightly:1.5},{maxNightly:'300000'},{minNightly:1000000001}]){
  const response=await handleHotelSearch(new Request('https://sorttrip.test/api/hotels/search',{method:'POST',body:JSON.stringify({...q,...bounds})}),env);assert.equal(response.status,400);
 }
});
test('configuration diagnosis returns fixed categories without exposing a credential',async()=>{
 for(const [env,configuration] of [[{},'disabled'],[{LITEAPI_ENABLED:'true'},'key_missing'],[{LITEAPI_ENABLED:'true',LITEAPI_API_KEY:'sand_fixture'},'sandbox_key']]){
  const result=await handleHotelSearch(new Request('https://sorttrip.test/api/hotels/search',{method:'POST'}),env);const body=await result.json();assert.equal(body.configuration,configuration);assert.equal(body.errorKey,'lite_production_required');assert.ok(!JSON.stringify(body).includes('sand_fixture'));
 }
});
test('Vietnam query stays Vietnam; absent identity is not fabricated',async()=>{
 const result=await discoverHotelRates({...q,country:'VN',city:'Hanoi',people:2,tier:'budget'}, {},async(url,options)=>{
  if(options.body){assert.equal(JSON.parse(options.body).countryCode,'VN');return Response.json({data:[rates('missing',100000)]});}
  assert.match(url,/data\/hotels\?/);return Response.json({data:[]});
 });assert.deepEqual(result.hotels,[]);
});
test('AI pool includes economy hotels after catalogue first forty and is bounded',()=>{
 const hotels=[...Array.from({length:220},(_,i)=>hotel('luxury'+i,5)),hotel('late-budget',2)];const pool=selectHotelPool(hotels);assert.equal(pool.length,200);assert.ok(pool.some(h=>h.id==='late-budget'));assert.equal(new Set(pool.map(h=>h.id)).size,200);
});
test('ranking retains unknown review/duration truth and does not mutate input',()=>{
 const hotels=[{amountIDR:300000,rating:null},{amountIDR:300000,rating:8}];assert.equal(rankedHotels(hotels,'balanced')[0].rating,8);assert.equal(hotels[0].rating,null);
 const flights=[{price:100,durationTo:null,transfers:null},{price:100,durationTo:50,transfers:0}];assert.equal(rankedFlights(flights,'balanced')[0].durationTo,50);assert.equal(flights[0].durationTo,null);
});
test('flight discovery region includes Indonesia and Vietnam and keeps worldwide optional',()=>{
 const start=new Date(Date.now()+30*86400000).toISOString().slice(0,10),end=new Date(Date.now()+33*86400000).toISOString().slice(0,10);
 const query={origin:'CGK',destination:'all',scope:'all',journey:'return',outFrom:start,outTo:start,backFrom:end,backTo:end,minDays:4,maxDays:4,region:'sea'};
 const row={origin_airport:'CGK',price:1000000,airline:'AK',departure_at:start+'T07:00:00+07:00',return_at:end+'T18:00:00+07:00',link:'/search/example',transfers:0};
 for(const code of ['DPS','HAN'])assert.ok(normalize({...row,destination:code,destination_airport:code},query,'all'));
 assert.equal(normalize({...row,destination:'NRT',destination_airport:'NRT'},query,'all'),null);
 assert.equal(normalize({...row,destination:'HAN',destination_airport:'HAN'},{...query,region:'domestic'},'all'),null);
 assert.ok(normalize({...row,destination:'NRT',destination_airport:'NRT'},{...query,region:'world'},'all'));
 assert.throws(()=>parseQuery('https://site/api/flights?'+new URLSearchParams({...query,region:'invalid'})));
 assert.equal(parseQuery('https://site/api/flights?'+new URLSearchParams({...query,region:'domestic',scope:'international'})).scope,'all');
});
