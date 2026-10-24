import {test} from 'node:test';
import assert from 'node:assert/strict';
import {handleViator} from '../worker/viator.js';
import worker from '../worker/index.js';
const env = {VIATOR_API_KEY: 'synthetic-test-value'};
const request = (path = '?destination=77') => new Request('https://local/api/activities' + path);
const row = {productCode: 'TEST1', title: 'Example tour', description: 'Example description',
  pricing: {currency: 'IDR', summary: {fromPrice: 250000}},
  productUrl: 'https://www.viator.com/tours/Example/test/d77-TEST1?pid=example&medium=api'};
test('missing credential fails closed without a provider request', async () => {
  const r = await handleViator(request(), {}, {fetcher: () => {throw Error('must not call');}});
  assert.equal(r.status, 503); assert.equal((await r.json()).code, 'VIATOR_NOT_CONFIGURED');
});
test('Worker routes health without leaking credential or claiming connection tested', async () => {
  const r = await worker.fetch(request('/health'), env, {}); const body = await r.json();
  assert.deepEqual(body, {provider:'Viator', configured:true, environment:'sandbox', configurationValid:true, connectionTested:false});
});
test('fixed sandbox POST, headers, IDR and tracked click-out; provider-only fields removed', async () => {
  const r = await handleViator(request(), env, {fetcher: async (url, options) => {
    assert.equal(url, 'https://api.sandbox.viator.com/partner/products/search');
    assert.equal(options.method, 'POST'); assert.equal(options.redirect, 'manual'); assert.ok(options.signal);
    assert.equal(options.headers['exp-api-key'], env.VIATOR_API_KEY);
    assert.equal(options.headers.Accept, 'application/json;version=2.0');
    assert.equal(JSON.parse(options.body).currency, 'IDR');
    assert.equal(JSON.parse(options.body).filtering.destination, '77');
    return Response.json({products:[{...row, privateData:env.VIATOR_API_KEY}]});
  }});
  const text = await r.text(); assert.ok(!text.includes(env.VIATOR_API_KEY));
  const body = JSON.parse(text); assert.equal(body.products[0].bookingUrl, row.productUrl);
  assert.equal(body.products[0].fromPrice, 250000); assert.equal(body.products[0].privateData, undefined);
});
test('reject malformed destination, pagination, methods and environment', async () => {
  for (const suffix of ['', '?destination=https://evil.test', '?destination=77&count=21', '?destination=77&start=-1'])
    assert.equal((await handleViator(request(suffix), env)).status, 400);
  assert.equal((await handleViator(new Request(request(), {method:'POST'}), env)).status, 405);
  assert.equal((await handleViator(request(), {...env, VIATOR_ENVIRONMENT:'https://evil.test'})).status, 503);
});

test('production uses its fixed host and exposes only numeric upstream status on rejection', async () => {
  const r = await handleViator(request(), {...env, VIATOR_ENVIRONMENT:'production'}, {fetcher:async(url)=>{
    assert.equal(url, 'https://api.viator.com/partner/products/search');
    return new Response(env.VIATOR_API_KEY, {status:400});
  }});
  assert.equal(r.status,502);
  assert.deepEqual(await r.json(), {code:'VIATOR_UNAVAILABLE', upstreamStatus:400, error:'Penyedia aktivitas belum dapat melayani pencarian.'});
});
test('provider errors, exception text, malformed JSON and redirects do not escape', async () => {
  for (const status of [401,403,429,500,302]) {
    const r = await handleViator(request(), env, {fetcher:async()=>new Response(env.VIATOR_API_KEY,{status})});
    assert.equal(r.status,502); assert.ok(!(await r.text()).includes(env.VIATOR_API_KEY));
  }
  for (const fetcher of [async()=>{throw Error(env.VIATOR_API_KEY);}, async()=>new Response('not-json'), async()=>Response.json({})])
    assert.equal((await handleViator(request(),env,{fetcher})).status,502);
});
test('wrong currency, unsafe URLs and reflected secrets are discarded; empty stays empty', async () => {
  const bad = [ {...row,pricing:{currency:'USD',summary:{fromPrice:1}}}, {...row,title:env.VIATOR_API_KEY},
    ...['https://evil.test/tours/x','javascript:alert(1)','https://www.viator.com@evil.test/tours/x',
      'https://www.viator.com/tours/x?key='+env.VIATOR_API_KEY].map(productUrl=>({...row,productUrl})) ];
  const r = await handleViator(request(),env,{fetcher:async()=>Response.json({products:bad})});
  assert.deepEqual((await r.json()).products,[]);
  const empty = await handleViator(request(),env,{fetcher:async()=>Response.json({products:[]})});
  assert.deepEqual((await empty.json()).products,[]);
});

