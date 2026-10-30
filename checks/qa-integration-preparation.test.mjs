import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {originalQAConfig,QA_URL} from '../qa-config/original-ui.mjs';
import {qaReadRoute,readOnlySupplierFetch,QA_ROUTES} from '../worker/qa-read-routes.js';
const env={QA_SUPPLIER_READS_ENABLED:'true',STAGING_OWNER_QA_USER_ID:'fixture-owner',AI_LIMITER:{limit:async()=>({success:true})}};
const request=(path,body)=>new Request('https://sorttrip-staging.yusufridlo7.workers.dev'+path,{method:body?'POST':'GET',headers:{'Content-Type':'application/json'},...(body?{body:JSON.stringify(body)}:{})});
test('QA preparation uses original entry, fixed QA project, no env/secrets/proxy inheritance',()=>{
 const c=originalQAConfig();assert.equal(c.envDir,false);assert.deepEqual(c.envPrefix,[]);assert.equal(c.server.port,5176);assert.equal(c.server.host,'127.0.0.1');assert.equal(c.server.proxy,undefined);assert.equal(JSON.parse(c.define['import.meta.env.VITE_SUPABASE_URL']),QA_URL);assert.equal(JSON.parse(c.define['import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY']),'');assert.equal(JSON.parse(c.define['import.meta.env.VITE_QA_AUTH_READY']),'false');assert.equal(c.build.rollupOptions,undefined);assert.match(fs.readFileSync('main.jsx','utf8'),/<AuthApp\/>/);
});
test('QA HTML strips external trackers and production OG host without changing original entry',()=>{
 const c=originalQAConfig(),html=c.plugins[1].transformIndexHtml.handler(fs.readFileSync('index.html','utf8'));assert.match(html,/src="\/main.jsx"/);assert.doesNotMatch(html,/sorttrip.yusufridlo7.workers.dev|<script[^>]+src="https:/);assert.doesNotMatch(html,/mvp-demo.html|staging-entry/);
});
test('generation remains disabled even if every old flag is true, no RPC or model invoked',async()=>{
 for(const path of ['/api/assistant/discover','/api/video-itinerary','/api/itinerary','/api/itinerary/translate']){const r=await qaReadRoute(request(path,{}),{...env,STAGING_GENERATION_ENABLED:'true',META_VIDEO_TEXT_ENABLED:'true',META_VIDEO_FRAMES_ENABLED:'true',META_VIDEO_BUDGET_READY:'true'},null,{fetcher:()=>assert.fail('egress')});assert.equal(r.status,503);assert.equal((await r.json()).code,'QA_AI_DISABLED');}
});
test('payments, prebook, Book, diagnostics and trip mutations are never delegated',async()=>{
 for(const path of ['/api/payments/checkout','/api/hotels/checkout/prebook','/api/hotels/checkout/book','/api/hotels/checkout/payment','/api/bookings/status','/api/meta-qa/budget-probe','/api/trips','/api/support/send'])assert.equal((await qaReadRoute(request(path,{}),env,null,{fetcher:()=>assert.fail('egress')})).status,404);
 for(const path of ['/api/assistant/access','/api/payments/access']){const r=await qaReadRoute(request(path,{}),env);assert.equal((await r.json()).code,'QA_ENTITLEMENT_UNVERIFIED');}
});
test('supplier off and missing keys return unavailable without external calls',async()=>{
 for(const e of [{},env])for(const [path,body] of [['/api/flights',null],['/api/hotels/search',{}],['/api/hotels/content?hotelId=fixture',null]]){const r=await qaReadRoute(request(path,body),e,null,{fetcher:()=>assert.fail('egress')});assert.equal(r.status,503);}
});
test('read-only supplier egress denies nonallowlisted host/path/method and forwarded user headers',async()=>{
 let calls=0;const read=readOnlySupplierFetch(request('/'),async()=>{calls++;return Response.json({});});
 for(const [url,init] of [['https://api.meta.ai/v1/responses',{method:'POST'}],['https://book.liteapi.travel/v3.0/rates/book',{method:'POST'}],['https://api.liteapi.travel/v3.0/rates/prebook',{method:'POST'}],['https://api.liteapi.travel/v3.0/hotels/rates',{method:'DELETE'}],['https://sorttrip.yusufridlo7.workers.dev/api/flights',{}],['https://api.liteapi.travel/v3.0/data/hotel',{headers:{Cookie:'fixture'}}]])await assert.rejects(read(url,init),/EGRESS_DENIED/);assert.equal(calls,0);
});
test('hotel search reuses real adapter with mocked rates: 3 guests, 2 rooms, whole stay IDR',async()=>{
 const calls=[];const rate=(adults,i)=>({name:'Fixture Room',adultCount:adults,childCount:0,occupancyNumber:i,retailRate:{total:[{amount:100,currency:'IDR'}],suggestedSellingPrice:[{amount:120,currency:'IDR'}],taxesAndFees:[]},cancellationPolicies:{refundableTag:'NRFN'}});
 const fetcher=async(url,init)=>{calls.push(String(url));assert.equal(init.redirect,'manual');assert.equal(new Headers(init.headers).get('Authorization'),null);if(String(url).includes('/data/hotels'))return Response.json({data:[{id:'fixture',name:'Fixture Hotel',country:'MY',city:'Kuala Lumpur'}]});const b=JSON.parse(init.body);assert.deepEqual(b.occupancies,[{adults:2,children:[]},{adults:1,children:[]}]);assert.equal(b.currency,'IDR');assert.equal(b.checkin,'2030-01-10');assert.equal(b.checkout,'2030-01-12');return Response.json({data:[{hotelId:'fixture',roomTypes:[{rateType:'standard',rates:[rate(2,1),rate(1,2)]}]}]});};
 const r=await qaReadRoute(request('/api/hotels/search',{city:'Kuala Lumpur',country:'MY',checkin:'2030-01-10',checkout:'2030-01-12',people:3}),{...env,LITEAPI_ENABLED:'true',LITEAPI_API_KEY:'fixture-not-a-secret',LITEAPI_WHITELABEL_URL:'https://ignored.example'},null,{fetcher});assert.equal(r.status,200);const b=await r.json();assert.equal(b.rooms,2);assert.equal(b.people,3);assert.equal(b.hotels[0].amountIDR,240);assert.equal(b.hotels[0].basis,'stay_total');assert.equal(b.hotels[0].bookingUrl,null);assert(calls.every(url=>url.startsWith('https://api.liteapi.travel/v3.0/')));
});
test('hotel content uses GET metadata/reviews only and errors stay unavailable',async()=>{
 const calls=[];const e={...env,LITEAPI_ENABLED:'true',LITEAPI_API_KEY:'fixture-not-a-secret'};const r=await qaReadRoute(request('/api/hotels/content?hotelId=fixture'),e,null,{fetcher:async(url,init)=>{calls.push(String(url));assert.equal(init.method,'GET');return Response.json({data:String(url).includes('/reviews')?[]:{id:'fixture',name:'Fixture'}});}});assert.equal(r.status,200);assert.equal((await r.json()).hotel.id,'fixture');assert.equal(calls.length,2);
 const failed=await qaReadRoute(request('/api/hotels/content?hotelId=fixture'),e,null,{fetcher:async()=>new Response(null,{status:401})});assert.equal(failed.status,502);
});
test('route table admits only explicit GET/POST reads or disabled operations',()=>{assert.equal(QA_ROUTES['/api/hotels/search'].kind,'supplier');assert.equal(QA_ROUTES['/api/video-itinerary'].kind,'disabled-ai');assert.equal(Object.keys(QA_ROUTES).some(p=>p.includes('/checkout')),false);});
