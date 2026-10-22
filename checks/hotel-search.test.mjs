import {test} from 'node:test';
import assert from 'node:assert/strict';
import {handleHotelSearch} from '../worker/hotel-search.js';
import {liteHotelLink} from '../worker/lite-hotel.js';
import {localizedResponse} from '../worker/localization.js';
const query={city:'Kuala Lumpur',country:'MY',checkin:'2027-01-10',checkout:'2027-01-12',people:2};
const request=(input=query,origin='https://sorttrip.test')=>new Request('https://sorttrip.test/api/hotels/search',{method:'POST',headers:{Origin:origin},body:JSON.stringify(input)});
test('hotel search requires production configuration and rejects foreign origin without provider requests',async()=>{
 assert.equal((await handleHotelSearch(request(),{})).status,503);
 assert.equal((await handleHotelSearch(request(),{LITEAPI_ENABLED:'true',LITEAPI_API_KEY:'sand_fixture'})).status,503);
 assert.equal((await handleHotelSearch(request(),{LITEAPI_ENABLED:'true',LITEAPI_API_KEY:'sandbox_fixture'})).status,503);
 assert.equal((await handleHotelSearch(request(query,'https://foreign.test'),{})).status,403);
 assert.equal((await handleHotelSearch(new Request('https://sorttrip.test/api/hotels/search'),{})).status,405);
});
test('localized hotel errors preserve their machine key for the search form',async()=>{
 for(const language of ['id','en']){const response=await localizedResponse(await handleHotelSearch(request(),{}),language);const body=await response.json();assert.equal(body.errorKey,'lite_production_required');assert.notEqual(body.error,body.errorKey);}
});
test('supplier failures are unavailable, while a successful empty catalogue is a real empty result',async()=>{
 const old=globalThis.fetch,env={LITEAPI_ENABLED:'true',LITEAPI_API_KEY:'fixture-not-a-key',AI_LIMITER:{limit:async()=>({success:true})}};
 try{
  for(const response of [()=>new Response('',{status:401}),()=>Response.json({error:{code:'provider_failure'}}),()=>new Response('invalid JSON'),()=>{throw Error('network');}]){
   globalThis.fetch=async()=>response();const result=await handleHotelSearch(request(),env);assert.equal(result.status,502);assert.equal((await result.json()).error,'hotel_search_unavailable');
  }
  globalThis.fetch=async url=>String(url).includes('data/hotels')?Response.json({data:[{id:'lpfixture',name:'Hotel',country:'MY',city:'Kuala Lumpur'}]}):new Response('',{status:503});
  assert.equal((await handleHotelSearch(request(),env)).status,502);
  globalThis.fetch=async()=>Response.json({data:[]});const result=await handleHotelSearch(request(),env);assert.equal(result.status,200);assert.deepEqual((await result.json()).hotels,[]);
 }finally{globalThis.fetch=old;}
});
test('a city repeated as the optional area does not discard every hotel',async()=>{
 const old=globalThis.fetch;
 try{globalThis.fetch=async url=>String(url).includes('data/hotels')?Response.json({data:[{id:'lpfixture',name:'Hotel',country:'MY',city:'Kuala Lumpur'}]}):Response.json({data:[{hotelId:'lpfixture',roomTypes:[{rateType:'standard',rates:[{name:'Room',adultCount:2,childCount:0,occupancyNumber:1,retailRate:{total:[{amount:100,currency:'IDR'}],suggestedSellingPrice:[{amount:120,currency:'IDR'}],taxesAndFees:[]},cancellationPolicies:{refundableTag:'NRFN'}}]}]}]});
  const result=await handleHotelSearch(request({...query,area:'Kuala Lumpur'}),{LITEAPI_ENABLED:'true',LITEAPI_API_KEY:'fixture-not-a-key',AI_LIMITER:{limit:async()=>({success:true})}});assert.equal(result.status,200);assert.equal((await result.json()).hotels.length,1);
 }finally{globalThis.fetch=old;}
});
test('hotel menu returns vetted public offers without auth, AI, booking or quota RPC calls',async()=>{
 const old=globalThis.fetch;let requests=0;
 try{globalThis.fetch=async(url)=>{requests++;assert.ok(String(url).startsWith('https://api.liteapi.travel/v3.0/'));return String(url).includes('data/hotels')?Response.json({data:[{id:'lpfixture',name:'Hotel',country:'MY',city:'Kuala Lumpur'}]}):Response.json({sandbox:false,data:[{hotelId:'lpfixture',roomTypes:[{rateType:'standard',rates:[{name:'Room',adultCount:2,childCount:0,occupancyNumber:1,retailRate:{total:[{amount:100,currency:'IDR'}],suggestedSellingPrice:[{amount:120,currency:'IDR'}],taxesAndFees:[]},cancellationPolicies:{refundableTag:'NRFN'}}]}]}]});};
 const env={LITEAPI_ENABLED:'true',LITEAPI_API_KEY:'fixture-not-a-key',AI_LIMITER:{limit:async()=>({success:true})}};
 const result=await handleHotelSearch(request(),env);assert.equal(result.status,200);const body=await result.json();assert.equal(body.hotels[0].amountIDR,120);assert.equal(body.hotels[0].bookingUrl,null);assert.equal(requests,2);
 assert.equal((await handleHotelSearch(request({...query,people:9}),env)).status,400);assert.equal((await handleHotelSearch(request({...query,checkout:'2027-02-30'}),env)).status,400);assert.equal(requests,2);
 for(const input of [null,[],{...query,country:'12'},{...query,checkin:query.checkout}])assert.equal((await handleHotelSearch(request(input),env)).status,400);
 assert.equal((await handleHotelSearch(new Request('https://sorttrip.test/api/hotels/search',{method:'POST',body:'{' }),env)).status,400);assert.equal(requests,2);
 assert.equal((await handleHotelSearch(request(),{...env,AI_LIMITER:{limit:async()=>({success:false})}})).status,429);assert.equal(requests,2);
 }finally{globalThis.fetch=old;}
});
test('white-label hotel links preserve dates and occupancy; no owner domain means no invented checkout',()=>{
 const quote={hotelId:'lpfixture',checkin:'2027-01-10',checkout:'2027-01-12',adults:3,rooms:2};
 assert.equal(liteHotelLink({},quote),null);
 const result=new URL(liteHotelLink({LITEAPI_WHITELABEL_URL:'https://owner.nuitee.link'},quote));assert.equal(result.pathname,'/hotels/lpfixture');assert.equal(result.searchParams.get('checkin'),quote.checkin);assert.deepEqual(JSON.parse(atob(result.searchParams.get('occupancies'))),[{adults:2,children:[]},{adults:1,children:[]}]);
 for(const base of ['http://owner.nuitee.link','https://user:password@example.test','https://127.0.0.1','https://owner.nuitee.link?secret=bad'])assert.equal(liteHotelLink({LITEAPI_WHITELABEL_URL:base},quote),null);
});
