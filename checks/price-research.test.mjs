import {test} from 'node:test';
import assert from 'node:assert/strict';
import {priceTargets,validatePriceQuotes} from '../worker/price-research.js';
import {handleItinerary} from '../worker/itinerary.js';
const target={id:'hotel',title:'Travelodge Kuala Lumpur City Centre',category:'Penginapan',day:1,rooms:1};
const hotelUrl='https://www.tiket.com/hotel/malaysia/travelodge-kuala-lumpur-city-centre';
const quote='Travelodge Kuala Lumpur City Centre: Rp 540.000 per room per night';
const entry={id:'hotel',amountIDR:540000,basis:'room_night',sourceUrl:hotelUrl,quote};
test('price evidence requires exact IDR amount, property identity, hotel source and room-night basis',()=>{
 const targets=priceTargets([target],3),sources=[{url:hotelUrl}];
 assert.equal(validatePriceQuotes({quotes:[entry]},targets,sources,quote)[0].scope,'reference');
 for(const invalid of [{...entry,amountIDR:600000},{...entry,quote:'Invented quote'},{...entry,basis:'person'},{...entry,sourceUrl:'https://www.tiket.com.evil.test/hotel'},{...entry,quote:'Other hotel Rp 540.000 per room per night'}])assert.equal(validatePriceQuotes({quotes:[invalid]},targets,sources,quote+' Other hotel Rp 540.000 per room per night').length,0);
 assert.throws(()=>priceTargets([target,target],3));assert.throws(()=>priceTargets([{...target,day:5}],3));
});
test('transport quotes require exact route endpoints, source and per-person basis',()=>{
 const targets=priceTargets([{id:'bus',title:'Coach',category:'Transportasi',day:2,from:'Johor Bahru',to:'Melaka'}],3),url='https://12go.asia/en/travel/johor-bahru/melaka',text='Johor Bahru to Melaka Rp 125,000 per ticket';
 const v={id:'bus',amountIDR:125000,basis:'person',sourceUrl:url,quote:text};
 assert.equal(validatePriceQuotes({quotes:[v]},targets,[{url}],text).length,1);
 assert.equal(validatePriceQuotes({quotes:[{...v,sourceUrl:'https://other.test'}]},targets,[{url:'https://other.test'}],text).length,0);
});
test('price-only research consumes one quota on evidence success, none when unavailable; authentication and origin enforced',async()=>{
 const old=globalThis.fetch;
 try{for(const success of [true,false]){
  let reserves=0;const finishes=[];
  globalThis.fetch=async(url,opts)=>{
   if(String(url).endsWith('/auth/v1/user'))return Response.json({id:'fixture'});
   if(String(url).includes('reserve_ai_request')){reserves++;return Response.json({allowed:true});}
   if(String(url).includes('finish_ai_request')){finishes.push(JSON.parse(opts.body).p_success);return Response.json({ok:true});}
   const body=JSON.parse(opts.body);
   return Response.json({status:'completed',output:body.tools?[{action:{sources:[{url:hotelUrl}]},content:[{type:'output_text',text:success?quote:'Unavailable'}]}]:[{content:[{type:'output_text',text:JSON.stringify({quotes:success?[entry]:[]})}]}]});
  };
  const env={OPENAI_API_KEY:'fixture',SUPABASE_URL:'https://db.test',SUPABASE_PUBLISHABLE_KEY:'fixture',SUPABASE_SERVICE_ROLE_KEY:'fixture',AI_LIMITER:{limit:async()=>({success:true})}};
  const body=JSON.stringify({city:'Kuala Lumpur',start:'2027-01-10',days:3,people:1,budget:4000000,mode:'prices',priceTargets:[target]});
  const request=()=>new Request('https://sorttrip.test/api/itinerary',{method:'POST',headers:{Authorization:'Bearer fixture'},body});
  const result=await handleItinerary(request(),env);assert.equal(result.status,success?200:502);assert.equal(reserves,1);assert.deepEqual(finishes,[success]);
  const data=await result.json();assert.equal(data.plan,undefined);if(success)assert.equal(data.prices[0].amountIDR,540000);else assert.equal(data.code,'PRICE_UNAVAILABLE');
  assert.equal((await handleItinerary(new Request('https://sorttrip.test/api/itinerary',{method:'POST',headers:{Origin:'https://evil.test'},body}),env)).status,403);
  assert.equal((await handleItinerary(new Request('https://sorttrip.test/api/itinerary',{method:'POST',body}),env)).status,401);
 }}finally{globalThis.fetch=old;}
});

test('hotel at/@ spelling variants retain location identity and exact supplier quote',()=>{
 const targets=priceTargets([{...target,title:'CUBE Boutique Capsule Hotel at Kampong Glam'}],3),text='CUBE Boutique Capsule Hotel @ Kampong Glam IDR 596.075/kamar/malam';
 const v={...entry,amountIDR:596075,quote:text};assert.equal(validatePriceQuotes({quotes:[v]},targets,[{url:hotelUrl}],text).length,1);
 const wrong='CUBE Boutique Capsule Hotel @ Chinatown IDR 596.075/kamar/malam';assert.equal(validatePriceQuotes({quotes:[{...v,quote:wrong}]},targets,[{url:hotelUrl}],wrong).length,0);
});