test('connection diagnostics return fixed categories without exception details', async () => {
  for (const [message,kind] of [['Invalid header '+env.VIATOR_API_KEY,'request-header'],['redirect '+env.VIATOR_API_KEY,'redirect-blocked'],['fetch failed '+env.VIATOR_API_KEY,'network'],[env.VIATOR_API_KEY,'runtime']]) {
    const r = await handleViator(request(),env,{fetcher:async()=>{throw new TypeError(message);}});
    const text = await r.text();
    assert.ok(!text.includes(env.VIATOR_API_KEY));
    assert.equal(JSON.parse(text).failureKind,kind);
  }
});

test('redirects are never followed and sensitive Location is not exposed',async()=>{
  const r=await handleViator(request(),env,{fetcher:async()=>new Response(null,{status:302,headers:{Location:'https://geo.captcha-delivery.com/check?token='+env.VIATOR_API_KEY}})});
  assert.deepEqual(await r.json(),{code:'VIATOR_REDIRECT_BLOCKED',upstreamStatus:302,redirectCategory:'access-challenge',error:'Penyedia aktivitas mengalihkan koneksi. Pencarian belum tersedia.'});
});

test('free text search uses fixed product search schema and nested results',async()=>{
 const r=await handleViator(request('?search=Petronas%20Kuala%20Lumpur&count=6'),{...env,VIATOR_ENVIRONMENT:'production'},{fetcher:async(url,init)=>{
  assert.equal(url,'https://api.viator.com/partner/search/freetext');
  assert.deepEqual(JSON.parse(init.body),{searchTerm:'Petronas Kuala Lumpur',searchTypes:[{searchType:'PRODUCTS',pagination:{start:1,count:6}}],currency:'IDR'});
  return Response.json({products:{results:[row],totalCount:1}});
 }});
 const b=await r.json();assert.equal(r.status,200);assert.equal(b.products[0].productCode,row.productCode);assert.equal(b.environment,'production');
});
test('search validation and rate limit prevent supplier calls',async()=>{
 const fetcher=async()=>{throw Error('should not call');};
 for(const p of ['?search=a','?search=%0a%00xx','?search='+('a'.repeat(201)),'?search=tour&destination=77'])assert.equal((await handleViator(request(p),env,{fetcher})).status,400);
 const r=await handleViator(request('?search=Petronas'),{...env,VIATOR_LIMITER:{limit:async()=>({success:false})}},{fetcher});
 assert.equal(r.status,429);assert.equal((await r.json()).code,'VIATOR_RATE_LIMITED');
});

test('city-scoped search resolves an exact destination then filters products; ambiguous city fails closed',async()=>{
 let calls=0;
 const r=await handleViator(request('?search=Awana%20SkyWay&city=Kuala%20Lumpur'),env,{fetcher:async(url,init)=>{
  const b=JSON.parse(init.body);calls++;
  if(calls===1){assert.equal(b.searchTypes[0].searchType,'DESTINATIONS');return Response.json({destinations:{results:[{id:335,name:'Kuala Lumpur'}]}});}
  assert.equal(b.productFiltering.destination,'335');return Response.json({products:{results:[row]}});
 }});
 assert.equal(r.status,200);assert.equal(calls,2);
 const ambiguous=await handleViator(request('?search=tower&city=Paris'),env,{fetcher:async()=>Response.json({destinations:{results:[{id:1,name:'Paris'},{id:2,name:'Paris'}]}})});
 assert.equal(ambiguous.status,400);assert.equal((await ambiguous.json()).code,'VIATOR_DESTINATION_REQUIRED');
});


test('city-state names select only the explicit child of the same-name country',async()=>{
 let calls=0;
 const r=await handleViator(request('?search=Gardens%20by%20the%20Bay&city=Singapore'),env,{fetcher:async(url,init)=>{
  const body=JSON.parse(init.body);calls++;
  if(calls===1)return Response.json({destinations:{results:[{id:60449,name:'Singapore',parentDestinationId:18,parentDestinationName:'Singapore'},{id:18,name:'Singapore',parentDestinationId:2,parentDestinationName:'Asia'}]}});
  assert.equal(body.productFiltering.destination,'60449');return Response.json({products:{results:[row]}});
 }});
 assert.equal(r.status,200);assert.equal(calls,2);
 const ambiguous=await handleViator(request('?search=Gardens&city=Singapore'),env,{fetcher:async()=>Response.json({destinations:{results:[{id:60449,name:'Singapore',parentDestinationId:999},{id:18,name:'Singapore',parentDestinationId:2}]}})});
 assert.equal(ambiguous.status,400);assert.equal((await ambiguous.json()).candidates,undefined);
});
