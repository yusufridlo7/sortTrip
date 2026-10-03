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
    assert.equal(options.method, 'POST'); assert.equal(options.redirect, 'error'); assert.ok(options.signal);
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
