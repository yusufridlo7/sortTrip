import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {paymentResult,validSignature,handlePayments,tripKey} from '../worker/payments.js';
const order={id:'st-sandbox-abcdefghijk'};const paid={order_id:order.id,gross_amount:'15000.00',currency:'IDR',transaction_status:'settlement'};
test('payment requires exact order, IDR and amount',()=>{assert.equal(paymentResult(paid,order),'paid');for(const patch of [{order_id:'other'},{gross_amount:'1500'},{gross_amount:'15000.50'},{currency:'USD'}])assert.throws(()=>paymentResult({...paid,...patch},order));});
test('pending and challenged cards never grant access; refunds revoke',()=>{assert.equal(paymentResult({...paid,transaction_status:'pending'},order),'pending');assert.equal(paymentResult({...paid,fraud_status:'challenge'},order),'pending');assert.equal(paymentResult({...paid,transaction_status:'capture',payment_type:'credit_card',fraud_status:'accept'},order),'paid');assert.equal(paymentResult({...paid,transaction_status:'refund'},order),'refund');});
test('webhook signature checks exact amount and server key',async()=>{const p={...paid,status_code:'200'};p.signature_key=createHash('sha512').update(p.order_id+p.status_code+p.gross_amount+'secret').digest('hex');assert.equal(await validSignature(p,'secret'),true);assert.equal(await validSignature(p,'wrong'),false);assert.equal(await validSignature({...p,gross_amount:'1'},'secret'),false);});
test('trip identity agrees with Basic and Price Watch keys',()=>{assert.equal(tripKey({destination:'kl',start:'2027-01-01'}),'kuala lumpur|2027-01-01');assert.equal(tripKey({destinationMeta:{city:'Tokyo'},start:'2027-01-01'}),'tokyo|2027-01-01');});
const uid='12345678-1234-1234-1234-123456789012',tid='87654321-1234-1234-1234-123456789012';
const env={SUPABASE_URL:'https://db.test',SUPABASE_PUBLISHABLE_KEY:'public',SUPABASE_SERVICE_ROLE_KEY:'service',OWNER_TEST_ENABLED:'true',OWNER_USER_ID:'different-owner'};
const req=action=>new Request('https://sorttrip.test/api/payments/'+action,{method:'POST',headers:{Authorization:'Bearer test'},body:JSON.stringify({tripId:tid})});
test('non-owner cannot grant a test pass',async()=>{const old=globalThis.fetch;let writes=0;globalThis.fetch=async(url,opt)=>{if(String(url).endsWith('/auth/v1/user'))return Response.json({id:uid});if(String(url).includes('/trips?'))return Response.json([{id:tid,data:{destination:'kl',start:'2027-01-01'}}]);writes++;throw Error('unexpected')};try{assert.equal((await handlePayments(req('owner-test'),env)).status,403);assert.equal(writes,0)}finally{globalThis.fetch=old}});
test('owner test is isolated, fixed duration and idempotent insert',async()=>{const old=globalThis.fetch;let inserted;globalThis.fetch=async(url,opt)=>{if(String(url).endsWith('/auth/v1/user'))return Response.json({id:uid});if(String(url).includes('/trips?'))return Response.json([{id:tid,data:{destination:'kl',start:'2027-01-01'}}]);assert.ok(opt.headers.Prefer.includes('ignore-duplicates'));inserted=JSON.parse(opt.body);return Response.json([])};try{assert.equal((await handlePayments(req('owner-test'),{...env,OWNER_USER_ID:uid})).status,200);assert.equal(inserted.user_id,uid);assert.equal(inserted.request_limit,20);assert.ok(inserted.payment_reference.startsWith('owner-test:'));}finally{globalThis.fetch=old}});
test('unsigned webhook rejected without querying payment status or granting access',async()=>{const r=await handlePayments(new Request('https://sorttrip.test/api/payments/webhook',{method:'POST',body:JSON.stringify(paid)}),{...env,MIDTRANS_SERVER_KEY:'secret'});assert.equal(r.status,403)});
test('valid webhook rechecks Midtrans rather than trusting payload status',async()=>{const old=globalThis.fetch;let applied;const p={...paid,status_code:'200'};p.signature_key=createHash('sha512').update(p.order_id+p.status_code+p.gross_amount+'secret').digest('hex');globalThis.fetch=async(url,opt)=>{if(String(url).includes('payment_orders?'))return Response.json([{...order,environment:'sandbox'}]);if(String(url).includes('api.sandbox.midtrans.com'))return Response.json({...paid,transaction_status:'pending'});applied=JSON.parse(opt.body);return new Response(null,{status:204})};try{const r=await handlePayments(new Request('https://sorttrip.test/api/payments/webhook',{method:'POST',body:JSON.stringify(p)}),{...env,MIDTRANS_SERVER_KEY:'secret'});assert.equal(r.status,200);assert.equal(applied.p_status,'pending')}finally{globalThis.fetch=old}});

