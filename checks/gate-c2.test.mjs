import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {gateC2Budget} from '../qa-config/gate-c2-budget.mjs';
import {supplierJSON} from '../qa-config/gate-c2-diagnostics.mjs';
import {createGateC2Live} from '../qa-config/gate-c2-live.mjs';
import {liteRatesEnvelope} from '../worker/liteapi-rates-response.js';
const origin='http://127.0.0.1:5176',connection={host:'127.0.0.1:5176',remoteAddress:'127.0.0.1'};
const q={city:'Kuala Lumpur',country:'MY',checkin:'2026-11-10',checkout:'2026-11-12',people:1};
const req=()=>new Request(origin+'/api/hotels/search',{method:'POST',headers:{Origin:origin,Authorization:'Bearer fixture'}});
function dir(t){const d=fs.mkdtempSync(path.join(os.tmpdir(),'sorttrip-c2-test-'));t.after(()=>fs.rmSync(d,{recursive:true,force:true}));return d;}
test('C2 limits 5/5/2, global in-flight lock, failed slots persist after restart',t=>{
 const d=dir(t),b=gateC2Budget(d);for(const kind of ['flight','hotel','metadata']){const max=kind==='metadata'?2:5;for(let i=1;i<=max;i++){const r=b.reserve(kind);assert.equal(r.slot,i);assert.throws(()=>b.reserve(kind),/BUSY/);r.release();}assert.equal(gateC2Budget(d).count(kind),max);assert.throws(()=>b.reserve(kind),/EXHAUSTED/);}
 assert.equal(fs.existsSync(path.join(d,'inflight')),false);
});
test('diagnostics whitelist ignores tokens, raw errors, account IDs and room names',async()=>{
 const d={};await supplierJSON(Response.json({secret:'do-not-leak',error:{message:'private'},data:[{roomTypes:[{rates:[{name:'private-room',retailRate:{total:[{currency:'IDR'}]}}]}]}]}),'hotel',d);const text=JSON.stringify(d);assert.equal(text.includes('do-not-leak'),false);assert.equal(text.includes('private'),false);assert.equal(d.ratesCount,1);assert.equal(d.errorPresent,true);
 const e={};await assert.rejects(supplierJSON(new Response('private-html',{status:200}),'hotel',e));assert.equal(e.failure,'JSON_OR_STREAM_ERROR');
});
test('owner guard and date/pax validation prevent any supplier egress',async t=>{
 let calls=0;const opts={directory:dir(t),bindings:{LITEAPI_API_KEY:'fixture-key'},verify:async()=>Response.json({ownerVerified:true}),fetcher:async()=>{calls++;assert.fail();}};const live=createGateC2Live({},opts);
 assert.equal((await live.handle(req(),JSON.stringify({...q,people:2}),connection)).status,400);
 assert.equal((await live.handle(req(),JSON.stringify(q),{...connection,remoteAddress:'192.168.1.3'})).status,403);
 const denied=createGateC2Live({},{...opts,verify:async()=>Response.json({code:'OWNER_REQUIRED'},{status:403})});assert.equal((await denied.handle(req(),JSON.stringify(q),connection)).status,403);assert.equal(calls,0);
});
test('malformed hotel response produces safe envelope diagnostic, no zero fallback, no retry',async t=>{
 let calls=0;const d=dir(t),live=createGateC2Live({},{directory:d,bindings:{LITEAPI_API_KEY:'fixture-key'},verify:async()=>Response.json({ownerVerified:true}),fetcher:async()=>{calls++;return Response.json({data:{hotels:[]},secret:'private'});}});
 const r=await live.handle(req(),JSON.stringify(q),connection);assert.equal(r.status,502);const diag=JSON.parse(fs.readFileSync(path.join(d,'hotel-1.diagnostic.json')));assert.equal(diag.failure,'lite_rates_invalid_envelope');assert.equal(diag.dataType,'object');assert.equal(JSON.stringify(diag).includes('private'),false);assert.equal(calls,1);
 await live.handle(req(),JSON.stringify(q),connection);assert.equal(calls,1);
});
test('documented code2001 becomes empty availability; other errors/sandbox/malformed remain rejected',()=>{
 const empty=liteRatesEnvelope({error:{code:2001,message:'do not expose'}});assert.deepEqual(empty.data,[]);assert.equal(empty.noAvailability,true);
 for(const body of [{error:{code:401}},{error:{code:4002}},{sandbox:true,error:{code:2001}},{data:{}},null])assert.throws(()=>liteRatesEnvelope(body));
});
test('429 closes provider for a different query without consuming another slot',async t=>{
 let calls=0;const d=dir(t),live=createGateC2Live({},{directory:d,bindings:{LITEAPI_API_KEY:'fixture-key'},verify:async()=>Response.json({ownerVerified:true}),fetcher:async()=>{calls++;return new Response(null,{status:429});}});
 await live.handle(req(),JSON.stringify(q),connection);assert.equal((await live.handle(req(),JSON.stringify({...q,checkin:'2026-11-11'}),connection)).status,503);assert.equal(calls,1);assert.equal(gateC2Budget(d).count('hotel'),1);
});
