import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {metaVideoBudget} from '../worker/meta-video-budget.js';
import {extractMetaText} from '../worker/video-itinerary.js';

const env={SUPABASE_URL:'https://qa.invalid',SUPABASE_SECRET_KEY:'fixture',META_VIDEO_BUDGET_READY:'true'};
// Deterministic RPC contract fixture. NOT a PostgreSQL lock/SQL execution test.
function database({pending=false}={}){
 const rows=new Map(pending?[['stale',{user:'other',pending:true,created:0}]]:[]);
 let allocation=0;
 const fetcher=async(url,init)=>{
  const name=new URL(url).pathname.split('/').at(-1),b=JSON.parse(init.body);
  if(name==='meta_video_test_safety_status')return Response.json({version:2,globalExclusive:true});
  if(name==='reserve_meta_video_test'){
   if(rows.has(b.p_request)||[...rows.values()].some(r=>r.pending))return Response.json({allowed:false});
   rows.set(b.p_request,{user:b.p_user,pending:true});allocation+=.05;
   return Response.json({allowed:true,id:b.p_request,hardCap:true,reservedUSD:.05,totalLimitUSD:10,globalExclusive:true});
  }
  assert.equal(name,'settle_meta_video_test');
  const r=rows.get(b.p_request);
  if(!r?.pending||b.p_estimated_usd===null)return Response.json({ok:false});
  r.pending=false;return Response.json({ok:true});
 };
 return {ledger:metaVideoBudget(env,fetcher),rows,allocation:()=>allocation};
}
test('different users/Worker adapters sharing global RPC admit one; successful settlement permits next',async()=>{
 const d=database();const results=await Promise.all(Array.from({length:20},(_,i)=>d.ledger.reserve({id:'r'+i,userId:'u'+i})));
 assert.equal(results.filter(r=>r.allowed).length,1);assert.equal(d.allocation(),.05);
 await d.ledger.settle({id:'r0',usage:{estimatedUSD:.001,inputTokens:100,outputTokens:10}});
 assert.equal((await d.ledger.reserve({id:'next',userId:'different'})).allowed,true);
});
test('duplicate request denied before and after settlement without another allocation',async()=>{
 const d=database();await d.ledger.reserve({id:'same',userId:'a'});
 assert.equal((await d.ledger.reserve({id:'same',userId:'a'})).allowed,false);
 await d.ledger.settle({id:'same',usage:{estimatedUSD:.001,inputTokens:100,outputTokens:10}});
 assert.equal((await d.ledger.reserve({id:'same',userId:'a'})).allowed,false);assert.equal(d.allocation(),.05);
 await assert.rejects(d.ledger.settle({id:'same',usage:{estimatedUSD:1,inputTokens:1,outputTokens:3000}}),/SETTLEMENT_FAILED/);
});
test('stale pending from any account blocks; unknown usage does not release occupancy',async()=>{
 const d=database({pending:true});assert.equal((await d.ledger.reserve({id:'new',userId:'owner'})).allowed,false);
 await assert.rejects(d.ledger.settle({id:'stale',usage:null}),/SETTLEMENT_FAILED/);
 assert.equal((await d.ledger.reserve({id:'newer',userId:'owner'})).allowed,false);assert.equal(d.allocation(),0);
});
test('missing/unrecognized global guard fails before reservation',async()=>{
 for(const value of [{}, {version:1,globalExclusive:true},{version:2,globalExclusive:false}]){
  let calls=0;const ledger=metaVideoBudget(env,async()=>{calls++;return Response.json(value)});
  await assert.rejects(ledger.reserve({id:'a',userId:'b'}),/BUDGET_CONTROL_REQUIRED/);assert.equal(calls,1);
 }
});
for(const mode of ['false','empty','throw','malformed','http'])test('settlement '+mode+' is not accepted/retried',async()=>{
 let calls=0;const ledger=metaVideoBudget(env,async()=>{calls++;if(mode==='throw')throw Error('offline');if(mode==='malformed')return new Response('{');if(mode==='http')return Response.json({}, {status:503});return Response.json(mode==='false'?{ok:false}:{});});
 await assert.rejects(ledger.settle({id:'r',usage:null}));assert.equal(calls,1);
});
test('completed model output is withheld when injected ledger finalization is uncertain',async()=>{
 for(const settle of [async()=>({ok:false}),async()=>undefined,async()=>{throw Error('offline')}]){
  let modelCalls=0,settles=0;
  const e={META_AI_CUTOFF_AT:'2026-11-04T17:00:00Z',META_VIDEO_NONPRODUCTION:'true',META_VIDEO_TEXT_ENABLED:'true',META_MODEL_API_KEY:'fixture',META_TEST_BUDGET:{reserve:async r=>({allowed:true,id:r.id,hardCap:true,totalLimitUSD:10,reservedUSD:.05}),settle:async r=>{settles++;return settle(r)}}};
  await assert.rejects(extractMetaText('Kuala Lumpur',e,{fetcher:async url=>{
   assert.equal(new URL(url).hostname,'api.meta.ai');modelCalls++;
   return Response.json(url.endsWith('input_tokens')?{input_tokens:100}:{status:'completed',usage:{input_tokens:100,output_tokens:10},output:[{type:'message',content:[{type:'output_text',text:'{"destinations":[]}'}]}]});
  }}),/BUDGET_SETTLEMENT_FAILED/);
  assert.equal(settles,1);assert.equal(modelCalls,2);
 }
});
test('proposed SQL has permanent global pending guard and checks request before anomaly block',()=>{
 const sql=readFileSync(new URL('../docs/staging-proposal/sql/08_PROPOSED_GLOBAL_META_GUARD.sql',import.meta.url),'utf8');
 assert.match(sql,/WHERE settled_at IS NULL\)/);assert.doesNotMatch(sql,/interval|pg_sleep|SET blocked=false|allocated_usd=0(?:[;\s,)]|$)/i);
 assert.ok(sql.indexOf('WHERE id=p_request AND settled_at IS NULL FOR UPDATE')<sql.indexOf('SET blocked=true'));
 assert.match(sql,/allocation\+0.05>10/);assert.match(sql,/user_id=p_user\)>=10/);
});
