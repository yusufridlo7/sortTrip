import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import ts from 'typescript';
import {handleBookingEvidence,hotelReceipt,flightTrackingId,trackedFlightUrl,affiliateReceipt} from '../worker/booking-evidence.js';
import {bookingItemKey} from '../worker/booking-identity.mjs';
import {checkoutQuery,handleHotelCheckout} from '../worker/hotel-checkout.js';
import {hotelCheckoutUrl,checkoutStartParams} from '../app/hotel-checkout-link.mjs';
const user='11111111-1111-4111-8111-111111111111',tripId='22222222-2222-4222-8222-222222222222',checkoutId='33333333-3333-4333-8333-333333333333';
const hotel={id:'hotel-1',category:'Penginapan',provider:'LiteAPI',hotelId:'lp_fixture',checkin:'2027-01-30',checkout:'2027-02-01',day:1,title:'Fixture hotel',paid:false,price:500000};
const flight={id:'flight',category:'Pesawat',title:'CGK to KUL',bookingUrl:'https://www.aviasales.com/search/fixture?marker=782849',paid:false,price:1000000};
const trip={id:tripId,start:'2027-01-30',days:3,people:1,origin:'CGK',destination:'kl',items:[hotel,flight]};
const row={id:checkoutId,environment:'live',state:'confirmed',summary:{tripId,itemId:hotel.id,hotelId:hotel.hotelId,checkin:hotel.checkin,checkout:hotel.checkout,adults:1},booking_id:'booking_fixture',updated_at:'2026-10-23T10:00:00Z'};
const env={SUPABASE_URL:'https://db.example',SUPABASE_SERVICE_ROLE_KEY:'fixture-service',SUPABASE_PUBLISHABLE_KEY:'fixture-public',AI_LIMITER:{limit:async()=>({success:true})},TRAVELPAYOUTS_API_TOKEN:'fixture-private',TRAVELPAYOUTS_MARKER:'782849'};
const req=(action,body={tripId},auth=true)=>new Request('https://sorttrip.example/api/bookings/'+action,{method:'POST',headers:{Origin:'https://sorttrip.example',...(auth?{Authorization:'Bearer fixture'}:{}),'Content-Type':'application/json'},body:JSON.stringify(body)});
test('hotel checkout links retain exact itinerary context without breaking standalone hotel searches',()=>{
 const p=new URL(hotelCheckoutUrl(hotel.hotelId,hotel.checkin,hotel.checkout,1,{tripId,itemId:hotel.id}),'https://sorttrip.example').searchParams;
 const q=checkoutStartParams(p);assert.equal(q.tripId,tripId);assert.equal(q.itemId,hotel.id);assert.equal(checkoutQuery(q).tripId,tripId);
 assert.throws(()=>checkoutQuery({...q,tripId:'other'}));assert.throws(()=>checkoutQuery({...q,itemId:''}));
});
test('supplier hotel proof requires live private records and exact trip/item/hotel/dates/occupancy',()=>{
 assert.equal(hotelReceipt(row,trip,tripId).state,'confirmed');
 for(const changed of [{...row,environment:'sandbox'},{...row,state:'ready'},{...row,booking_id:null},{...row,summary:{...row.summary,tripId:user}},{...row,summary:{...row.summary,itemId:'another'}},{...row,summary:{...row.summary,adults:3}}])assert.equal(hotelReceipt(changed,trip,tripId),null);
 assert.equal(hotelReceipt(row,{...trip,items:[{...hotel,checkin:'2027-01-31'}]},tripId),null);
 const pending=hotelReceipt({...row,state:'unknown',booking_id:null},trip,tripId);assert.equal(pending.state,'pending');assert.equal(pending.checkoutId,checkoutId);
});
test('flight tracking identifiers bind user, saved trip and selected item; affiliate marker is preserved',async()=>{
 const key=bookingItemKey(trip,flight),sub=await flightTrackingId(user,tripId,key,'fixture-private');
 assert.match(sub,/^stf_[a-f0-9]{32}$/);assert.notEqual(sub,await flightTrackingId(tripId,user,key,'fixture-private'));
 assert.notEqual(sub,await flightTrackingId(user,tripId,key+'changed','fixture-private'));
 const url=new URL(trackedFlightUrl(flight.bookingUrl,sub));assert.equal(url.searchParams.get('marker'),'782849.'+sub);
 assert.equal(trackedFlightUrl('https://evil.example/search/',sub,'782849'),null);
 assert.equal(trackedFlightUrl('https://www.aviasales.com/search/fixture',sub),null);
 assert.equal(affiliateReceipt([{action_id:'a',action_type:'paid_click',sub_id:'.'+sub,state:'paid'}],sub,flight.id,key,tripId),null);
 assert.equal(affiliateReceipt([{action_id:'a',action_type:'booking',sub_id:'.'+sub,state:'paid'}],sub,flight.id,key,tripId).state,'reported');
 assert.equal(affiliateReceipt([{action_id:'a',action_type:'booking',sub_id:sub,state:'processing'}],sub,flight.id,key,tripId).state,'pending');
 assert.equal(affiliateReceipt(['a','b'].map(action_id=>({action_id,action_type:'booking',sub_id:sub,state:'paid'})),sub,flight.id,key,tripId),null);
});
function fixture({missing=false,conflict=false,providerFailure=false}={}){
 const calls=[],writes=[];
 const fetcher=async(url,options={})=>{
  calls.push(String(url));const u=new URL(url);
  if(u.pathname==='/auth/v1/user')return Response.json({id:user});
  if(u.pathname==='/rest/v1/trips'){
   assert.equal(u.searchParams.get('user_id'),'eq.'+user);
   if(options.method==='PATCH'){writes.push(JSON.parse(options.body));assert.equal(u.searchParams.get('updated_at'),'eq.2026-10-23T09:00:00Z');return Response.json(conflict?[]:[{id:tripId}]);}
   return Response.json(missing?[]:[{id:tripId,data:trip,updated_at:'2026-10-23T09:00:00Z'}]);
  }
  if(u.pathname==='/rest/v1/hotel_checkouts'){assert.equal(u.searchParams.get('summary->>tripId'),'eq.'+tripId);return Response.json([row]);}
  if(u.hostname==='api.travelpayouts.com'){
   if(u.pathname.endsWith('/get_fields_list'))return Response.json({fields:['type','campaign_id','action_id','sub_type','sub_id','state','date','updated_at'].map(name=>({name,available_filters:name==='date'?['eq','ge']:['eq']}))});
   if(providerFailure)return new Response('private upstream must not escape',{status:403});
   assert.equal(u.pathname,'/statistics/v1/execute_query');assert.equal(options.headers['X-Access-Token'],env.TRAVELPAYOUTS_API_TOKEN);const body=JSON.parse(options.body);assert.ok(body.filters.some(f=>f.field==='sub_type'&&f.value==='booking'));const sub=body.filters.find(f=>f.field==='sub_id').value;
   assert.match(sub,/^\.stf_/);return Response.json({results:[{action_id:'affiliate_fixture',type:'action',campaign_id:100,sub_type:'booking',sub_id:sub,state:'paid',updated_at:'2026-10-23'}]});
  }
  throw Error('Unexpected request');
 };
 return {fetcher,calls,writes};
}
test('authenticated evidence sync isolates ownership and persists hotel marks with optimistic concurrency',async()=>{
 const f=fixture();const r=await handleBookingEvidence(req('status'),env,f.fetcher);assert.equal(r.status,200);const data=await r.json();
 assert.equal(data.receipts.find(x=>x.provider==='LiteAPI').state,'confirmed');assert.equal(data.receipts.find(x=>x.provider==='Travelpayouts').state,'reported');assert.equal(data.saved,true);
 assert.equal(f.writes[0].data.items[0].paid,true);assert.equal(f.writes[0].data.items[1].paid,false);assert.ok(!JSON.stringify(data).includes('fixture-private'));
 const conflict=fixture({conflict:true});assert.equal((await(await handleBookingEvidence(req('status'),env,conflict.fetcher)).json()).saved,false);
 const missing=fixture({missing:true});assert.equal((await handleBookingEvidence(req('status'),env,missing.fetcher)).status,404);assert.equal(missing.calls.length,2);
});
test('auth, origin and stale selection checks run before affiliate tracking is issued',async()=>{
 const f=fixture();assert.equal((await handleBookingEvidence(req('status',{tripId},false),env,f.fetcher)).status,401);assert.equal(f.calls.length,0);
 const other=new Request('https://sorttrip.example/api/bookings/status',{method:'POST',headers:{Origin:'https://evil.example'},body:'{}'});assert.equal((await handleBookingEvidence(other,env,f.fetcher)).status,403);
 assert.equal((await handleBookingEvidence(req('flight-link',{tripId,itemId:flight.id,matchKey:'stale'}),env,f.fetcher)).status,409);
 const data=await(await handleBookingEvidence(req('flight-link',{tripId,itemId:flight.id,matchKey:bookingItemKey(trip,flight)}),env,f.fetcher)).json();assert.match(new URL(data.url).searchParams.get('marker'),/^782849\.stf_/);
});
test('upstream statistics rejection stays unverified and cannot expose provider text or fake a purchase',async()=>{
 const f=fixture({providerFailure:true});const current={...env,TRAVELPAYOUTS_API_TOKEN:'fixture-new-rejected-key'};
 const data=await(await handleBookingEvidence(req('status'),current,f.fetcher)).json();
 assert.equal(data.availability.flights,'access_required');assert.equal(data.availability.flightHttpStatus,'403');
 assert.ok(!data.receipts.some(r=>r.provider==='Travelpayouts'));assert.ok(!JSON.stringify(data).includes('private upstream'));
});
test('linked hotel room search checks saved-trip ownership and exact hotel identity before supplier calls',async()=>{
 let providerCalls=0;
 const fetcher=async(url)=>{if(String(url).endsWith('/auth/v1/user'))return Response.json({id:user});if(String(url).includes('/rest/v1/trips'))return Response.json([{data:{...trip,items:[{...hotel,hotelId:'another-hotel'}]}}]);providerCalls++;throw Error('No supplier call allowed');};
 const request=new Request('https://sorttrip.example/api/hotels/checkout/rooms',{method:'POST',headers:{Authorization:'Bearer fixture'},body:JSON.stringify({hotelId:hotel.hotelId,checkin:hotel.checkin,checkout:hotel.checkout,people:1,tripId,itemId:hotel.id})});
 const response=await handleHotelCheckout(request,{...env,LITEAPI_CHECKOUT_ENABLED:'true',LITEAPI_CHECKOUT_MODE:'live',LITEAPI_BOOKING_LIVE_APPROVED:'true',LITEAPI_API_KEY:'prod_fixture_not_real'},fetcher);
 assert.equal(response.status,409);assert.equal(providerCalls,0);
});
let code=ts.transpileModule(await readFile(new URL('../app/booking-receipts.ts',import.meta.url),'utf8'),{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ES2022}}).outputText.replace('../worker/booking-identity.mjs',new URL('../worker/booking-identity.mjs',import.meta.url).href);
const {applyBookingReceipts,manualBookingMark}=await import('data:text/javascript;base64,'+Buffer.from(code).toString('base64'));
test('client cannot treat cached JSON or another trip as supplier proof; affiliate reports do not mark airline tickets paid',()=>{
 const confirmed=hotelReceipt(row,trip,tripId),reported={tripId,itemId:flight.id,matchKey:bookingItemKey(trip,flight),provider:'Travelpayouts',state:'reported'};
 const next=applyBookingReceipts(trip,[confirmed,reported]);assert.equal(next.items[0].paid,true);assert.equal(next.items[0].purchaseSource,'provider');assert.equal(next.items[1].paid,false);
 assert.equal(applyBookingReceipts({...trip,id:user},[confirmed]).items[0].paid,false);
 const changed=applyBookingReceipts({...next,people:3},[confirmed]);assert.equal(changed.items[0].paid,false);
 const cancelled=applyBookingReceipts(next,[{...confirmed,state:'cancelled'}]);assert.equal(cancelled.items[0].paid,true); // cancellation does not prove a refund
 const held=applyBookingReceipts(trip,[{...confirmed,state:'pending'}]);assert.equal(held.items[0].paid,false);assert.equal(held.items[0].bookingHold,true);
 assert.equal(manualBookingMark(next.items[0],false).purchaseSource,undefined);
});

test('unsupported booking-discriminator metadata fails closed without issuing an invalid query',async()=>{
 const f=fixture();let queried=false;
 const isolated=async(url,options)=>{
  if(String(url).endsWith('/auth/v1/user'))return Response.json({id:checkoutId});
  if(String(url).includes('/rest/v1/'))return Response.json(String(url).includes('/trips')?[{id:tripId,data:trip,updated_at:'2026-10-23'}]:[]);
  if(String(url).endsWith('/get_fields_list?campaign_id=100'))return Response.json({fields:['action_id','campaign_id','date','state','sub_id','type','updated_at'].map(name=>({name,available_filters:['eq','ge']}))});
  if(String(url).endsWith('/execute_query'))queried=true;
  return f.fetcher(url,options);
 };
 const data=await(await handleBookingEvidence(req('status'),env,isolated)).json();
 assert.equal(queried,false);assert.equal(data.availability.flightQueryIssue,'REQUIRED_FIELDS_UNAVAILABLE');assert.equal(data.availability.flights,'unavailable');assert.equal(data.receipts.length,0);
});
