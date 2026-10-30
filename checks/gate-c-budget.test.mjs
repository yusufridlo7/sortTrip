import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {gateCBudget,gateCTransport} from '../qa-config/gate-c-budget.mjs';
const flight='https://api.travelpayouts.com/aviasales/v3/prices_for_dates';
const hotel='https://api.liteapi.travel/v3.0/hotels/rates';
function setup(t){const dir=fs.mkdtempSync(path.join(os.tmpdir(),'sorttrip-gate-c-test-'));t.after(()=>fs.rmSync(dir,{recursive:true,force:true}));return dir;}
test('one request per provider; reservations survive a new transport instance',async t=>{
 const dir=setup(t);let calls=0;const fetcher=async(_u,i)=>{calls++;assert.equal(i.redirect,'manual');return new Response(null,{status:200});};
 const read=gateCTransport(gateCBudget(dir),fetcher);
 await read(flight);await read(hotel,{method:'POST'});
 await assert.rejects(gateCTransport(gateCBudget(dir),fetcher)(flight),/USED/);
 await assert.rejects(read(hotel,{method:'POST'}),/USED/);assert.equal(calls,2);
});
test('failed request consumes allowance; simultaneous attempts send only once',async t=>{
 const dir=setup(t);let calls=0;const read=gateCTransport(gateCBudget(dir),async()=>{calls++;throw Error('fixture failure');});
 await Promise.allSettled([read(flight),read(flight),read(flight)]);assert.equal(calls,1);
 await assert.rejects(read(flight),/USED/);assert.equal(calls,1);
});
test('metadata, production proxy, model, checkout, wrong method and forwarded session denied before claim',async()=>{
 let claims=0,calls=0;const read=gateCTransport({claim(){claims++;}},async()=>{calls++;});
 for(const [url,init] of [['https://api.liteapi.travel/v3.0/data/hotels',{}],['https://sorttrip.yusufridlo7.workers.dev/api/flights',{}],['https://api.meta.ai/test',{}],['https://api.liteapi.travel/v3.0/rates/prebook',{method:'POST'}],[flight,{method:'POST'}],[hotel,{}],[flight,{headers:{Authorization:'Bearer fixture'}}],[flight,{headers:{Cookie:'fixture'}}]])await assert.rejects(read(url,init),/DENIED/);
 assert.equal(claims,0);assert.equal(calls,0);
});
test('unwritable claim path prevents egress',async t=>{
 const dir=setup(t),bad=path.join(dir,'file');fs.writeFileSync(bad,'fixture');let calls=0;
 await assert.rejects(gateCTransport(gateCBudget(bad),async()=>{calls++;})(flight));assert.equal(calls,0);
});