test('production checkout creates a Midtrans Snap redirect with exact price; no browser payment occurs',async()=>{
 const old=globalThis.fetch;let snapBody,orderBody;
 globalThis.fetch=async(url,opt)=>{
  const u=String(url);
  if(u.endsWith('/auth/v1/user'))return Response.json({id:uid,email:'qa@example.test'});
  if(u.includes('/trips?'))return Response.json([{id:tid,data:{destination:'kl',start:'2027-01-01'}}]);
  if(u.includes('trip_passes?')||u.includes('status=in.'))return Response.json([]);
  if(u==='https://app.midtrans.com/snap/v1/transactions'){snapBody=JSON.parse(opt.body);assert.equal(opt.method,'POST');return Response.json({redirect_url:'https://app.midtrans.com/snap/v2/vtweb/test-checkout'});}
  if(u.endsWith('/payment_orders')){orderBody=JSON.parse(opt.body);return Response.json([]);}
  if(u.includes('payment_orders?id=')&&opt.method==='PATCH')return Response.json([]);
  throw Error('Unexpected route');
 };
 try{const r=await handlePayments(req('checkout'),{...env,MIDTRANS_SERVER_KEY:'test-only-fixture',MIDTRANS_ENV:'production',PAYMENTS_ENABLED:'true',AI_LIMITER:{limit:async()=>({success:true})}});assert.equal(r.status,200);const b=await r.json();assert.equal(b.mode,'production');assert.equal(new URL(b.checkoutUrl).hostname,'app.midtrans.com');assert.equal(snapBody.transaction_details.gross_amount,15000);assert.equal(orderBody.amount,15000);assert.equal(orderBody.trip_id,tid);}finally{globalThis.fetch=old;}
});
test('checkout does not duplicate an existing pending Midtrans order',async()=>{
 const old=globalThis.fetch;let writes=0;
 globalThis.fetch=async(url,opt)=>{
  if(String(url).endsWith('/auth/v1/user'))return Response.json({id:uid});
  if(String(url).includes('/trips?'))return Response.json([{id:tid,data:{destination:'kl',start:'2027-01-01'}}]);
  if(String(url).includes('trip_passes?'))return Response.json([]);
  if(String(url).includes('status=in.'))return Response.json([{id:'pending',checkout_url:'https://app.midtrans.com/snap/v2/vtweb/pending'}]);
  writes++;throw Error('Unexpected write');
 };
 try{const r=await handlePayments(req('checkout'),{...env,MIDTRANS_SERVER_KEY:'test-only-fixture',MIDTRANS_ENV:'production',PAYMENTS_ENABLED:'true',AI_LIMITER:{limit:async()=>({success:true})}});assert.equal(r.status,200);assert.equal((await r.json()).orderId,'pending');assert.equal(writes,0);}finally{globalThis.fetch=old;}
});
test('status exposes active entitlement and explicit purchase gate without returning configuration values',async()=>{
 const old=globalThis.fetch;
 globalThis.fetch=async url=>{
  if(String(url).endsWith('/auth/v1/user'))return Response.json({id:uid});
  if(String(url).includes('/trips?'))return Response.json([{id:tid,data:{destination:'kl',start:'2027-01-01'}}]);
  if(String(url).includes('payment_orders?'))return Response.json([]);
  return Response.json([{expires_at:'2027-02-01',request_limit:20,requests:3,payment_reference:'st-production-test'}]);
 };
 try{const r=await handlePayments(req('status'),env);assert.equal(r.status,200);const b=await r.json();assert.equal(b.pass.remaining,17);assert.equal(b.pass.test,false);assert.equal(b.checkoutEnabled,false);assert.match(b.checkoutReason,/Midtrans server/);assert.ok(!Object.hasOwn(b,'MIDTRANS_SERVER_KEY'));}finally{globalThis.fetch=old;}
});

test('Midtrans rejection exposes only fixed description and HTTP status, never provider body',async()=>{
 const old=globalThis.fetch;
 globalThis.fetch=async(url,opt)=>{
  const u=String(url);
  if(u.endsWith('/auth/v1/user'))return Response.json({id:uid,email:'qa@example.test'});
  if(u.includes('/trips?'))return Response.json([{id:tid,data:{destination:'kl',start:'2027-01-01'}}]);
  if(u==='https://app.midtrans.com/snap/v1/transactions')return Response.json({error_messages:['PRIVATE_PROVIDER_BODY']},{status:401});
  return Response.json([]);
 };
 try{const r=await handlePayments(req('checkout'),{...env,MIDTRANS_SERVER_KEY:'FIXTURE_ONLY',MIDTRANS_ENV:'production',PAYMENTS_ENABLED:'true',AI_LIMITER:{limit:async()=>({success:true})}});assert.equal(r.status,502);const b=await r.json();assert.equal(b.code,'MIDTRANS_REJECTED');assert.equal(b.upstreamStatus,401);assert.ok(!JSON.stringify(b).includes('PRIVATE_PROVIDER_BODY'));assert.ok(!JSON.stringify(b).includes('FIXTURE_ONLY'));}finally{globalThis.fetch=old;}
});

