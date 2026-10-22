import {test} from 'node:test';
import assert from 'node:assert/strict';
import {checkoutMode,checkoutQuery,checkoutGuests,checkoutPayable,sealCheckout,openCheckout,verifiedBooking,handleHotelCheckout} from '../worker/hotel-checkout.js';
import {hotelCheckoutUrl,checkoutStartParams,checkoutResumeId,checkoutReturnUrl} from '../app/hotel-checkout-link.mjs';
const user='00000000-0000-4000-8000-000000000001',other='00000000-0000-4000-8000-000000000002';
const env={LITEAPI_CHECKOUT_ENABLED:'true',LITEAPI_CHECKOUT_MODE:'sandbox',LITEAPI_API_KEY:'sand_fixture_only',OWNER_USER_ID:user,SUPABASE_URL:'https://fixture.supabase.co',SUPABASE_PUBLISHABLE_KEY:'fixture',SUPABASE_SERVICE_ROLE_KEY:'fixture',AI_LIMITER:{limit:async()=>({success:true})}};
const q={hotelId:'lp_fixture',checkin:'2027-01-10',checkout:'2027-01-12',people:2};
test('optional supplier terms do not reject valid prices; missing or changed payable totals fail closed',()=>{
 for(const terms of [undefined,null,'','Supplier rules'])assert.deepEqual(checkoutPayable({price:1000000,termsAndConditions:terms},1000000),{terms:terms??''});
 assert.deepEqual(checkoutPayable({retailRate:{total:[{amount:1000000,currency:'IDR'}]}},1000000),{terms:''});
 for(const price of [null,undefined,'',false,0,-1,Infinity])assert.throws(()=>checkoutPayable({price},1000000),e=>e.validationReason==='payable_missing');
 assert.throws(()=>checkoutPayable({price:999999},1000000),e=>e.validationReason==='payable_mismatch');
 for(const terms of [{},[],1,'x'.repeat(20001)])assert.throws(()=>checkoutPayable({price:1000000,termsAndConditions:terms},1000000),e=>e.validationReason==='terms_invalid');
});
test('hotel checkout date cannot be mistaken for payment-return session; links preserve dates and guests',()=>{
 const p=new URL(hotelCheckoutUrl(q.hotelId,q.checkin,q.checkout,q.people),'https://sorttrip.test').searchParams;
 assert.deepEqual(checkoutStartParams(p),q);assert.equal(checkoutResumeId(p),null);
 p.set('checkoutId',user);assert.equal(checkoutResumeId(p),user);assert.equal(checkoutStartParams(p).checkout,q.checkout);
 p.set('checkoutId',q.checkout);assert.equal(checkoutResumeId(p),null);
});
const guest={holder:{firstName:'Test',lastName:'Contact',email:'test@example.test'},guests:[{firstName:'Test',lastName:'Guest'}],acceptTerms:true};
const req=(action,body,owner=user)=>new Request('https://sorttrip.test/api/hotels/checkout/'+action+(body===undefined?'?id='+owner:''),{method:body===undefined?'GET':'POST',headers:{Origin:'https://sorttrip.test',Authorization:'Bearer fixture'},...(body?{body:JSON.stringify(body)}:{})});
function fixture({missing=false,changed=false,timeout=false,documented=false,sspHigher=false}={}){
 const rows=new Map(),calls=[];let identity=user,books=0,providerConfirmed=false;
 const rate={adultCount:2,childCount:0,occupancyNumber:1,name:'Twin room',retailRate:{total:[{amount:1000000,currency:'IDR'}],suggestedSellingPrice:[{amount:1000000,currency:'IDR'}],taxesAndFees:[{included:true}]},cancellationPolicies:{refundableTag:'RFN',cancelPolicyInfos:[{cancelTime:'2027-01-08 12:00:00',amount:1000000,currency:'IDR'}]}};
 const offer={offerId:'private-offer',rateType:'standard',rates:[rate]};
 if(sspHigher)rate.retailRate.suggestedSellingPrice[0].amount=1150000;
 function booking(row){return {bookingId:'booking_fixture',clientReference:row.id,status:'CONFIRMED',hotel:{hotelId:q.hotelId},checkin:q.checkin,checkout:q.checkout,hotelConfirmationCode:'hotel_fixture'};}
 const fetcher=async(url,options={})=>{
  calls.push(String(url));const u=new URL(url),b=options.body?JSON.parse(options.body):null;
  if(u.pathname==='/auth/v1/user')return Response.json({id:identity});
  if(u.pathname.startsWith('/rest/v1/')){
   assert.equal(options.redirect,'manual');
   assert.equal(options.headers.apikey,env.SUPABASE_SERVICE_ROLE_KEY);
   if(missing)return new Response('',{status:404});
   if(u.pathname.endsWith('/rpc/claim_hotel_checkout')){const row=rows.get(b.p_id);if(row&&row.user_id===b.p_user&&row.environment===b.p_environment&&row.state===b.p_from){row.state=b.p_to;return Response.json([row]);}return Response.json([]);}
   if(options.method==='POST'){rows.set(b.id,structuredClone(b));return Response.json([b]);}
   if(u.searchParams.get('limit')==='0')return Response.json([]);
   if(u.searchParams.get('state'))return Response.json([...rows.values()].filter(r=>r.user_id===identity));
   const id=(u.searchParams.get('id')||'').slice(3),row=rows.get(id);
   if(!row||u.searchParams.get('user_id')!=='eq.'+row.user_id)return Response.json([]);
   if(options.method==='PATCH'){Object.assign(row,b);return Response.json([row]);}
   return Response.json([row]);
  }
  assert.ok(!u.href.includes(env.LITEAPI_API_KEY));
  assert.equal(options.headers['X-API-Key'],env.LITEAPI_API_KEY);
  assert.equal(options.redirect,'manual');
  if(u.pathname.endsWith('/data/hotel'))return Response.json({data:{id:q.hotelId,name:'Fixture Hotel'}});
  if(u.pathname.endsWith('/hotels/rates'))return Response.json({sandbox:true,data:[{hotelId:q.hotelId,roomTypes:[offer]}]});
  if(u.pathname.endsWith('/rates/prebook')){assert.equal(b.offerId,'private-offer');assert.equal(b.usePaymentSdk,true);const data={prebookId:'prebook_fixture',transactionId:'private-transaction',secretKey:'private-sdk-secret',hotelId:q.hotelId,checkin:q.checkin,checkout:q.checkout,currency:'IDR',paymentTypes:['TRANSACTION_ID'],termsAndConditions:'Fixture supplier terms',roomTypes:[{rates:[rate]}],retailRate:{total:[{amount:1000000,currency:'IDR'}]},cancellationChanged:changed};if(documented){delete data.paymentTypes;delete data.retailRate;data.price=1000000;data.termsAndConditions='';data.roomTypes[0].rates[0].paymentTypes=['NUITEE_PAY'];}return Response.json({data});}
  if(u.pathname.endsWith('/rates/book')){books++;assert.equal(b.payment.method,'TRANSACTION_ID');assert.equal(b.payment.transactionId,'private-transaction');assert.equal(b.prebookId,'prebook_fixture');providerConfirmed=true;if(timeout)throw Error('fixture provider uncertainty');return Response.json({data:booking(rows.get(b.clientReference))});}
  if(u.pathname.endsWith('/bookings'))return Response.json({data:providerConfirmed?[booking(rows.get(u.searchParams.get('clientReference')))]:[]});
  throw Error('unexpected fixture URL');
 };
 return {rows,calls,fetcher,setIdentity:v=>{identity=v},bookCount:()=>books};
}
async function choose(f){const r=await handleHotelCheckout(req('rooms',{...q,offerId:'attacker',price:1}),env,f.fetcher);assert.equal(r.status,200);const data=await r.json();assert.equal(data.options.length,1);assert.ok(!JSON.stringify(data).includes('private-offer'));return data.options[0];}
async function prepare(f,row){const r=await handleHotelCheckout(req('prebook',{id:row.id,...guest}),env,f.fetcher);return {response:r,body:await r.json()};}
test('authenticated checkout uses supplier payable rather than public SSP floor and validates Prebook consistently',async()=>{
 const f=fixture({sspHigher:true}),row=await choose(f);
 assert.equal(row.summary.amountIDR,1000000);
 const result=await prepare(f,row);assert.equal(result.response.status,200);assert.equal(result.body.state,'ready');assert.equal(result.body.summary.amountIDR,1000000);assert.equal(result.body.payment,undefined);assert.equal(f.bookCount(),0);
});
test('checkout is opt-in, sandbox owner-only, production requires separate approval and correct key mode',async()=>{
 assert.equal(checkoutMode({}),null);assert.equal(checkoutMode({...env,LITEAPI_CHECKOUT_MODE:'live'}),null);assert.equal(checkoutMode({...env,LITEAPI_CHECKOUT_MODE:'live',LITEAPI_API_KEY:'prod_fixture_only'}),null);
 assert.equal(checkoutMode({...env,LITEAPI_CHECKOUT_MODE:'live',LITEAPI_API_KEY:'prod_fixture_only',LITEAPI_BOOKING_LIVE_APPROVED:'true'}),'live');
 const f=fixture();f.setIdentity(other);assert.equal((await handleHotelCheckout(req('rooms',q),env,f.fetcher)).status,403);assert.equal(f.calls.filter(u=>u.includes('liteapi.travel')).length,0);
 assert.equal((await handleHotelCheckout(req('rooms',q),{},f.fetcher)).status,503);
});
test('strict guest/date checks and authenticated ciphertext keep provider/payment data out of storage plaintext',async()=>{
 assert.equal(checkoutQuery(q).rooms,1);assert.throws(()=>checkoutQuery({...q,checkin:'2027-02-30'}));assert.throws(()=>checkoutGuests({...guest,guests:[]},1));
 const sealed=await sealCheckout(env,{secretKey:'private-sdk-secret',holder:guest.holder});assert.ok(!sealed.includes('private-sdk-secret'));assert.deepEqual((await openCheckout(env,sealed)).holder,guest.holder);await assert.rejects(openCheckout({...env,LITEAPI_API_KEY:'sand_another_key'},sealed));
});
test('missing storage prevents supplier work; changed final conditions require review before SDK or booking',async()=>{
 const absent=fixture({missing:true});assert.equal((await handleHotelCheckout(req('rooms',q),env,absent.fetcher)).status,502);assert.equal(absent.calls.filter(u=>u.includes('liteapi.travel')).length,0);
 const f=fixture({changed:true}),row=await choose(f),result=await prepare(f,row);assert.equal(result.response.status,200);assert.equal(f.rows.get(row.id).state,'ready');assert.equal(result.body.summary.changed,true);assert.equal(result.body.summary.previousAmountIDR,row.summary.amountIDR);assert.ok(!JSON.stringify(result.body).includes('private-sdk-secret'));assert.equal(f.bookCount(),0);
 assert.equal((await handleHotelCheckout(req('payment',{id:row.id}),env,f.fetcher)).status,409);
 assert.equal((await handleHotelCheckout(req('book',{id:row.id,confirmBooking:true}),env,f.fetcher)).status,400);assert.equal(f.bookCount(),0);
});
test('SDK checkout persists prebook once, reviews final terms, isolates owners and confirms exactly once',async()=>{
 const f=fixture(),row=await choose(f),result=await prepare(f,row);assert.equal(result.response.status,200);assert.equal(result.body.state,'ready');assert.equal(result.body.payment,undefined);
 assert.ok(!JSON.stringify(f.rows.get(row.id)).includes(guest.holder.email));
 assert.equal((await handleHotelCheckout(req('prebook',{id:row.id,...guest}),env,f.fetcher)).status,409);
 assert.equal((await handleHotelCheckout(req('payment',{id:row.id}),env,f.fetcher)).status,409);
 const pay=await handleHotelCheckout(req('payment',{id:row.id,acceptFinalTerms:true}),env,f.fetcher),payment=(await pay.json()).payment;
 assert.equal(payment.publicKey,'sandbox');assert.equal(payment.returnUrl,'https://sorttrip.test/hotel-checkout?checkoutId='+row.id);assert.equal(payment.secretKey,'private-sdk-secret');
 // Independent concurrent requests cannot produce two upstream bookings.
 const booked=await Promise.all([handleHotelCheckout(req('book',{id:row.id,confirmBooking:true}),env,f.fetcher),handleHotelCheckout(req('book',{id:row.id,confirmBooking:true}),env,f.fetcher)]);
 assert.ok(booked.some(r=>r.status===200));assert.equal(f.bookCount(),1);assert.equal(f.rows.get(row.id).state,'confirmed');
 const again=await handleHotelCheckout(req('book',{id:row.id,confirmBooking:true}),env,f.fetcher);assert.equal(again.status,200);assert.equal(f.bookCount(),1);
 assert.ok(!f.calls.some(u=>/reserve_ai|trip_pass|payments\//.test(u)));
 // A live deployment user cannot read another user's checkout.
 f.setIdentity(other);const live={...env,LITEAPI_CHECKOUT_MODE:'live',LITEAPI_BOOKING_LIVE_APPROVED:'true',LITEAPI_API_KEY:'prod_fixture_only'};assert.equal((await handleHotelCheckout(req('status',undefined,row.id),live,f.fetcher)).status,404);
});
test('actual supplier price changes are shown for fresh consent; inconsistent payable still fails closed',async()=>{
 for(const consistent of [true,false]){
  const f=fixture(),row=await choose(f);
  const response=await handleHotelCheckout(req('prebook',{id:row.id,...guest}),env,async(u,o)=>{
   const result=await f.fetcher(u,o);if(!String(u).endsWith('/rates/prebook'))return result;
   const b=await result.json();b.data.roomTypes[0].rates[0].retailRate.total[0].amount=1100000;
   if(consistent)b.data.retailRate.total[0].amount=1100000;return Response.json(b);
  });
  const b=await response.json();
  if(consistent){assert.equal(response.status,200);assert.equal(b.state,'ready');assert.equal(b.summary.changed,true);assert.equal(b.summary.previousAmountIDR,1000000);assert.equal(b.summary.amountIDR,1100000);assert.equal(b.payment,undefined);assert.equal((await handleHotelCheckout(req('payment',{id:row.id}),env,f.fetcher)).status,409);}
  else{assert.equal(response.status,502);assert.equal(f.rows.get(row.id).state,'failed');assert.equal(f.rows.get(row.id).summary.validationReason,'payable_mismatch');}
  assert.equal(f.bookCount(),0);
 }
});
test('lost Book response stays uncertain and reconciles by server-owned reference without a second booking',async()=>{
 const f=fixture({timeout:true}),row=await choose(f);await prepare(f,row);await handleHotelCheckout(req('payment',{id:row.id,acceptFinalTerms:true}),env,f.fetcher);
 const lost=await handleHotelCheckout(req('book',{id:row.id,confirmBooking:true}),env,f.fetcher);assert.equal(lost.status,202);assert.equal(f.rows.get(row.id).state,'unknown');
 assert.equal((await handleHotelCheckout(req('book',{id:row.id,confirmBooking:true}),env,f.fetcher)).status,409);assert.equal(f.bookCount(),1);
 const status=await handleHotelCheckout(req('status',undefined,row.id),env,f.fetcher);assert.equal((await status.json()).state,'confirmed');assert.equal(f.bookCount(),1);
});
test('payment redirect or mismatched booking details cannot establish confirmed state',()=>{
 const row={id:user,summary:{...q}};assert.equal(verifiedBooking({status:'CONFIRMED',bookingId:'booking_fixture'},row),null);
 assert.equal(verifiedBooking({bookingId:'booking_fixture',clientReference:user,status:'CONFIRMED',hotel:{hotelId:'other'},checkin:q.checkin,checkout:q.checkout},row),null);
});
test('checkout stages have independent rate keys so room search does not block payment portal',async()=>{
 const keys=[],f=fixture(),limited={...env,AI_LIMITER:{limit:async({key})=>{keys.push(key);return {success:true};}}};
 const rooms=await handleHotelCheckout(req('rooms',q),limited,f.fetcher),row=(await rooms.json()).options[0];
 await handleHotelCheckout(req('prebook',{id:row.id,...guest}),limited,f.fetcher);
 const portal=await handleHotelCheckout(req('payment',{id:row.id,acceptFinalTerms:true}),limited,f.fetcher);assert.equal(portal.status,200);
 assert.equal(new Set(keys).size,3);assert.ok(keys.every(k=>k.startsWith('hotel-checkout:')));
});
test('database trailing slash is normalized without following redirects or disclosing upstream exceptions',async()=>{
 const f=fixture(),calls=[];
 const r=await handleHotelCheckout(req('rooms',q),{...env,SUPABASE_URL:env.SUPABASE_URL+'/'},async(u,o)=>{calls.push(String(u));return f.fetcher(u,o);});assert.equal(r.status,200);assert.ok(calls.every(u=>!new URL(u).pathname.includes('//')));
 const fail=await handleHotelCheckout(req('rooms',q),env,async(u,o)=>{if(String(u).includes('/rest/v1/'))throw TypeError('fixture-private-diagnostic');return f.fetcher(u,o);});assert.equal(fail.status,502);assert.equal((await fail.json()).error,'hotel_checkout_storage');
});

test('documented Prebook price and empty terms are accepted without invented top-level fields',async()=>{const f=fixture({documented:true}),row=await choose(f),result=await prepare(f,row);assert.equal(result.response.status,200);assert.equal(result.body.state,'ready');assert.equal(result.body.summary.amountIDR,1000000);assert.equal(result.body.payment,undefined);assert.equal(f.bookCount(),0);});
test('failed and expired selections explain recovery without another supplier call',async()=>{const f=fixture(),row=await choose(f);f.rows.get(row.id).state='failed';let r=await prepare(f,row);assert.equal(r.body.error,'hotel_checkout_failed');f.rows.get(row.id).state='selected';f.rows.get(row.id).expires_at=new Date(0).toISOString();r=await prepare(f,row);assert.equal(r.body.error,'hotel_checkout_expired');assert.equal(f.calls.filter(u=>u.endsWith('/rates/prebook')).length,0);});

test('supplier session errors preserve only HTTP status and a fixed stage, without exposing provider bodies',async()=>{const f=fixture(),row=await choose(f);const response=await handleHotelCheckout(req('prebook',{id:row.id,...guest}),env,async(u,o)=>String(u).endsWith('/rates/prebook')?new Response('private supplier diagnostic',{status:403}):f.fetcher(u,o));assert.equal(response.status,502);const b=await response.json();assert.equal(b.error,'hotel_checkout_session_failed');assert.equal(f.rows.get(row.id).summary.prebookFailure,'supplier_request');assert.equal(f.rows.get(row.id).summary.supplierStatus,403);assert.ok(!JSON.stringify(b).includes('private'));assert.ok(!JSON.stringify(f.rows.get(row.id).summary).includes('private'));assert.equal(f.bookCount(),0);});

test('empty inventory differs from supplier rates rejected by public tax checks',async()=>{for(const available of [false,true]){const f=fixture();const r=await handleHotelCheckout(req('rooms',q),env,async(u,o)=>{const response=await f.fetcher(u,o);if(!String(u).endsWith('/hotels/rates'))return response;const data=await response.json();if(available)data.data[0].roomTypes[0].rates[0].retailRate.taxesAndFees[0].included=false;else data.data=[];return Response.json(data);});const b=await r.json();assert.deepEqual(b.options,[]);assert.equal(b.reason,available?'hotel_checkout_rates_filtered':'hotel_no_results');assert.deepEqual(b.rejections,available?{taxes:1}:{});assert.ok(!JSON.stringify(b).includes('private-offer'));assert.equal(f.rows.size,0);assert.equal(f.bookCount(),0);}});

test('SDK returns to frontend origin rather than local API proxy and excludes payment query fields',()=>{assert.equal(checkoutReturnUrl('http://127.0.0.1:4173',user),'http://127.0.0.1:4173/hotel-checkout?checkoutId='+user);assert.equal(checkoutReturnUrl('http://127.0.0.1:5173',user),'http://127.0.0.1:5173/hotel-checkout?checkoutId='+user);assert.equal(checkoutReturnUrl('https://sorttrip.test',user),'https://sorttrip.test/hotel-checkout?checkoutId='+user);assert.throws(()=>checkoutReturnUrl('javascript:alert(1)',user));assert.throws(()=>checkoutReturnUrl('https://sorttrip.test','untrusted-reference'));});
