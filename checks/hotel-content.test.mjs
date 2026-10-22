import {test} from 'node:test';
import assert from 'node:assert/strict';
import {hotelContent,hotelImage,handleHotelContent} from '../worker/hotel-content.js';
const env={LITEAPI_CHECKOUT_ENABLED:'true',LITEAPI_API_KEY:'sand_fixture',AI_LIMITER:{limit:async()=>({success:true})}};
const req=()=>new Request('https://sorttrip.test/api/hotels/content?hotelId=lpfixture');
test('hotel content returns bounded plain text and public HTTPS photos without raw supplier fields',()=>{
 for(const url of ['javascript:alert(1)','http://images.test/a','https://user:pass@images.test/a','https://127.0.0.1/a'])assert.equal(hotelImage(url),null);
 const h=hotelContent({id:'lpfixture',name:'Hotel',hotelDescription:'<b>Nice hotel</b>',hotelImages:[{url:'https://images.test/a'}],hotelFacilities:['Pool'],rooms:[{roomName:'Twin',photos:[{url:'https://images.test/b'}]}],privateData:'never-return'},[{averageScore:8,headline:'Good',pros:'<script>text</script>',name:'not-exported'}]);
 assert.equal(h.description,'Nice hotel');assert.equal(h.rooms[0].images.length,1);assert.equal(h.reviews[0].score,8);assert.ok(!JSON.stringify(h).includes('<script>'));assert.ok(!JSON.stringify(h).includes('not-exported'));assert.ok(!JSON.stringify(h).includes('never-return'));
});
test('details survive unavailable reviews; no AI, payment, redirect-follow or translation requests',async()=>{
 const urls=[];const r=await handleHotelContent(req(),env,async(u,o)=>{urls.push(u);assert.equal(o.redirect,'manual');if(u.includes('/reviews?'))return new Response('',{status:503});return Response.json({data:{id:'lpfixture',name:'Hotel',hotelImages:[],rooms:[]}});});const body=await r.json();assert.equal(r.status,200);assert.equal(body.reviewsAvailable,false);assert.deepEqual(body.hotel.reviews,[]);assert.equal(urls.length,2);assert.ok(urls[1].includes('limit=10'));assert.ok(urls[1].includes('getSentiment=false'));assert.ok(!urls[1].includes('language='));
});
test('invalid content IDs and exhausted limits block supplier calls; mismatched hotel cannot be returned',async()=>{
 let calls=0;const api=async()=>{calls++;return Response.json({data:{id:'wrong'}});};assert.equal((await handleHotelContent(new Request('https://sorttrip.test/api/hotels/content?hotelId=bad%2Fid'),env,api)).status,400);assert.equal((await handleHotelContent(req(),{...env,AI_LIMITER:{limit:async()=>({success:false})}},api)).status,429);assert.equal(calls,0);assert.equal((await handleHotelContent(req(),env,api)).status,502);
});
