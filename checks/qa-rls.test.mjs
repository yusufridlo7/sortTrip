import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {fixtureData,QA_RLS_KIND,parseRlsReference,probeForeign,probeGuest,verifyOwn} from '../lib/qa-rls-probe.mjs';
const a='11111111-1111-4111-8111-111111111111',b='22222222-2222-4222-8222-222222222222';
const ra={kind:QA_RLS_KIND,fixtureId:'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',ownerId:a};
const rb={kind:QA_RLS_KIND,fixtureId:'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',ownerId:b};
test('two-user mock denies cross-account verbs, own rows remain intact; guest explicitly denied',async()=>{
 const rows=new Map([[ra.fixtureId,{id:ra.fixtureId,user_id:a,data:fixtureData()}],[rb.fixtureId,{id:rb.fixtureId,user_id:b,data:fixtureData()}]]);
 function api(user){return {
  read:async id=>({rows:rows.get(id)?.user_id===user?[structuredClone(rows.get(id))]:[]}),
  update:async(id,data)=>{if(rows.get(id)?.user_id!==user)return {rows:[]};rows.get(id).data=data;return {rows:[{id}]};},
  remove:async()=>({code:'42501',rows:[]}), // Existing schema has no DELETE grant.
  insert:async owner=>owner!==user?{code:'42501',rows:[]}:{rows:[{id:'unexpected'}]}
 };}
 for(const [own,foreign] of [[ra,rb],[rb,ra]]){const results=await probeForeign(api(own.ownerId),own.ownerId,foreign);assert.equal(results.length,4);assert.ok(results.every(r=>r.passed));assert.equal((await verifyOwn(api(own.ownerId),own.ownerId,own)).passed,true);}
 assert.equal((await probeGuest({read:async()=>({code:'42501',rows:[]})},ra)).passed,true);
});
test('JWT expiry, network/schema failures and silent insert are never recorded as an RLS pass',async()=>{
 for(const code of ['PGRST301','PGRST302','REQUEST_FAILED','42P01']){const result=await probeForeign({read:async()=>({code,rows:[]})},a,rb);assert.equal(result.length,1);assert.equal(result[0].passed,false);assert.equal((await probeGuest({read:async()=>({code,rows:[]})},ra)).passed,false);}
 const result=await probeForeign({read:async()=>({rows:[]}),update:async()=>({rows:[]}),remove:async()=>({rows:[]}),insert:async()=>({rows:[]})},a,rb);assert.equal(result.at(-1).passed,false);
});
test('unexpected cross-read stops before destructive tests; same-account or bad reference does no IO',async()=>{
 let writes=0;const api={read:async()=>({rows:[{id:rb.fixtureId}]}),update:async()=>{writes++;return {rows:[]};}};
 const result=await probeForeign(api,a,rb);assert.equal(result.length,1);assert.equal(result[0].passed,false);assert.equal(writes,0);
 await assert.rejects(probeForeign(api,a,ra),/DISTINCT_ACCOUNT_REQUIRED/);
 await assert.rejects(probeForeign(api,a,{...ra,ownerId:a.toUpperCase()}),/DISTINCT_ACCOUNT_REQUIRED/);
 for(const ref of ['{}','x',JSON.stringify({...ra,token:'not-allowed'}),JSON.stringify({...ra,fixtureId:'other-row'})])assert.throws(()=>parseRlsReference(ref),/INVALID_REFERENCE/);
});
test('owner final read detects missing, changed and unexpected fixture data',async()=>{
 for(const row of [undefined,{user_id:a,data:fixtureData(999)},{user_id:b,data:fixtureData()},{user_id:a,data:{...fixtureData(),extra:true}}])assert.equal((await verifyOwn({read:async()=>({rows:row?[row]:[]})},a,ra)).passed,false);
 assert.equal((await verifyOwn({read:async()=>({rows:[{user_id:a,data:fixtureData()}]})},a,ra)).passed,true);
 const reordered={...fixtureData(),destinationMeta:{code:'',country:'QA',city:'QA RLS fixture'}};
 assert.equal((await verifyOwn({read:async()=>({rows:[{user_id:a,data:reordered}]})},a,ra)).passed,true);
});
test('RLS panel is QA-only and uses user/anonymous client, with ID-only queries and no server keys',()=>{
 const ui=readFileSync(new URL('../app/meta-qa-rls.tsx',import.meta.url),'utf8');assert.match(ui,/import\.meta\.env\.MODE!=='meta-qa'/);assert.match(ui,/persistSession:false/);assert.doesNotMatch(ui,/SUPABASE_SECRET|SERVICE_ROLE|META_MODEL_API_KEY|console\./);assert.doesNotMatch(ui,/\.eq\('user_id'/);assert.match(ui,/OWNER_CONTROL_FAILED/);
 const app=readFileSync(new URL('../app/travel-app.tsx',import.meta.url),'utf8');assert.match(app,/MODE==='meta-qa'&&<><MetaQAAccess\/><MetaQARLS\/><\/>/);
});
