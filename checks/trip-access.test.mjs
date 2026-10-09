import {test} from 'node:test';
import assert from 'node:assert/strict';
import {planningKey,passSummary} from '../worker/trip-access.js';
import {tripKey,handlePayments} from '../worker/payments.js';
const user='12345678-1234-1234-1234-123456789012',trip='87654321-1234-1234-1234-123456789012';
const env={SUPABASE_URL:'https://db.test',SUPABASE_SERVICE_ROLE_KEY:'fixture-only',SUPABASE_PUBLISHABLE_KEY:'fixture-public'};
const row={trip_key:'kuala lumpur|2027-01-01',expires_at:'2027-02-01',request_limit:20,requests:3,payment_reference:'PRIVATE_REFERENCE'};
const request=(body={},action='access',auth=true)=>new Request('https://sorttrip.test/api/payments/'+action,{method:'POST',headers:auth?{Authorization:'Bearer fixture'}:{},body:JSON.stringify({city:'Kuala Lumpur',start:'2027-01-01',...body})});
test('AI and payment share exact trip scope, reject incomplete or delimiter-containing identities',()=>{
 assert.equal(planningKey(' Kuala Lumpur ','2027-01-01'),tripKey({destination:'kl',start:'2027-01-01'}));
 assert.notEqual(planningKey('Tokyo','2027-01-01'),planningKey('Tokyo','2027-01-02'));
 for(const city of ['', '  ', 'Tokyo|other'])assert.throws(()=>planningKey(city,'2027-01-01'));
});
test('exhausted newest pass cannot hide another valid pass',()=>{
 assert.equal(passSummary([{...row,requests:20},{...row,requests:7}]).remaining,13);
 assert.equal(passSummary([{...row,requests:20}]).remaining,0);assert.equal(passSummary([]),null);
});
test('unsaved draft can recognize its paid pass without DB mutation or Midtrans request',async()=>{
 const old=globalThis.fetch;let reads=0;
 globalThis.fetch=async(url,options)=>{
  if(String(url).endsWith('/auth/v1/user'))return Response.json({id:user});
  assert.equal(options.method,'GET');const u=new URL(url);assert.equal(u.searchParams.get('user_id'),'eq.'+user);assert.match(u.searchParams.get('expires_at'),/^gt\./);assert.ok(u.pathname.endsWith('/trip_passes'));reads++;return Response.json([row]);
 };
 try{const r=await handlePayments(request(),env);assert.equal(r.status,200);const b=await r.json();assert.equal(b.pass.remaining,17);assert.deepEqual(b.otherTrips,[]);assert.equal(reads,1);assert.ok(!JSON.stringify(b).includes('PRIVATE_REFERENCE'));assert.ok(!JSON.stringify(b).includes(user));assert.ok(!JSON.stringify(b).includes('fixture-only'));}finally{globalThis.fetch=old;}
});
test('pass on another date unlocks a new trip within the same account without resetting usage',async()=>{
 const old=globalThis.fetch;globalThis.fetch=async url=>String(url).endsWith('/auth/v1/user')?Response.json({id:user}):Response.json([{...row,trip_key:'tokyo|2027-01-04'},{...row,trip_key:'bangkok|2027-02-02',requests:20}]);
 try{const b=await (await handlePayments(request(),env)).json();assert.equal(b.pass.remaining,17);assert.deepEqual(b.otherTrips,[]);}finally{globalThis.fetch=old;}
});
test('unauthenticated access and invalid identity never query entitlement',async()=>{
 const old=globalThis.fetch;globalThis.fetch=async url=>{assert.ok(String(url).endsWith('/auth/v1/user'));return Response.json({id:user})};
 try{assert.equal((await handlePayments(request({},'access',false),env)).status,401);assert.equal((await handlePayments(request({city:''}),env)).status,400);}finally{globalThis.fetch=old;}
});
test('unsaved draft still cannot checkout or grant pass; changed saved identity cannot reconcile payment',async()=>{
 const old=globalThis.fetch;globalThis.fetch=async url=>{if(String(url).endsWith('/auth/v1/user'))return Response.json({id:user});assert.ok(String(url).includes('/trips?'));return Response.json([{id:trip,data:{destination:'kl',start:'2027-01-01'}}]);};
 try{for(const action of ['checkout','owner-test'])assert.equal((await handlePayments(request({},action),env)).status,400);
  const r=await handlePayments(request({tripId:trip,city:'Tokyo',refresh:true},'status'),env);assert.equal(r.status,409);assert.equal((await r.json()).code,'TRIP_IDENTITY_CHANGED');
 }finally{globalThis.fetch=old;}
});
