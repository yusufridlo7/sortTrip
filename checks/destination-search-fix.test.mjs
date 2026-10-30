import {test} from 'node:test';
import assert from 'node:assert/strict';
import {searchLocations,destinationsFromText,resolveLocations} from '../worker/location-search.js';
import worker from '../worker/meta-qa.js';
import {qaPublicFlights} from '../worker/qa-public-flights.js';
import {resolveSearchDestination} from '../app/search-destination.mjs';
const qa={SUPABASE_URL:'https://aytrcvfncsklhqozreyk.supabase.co',META_AI_CUTOFF_AT:'2026-11-04T17:00:00Z',META_VIDEO_NONPRODUCTION:'true'};
test('QA autocomplete returns actual Hanoi/Singapore/domestic catalogue choices without credentials',async()=>{
 for(const [name,code] of [['Hanoi','HAN'],['Singapore','SIN'],['Yogyakarta','JOG']]){
  assert.ok(searchLocations(name).some(row=>row.code===code));
  const r=await worker.fetch(new Request('http://127.0.0.1:8790/api/locations?q='+name),qa);assert.equal(r.status,200);assert.ok((await r.json()).locations.length>0);
 }
});
test('request intent selects Hanoi once, excludes origin/negation/URL and ordinary night words',()=>{
 const rows=destinationsFromText('Dari Jakarta, saya ingin Hanoi dan Sapa 5 hari, hotel di bawah 500000 per malam. Inspirasi https://vt.tiktok.com/ZSgq41yuY/', 'CGK');
 assert.deepEqual(rows.map(row=>row.code),['HAN']);
 assert.deepEqual(destinationsFromText('Jangan Hanoi, saya mau Bangkok', 'CGK').map(row=>row.code),['BKK']);
 assert.deepEqual(destinationsFromText('https://www.tiktok.com/@hanoi/video/7501291015462980871', 'CGK'),[]);
 assert.deepEqual(destinationsFromText('Budget murah per malam, berangkat Jakarta, 5 hari', 'CGK'),[]);
 assert.equal(destinationsFromText('Bangkok dan Hanoi', 'CGK').length,2);
});
test('intent endpoint is bounded and labels supplied text honestly',async()=>{
 const request=body=>new Request('http://127.0.0.1:8790/api/locations/resolve',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});
 const r=await resolveLocations(request({text:'Hanoi',origin:'CGK'}));const b=await r.json();assert.equal(b.locations[0].code,'HAN');assert.equal(b.videoAccessed,false);
 assert.equal((await resolveLocations(request({text:'x'.repeat(1001),origin:'CGK'}))).status,400);
 assert.equal((await resolveLocations(request({text:'x'.repeat(8001),origin:'CGK'}))).status,413);
 assert.equal((await resolveLocations(new Request('http://127.0.0.1:8790/api/locations/resolve'))).status,405);
});
test('frontend accepts only bounded catalogue choices and never needs a model token',async()=>{
 const calls=[];const signal=new AbortController().signal;
 const r=await resolveSearchDestination('Hanoi','CGK',signal,{fetcher:async(url,o)=>{calls.push({url,o});return Response.json({locations:searchLocations('Hanoi')});}});
 assert.equal(r[0].code,'HAN');assert.equal(calls[0].url,'/api/locations/resolve');assert.equal(calls[0].o.headers.Authorization,undefined);
 await assert.rejects(resolveSearchDestination('Hanoi','CGK',signal,{fetcher:async()=>Response.json({locations:[{code:'https://evil.test'}]})}),/DESTINATION_RESOLVE_UNAVAILABLE/);
});
test('QA flights use fixed anonymous GET with validated query; private and prompt fields are never forwarded',async()=>{
 const query=new URLSearchParams({origin:'CGK',destination:'HAN',outFrom:'2027-01-30',outTo:'2027-01-30',backFrom:'2027-02-03',backTo:'2027-02-03',minDays:'5',maxDays:'5',journey:'return',region:'world',scope:'all',prompt:'DO_NOT_SEND',url:'https://evil.test'});
 const req=new Request('http://127.0.0.1:8790/api/flights?'+query,{headers:{Authorization:'Bearer DO_NOT_SEND',Cookie:'private=DO_NOT_SEND'}});
 let calls=0;
 const r=await qaPublicFlights(req,{fetcher:async(url,o)=>{calls++;const target=new URL(url);assert.equal(target.origin,'https://sorttrip.yusufridlo7.workers.dev');assert.equal(target.pathname,'/api/flights');assert.equal(target.searchParams.get('prompt'),null);assert.equal(target.searchParams.get('url'),null);assert.equal(o.headers.Authorization,undefined);assert.equal(o.headers.Cookie,undefined);assert.equal(o.redirect,'manual');return Response.json({flights:[{destination:'HAN',price:1000000}],fetchedAt:'fixture'});}});
 assert.equal(r.status,200);assert.equal((await r.json()).qaReadOnlyPublicSource,true);assert.equal(calls,1);
 assert.equal((await qaPublicFlights(new Request(req.url,{method:'POST'}),{fetcher:()=>{throw Error('no egress')}})).status,405);
 assert.equal((await qaPublicFlights(new Request('http://127.0.0.1:8790/api/flights?destination=https://evil.test'),{fetcher:()=>{throw Error('no egress')}})).status,400);
 for(const status of [302,500])assert.equal((await qaPublicFlights(req,{fetcher:async()=>new Response(null,{status})})).status,502);
});