test('status rate limit defers provider refresh without disabling checkout status or calling Midtrans',async()=>{
 const old=globalThis.fetch;let providerCalls=0;
 globalThis.fetch=async url=>{
  const u=String(url);if(u.endsWith('/auth/v1/user'))return Response.json({id:uid});
  if(u.includes('/trips?'))return Response.json([{id:tid,data:{destination:'kl',start:'2027-01-01'}}]);
  if(u.includes('payment_orders?'))return Response.json([{id:'st-sandbox-test-order',status:'pending'}]);
  if(u.includes('midtrans.com')){providerCalls++;throw Error('Provider refresh must stay rate limited');}
  return Response.json([]);
 };
 try{const request=new Request('https://sorttrip.test/api/payments/status',{method:'POST',headers:{Authorization:'Bearer test'},body:JSON.stringify({tripId:tid,refresh:true})});const r=await handlePayments(request,{...env,OWNER_USER_ID:uid,MIDTRANS_SERVER_KEY:'FIXTURE_ONLY',AI_LIMITER:{limit:async()=>({success:false})}});assert.equal(r.status,200);const b=await r.json();assert.equal(b.status,'pending');assert.equal(b.checkoutEnabled,true);assert.equal(b.refreshDeferred,true);assert.equal(providerCalls,0);assert.equal(b.pass,null);}finally{globalThis.fetch=old;}
});

test('status provider rejection keeps stored state and returns only safe diagnostic fields',async()=>{
 const old=globalThis.fetch;
 globalThis.fetch=async url=>{
  const u=String(url);if(u.endsWith('/auth/v1/user'))return Response.json({id:uid});
  if(u.includes('/trips?'))return Response.json([{id:tid,data:{destination:'kl',start:'2027-01-01'}}]);
  if(u.includes('payment_orders?'))return Response.json([{id:'st-sandbox-fixture',status:'created'}]);
  if(u.includes('api.sandbox.midtrans.com'))return Response.json({private:'DO_NOT_EXPOSE'},{status:401});
  return Response.json([]);
 };
 try{const request=new Request('https://sorttrip.test/api/payments/status',{method:'POST',headers:{Authorization:'Bearer test'},body:JSON.stringify({tripId:tid,refresh:true})});const r=await handlePayments(request,{...env,OWNER_USER_ID:uid,MIDTRANS_SERVER_KEY:'FIXTURE_ONLY',AI_LIMITER:{limit:async()=>({success:true})}});const b=await r.json();assert.equal(r.status,200);assert.equal(b.status,'created');assert.equal(b.pass,null);assert.deepEqual(b.verificationError,{code:'MIDTRANS_REJECTED',httpStatus:401});assert.ok(!JSON.stringify(b).includes('DO_NOT_EXPOSE'));}finally{globalThis.fetch=old;}
});

test('Snap not-started response restores only validated existing checkout, without granting a pass or creating an order',async()=>{
 const old=globalThis.fetch;
 try{for(const [httpStatus,checkout,expected] of [[200,'https://app.sandbox.midtrans.com/snap/v2/vtweb/fixture',true],[404,'https://app.sandbox.midtrans.com/snap/v2/vtweb/fixture',true],[200,'https://evil.example.test/checkout',false]]){
  let writes=0;
  globalThis.fetch=async(url,opt)=>{
   const u=String(url);if(u.endsWith('/auth/v1/user'))return Response.json({id:uid});
   if(u.includes('/trips?'))return Response.json([{id:tid,data:{destination:'kl',start:'2027-01-01'}}]);
   if(u.includes('payment_orders?'))return Response.json([{id:'st-sandbox-fixture',status:'created',checkout_url:checkout}]);
   if(u.includes('api.sandbox.midtrans.com'))return Response.json({status_code:'404',status_message:'PRIVATE_PROVIDER_TEXT'},{status:httpStatus});
   if(opt?.method!=='GET')writes++;
   return Response.json([]);
  };
  const request=new Request('https://sorttrip.test/api/payments/status',{method:'POST',headers:{Authorization:'Bearer test'},body:JSON.stringify({tripId:tid,refresh:true})});
  const r=await handlePayments(request,{...env,OWNER_USER_ID:uid,MIDTRANS_SERVER_KEY:'FIXTURE_ONLY',AI_LIMITER:{limit:async()=>({success:true})}});const b=await r.json();assert.equal(r.status,200);assert.equal(b.status,'created');assert.equal(b.pass,null);assert.equal(b.verificationError.code,'CHECKOUT_NOT_STARTED');assert.equal(b.checkoutUrl,expected?checkout:null);assert.equal(writes,0);assert.ok(!JSON.stringify(b).includes('PRIVATE_PROVIDER_TEXT'));
 }}finally{globalThis.fetch=old;}
});
