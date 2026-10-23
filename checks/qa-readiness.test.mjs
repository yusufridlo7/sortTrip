import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {runPriceWatches} from '../worker/price-watch.js';
import worker,{normalize} from '../worker/index.js';
const env={SUPABASE_URL:'https://database.invalid',SUPABASE_SERVICE_ROLE_KEY:'fixture',TRAVELPAYOUTS_API_TOKEN:'fixture'};
test('domestic Price Watch normalizes legacy international scope before searching',async()=>{
 const old=globalThis.fetch;let completed;
 const query={origin:'CGK',destination:'DPS',scope:'international',journey:'oneway',outFrom:'2027-01-10',outTo:'2027-01-10',minDays:3,maxDays:3};
 globalThis.fetch=async(url,opts)=>String(url).includes('claim_price_watches')?Response.json([{id:'watch',lease:'lease',query}]):(completed=JSON.parse(opts.body),new Response(null,{status:204}));
 try{await runPriceWatches(env,{},async q=>{assert.equal(q.scope,'all');const f=normalize({origin_airport:'CGK',destination_airport:'DPS',destination:'DPS',departure_at:'2027-01-10T07:00:00+07:00',price:500000,link:'/search/example'},q,'DPS');return Response.json({flights:[f].filter(Boolean)});});assert.equal(completed.p_price,500000);assert.equal(completed.p_status,'ok');}finally{globalThis.fetch=old;}
});
test('one failed watch completion does not abandon the remaining claimed watches',async()=>{
 const old=globalThis.fetch;let searched=0,finished=0;
 globalThis.fetch=async url=>{if(String(url).includes('claim_price_watches'))return Response.json([{id:'a',query:{}},{id:'b',query:{}}]);finished++;return new Response(null,{status:finished===1?503:204});};
 try{await runPriceWatches(env,{},async()=>{searched++;return Response.json({flights:[]});});assert.equal(searched,2);assert.equal(finished,2);}finally{globalThis.fetch=old;}
});
test('one email network failure is deferred and does not prevent another notification; idempotency retained',async()=>{
 const old=globalThis.fetch;const attempts=[],marked=[];
 globalThis.fetch=async(url,options)=>{const u=String(url);if(u.includes('claim_price_watches'))return Response.json([]);if(u.includes('price_notifications?email_sent'))return Response.json([{id:'one',user_id:'fixture-a',old_price:100,price:90,booking_url:'https://www.aviasales.com/search/a'},{id:'two',user_id:'fixture-b',old_price:100,price:80,booking_url:'https://www.aviasales.com/search/b'}]);if(u.includes('/admin/users/'))return Response.json({email:'qa@example.invalid',email_confirmed_at:'2026-10-01'});if(u==='https://api.resend.com/emails'){attempts.push(options.headers['Idempotency-Key']);if(attempts.length===1)throw Error('network fixture');return Response.json({id:'fixture'});}marked.push(u);return new Response(null,{status:204});};
 try{await runPriceWatches({...env,RESEND_API_KEY:'fixture',PRICE_WATCH_FROM:'qa@example.invalid'}, {},async()=>Response.json({flights:[]}));assert.deepEqual(attempts,['price-watch-one','price-watch-two']);assert.equal(marked.length,1);assert.match(marked[0],/eq.two/);}finally{globalThis.fetch=old;}
});
test('checkout SPA entry remains served after enabling real missing-page responses',async()=>{
 let pathname;const r=await worker.fetch(new Request('https://sorttrip.test/hotel-checkout?checkoutId=fixture'),{ASSETS:{fetch:request=>{pathname=new URL(request.url).pathname;return new Response('app');}}},{});assert.equal(r.status,200);assert.equal(pathname,'/');
 for(const file of ['wrangler.jsonc','wrangler.hotel-browser.jsonc']){const config=JSON.parse(await fs.readFile(file,'utf8'));assert.equal(config.assets.not_found_handling,'404-page');assert.ok(config.assets.run_worker_first.includes('/hotel-checkout'));}
 const robots=await fs.readFile('public/robots.txt','utf8'),sitemap=await fs.readFile('public/sitemap.xml','utf8');assert.match(robots,/Disallow: \/hotel-checkout/);assert.match(sitemap,/<urlset/);assert.ok(!sitemap.includes('/api/'));
});
