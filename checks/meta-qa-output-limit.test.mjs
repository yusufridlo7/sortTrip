import {test} from 'node:test';
import assert from 'node:assert/strict';
import {demoDestinations} from '../lib/video-itinerary.mjs';
import {extractMetaText} from '../worker/video-itinerary.js';
const fields=['name','city','country','category','activity','sourceEvidence','evidenceKind','confidence','verified','recommendedDurationMinutes'];
const raw=()=>({destinations:demoDestinations().destinations.map(c=>Object.fromEntries(fields.map(k=>[k,c[k]])))});
const text=demoDestinations().transcript;
const reply=(usage)=>({status:'completed',model:'muse-spark-1.3',...(usage?{usage}:{}),output:[{type:'message',content:[{type:'output_text',text:JSON.stringify(raw())}]}]});
function setup({body,inputTokens=1000,code=200,reserve,settleOk=true,fetcher}={}){const calls=[],settlements=[];return {calls,settlements,
 env:{META_AI_CUTOFF_AT:'2026-11-04T17:00:00Z',META_VIDEO_NONPRODUCTION:'true',META_VIDEO_TEXT_ENABLED:'true',META_MODEL_API_KEY:'fixture-only',META_TEST_BUDGET:{reserve:async r=>{calls.push({reserve:r});return reserve||{allowed:true,id:r.id,hardCap:true,totalLimitUSD:10,reservedUSD:.05}},settle:async r=>{settlements.push(r);return {ok:settleOk}}}},
 fetcher:fetcher||(async(u,o)=>{calls.push({url:u,body:JSON.parse(o.body),redirect:o.redirect});if(String(u).endsWith('/input_tokens'))return Response.json({input_tokens:inputTokens});return Response.json(body||reply({input_tokens:400,output_tokens:900}),{status:code})})};}
test('perbaikan: request memakai max_output_tokens 1500 (cadangan reasoning), sukses settle tercatat',async()=>{
 const s=setup();const result=await extractMetaText(text,s.env,{fetcher:s.fetcher});
 const call=s.calls.find(c=>c.url==='https://api.meta.ai/v1/responses');
 assert.equal(call.body.max_output_tokens,1500);
 assert.equal(call.body.reasoning.effort,'low');
 assert.equal(result.mock,false);assert.equal(result.destinations.length,2);
 assert.equal(s.settlements.length,1);assert.equal(s.settlements[0].usage.outputTokens,900);
});
test('insiden 2305: output di atas 2000 gagal per-panggilan TETAPI usage tetap disettle (tidak macet)',async()=>{
 const s=setup({body:reply({input_tokens:514,output_tokens:2305})});
 await assert.rejects(extractMetaText(text,s.env,{fetcher:s.fetcher}),/USAGE_LIMIT_EXCEEDED/);
 assert.equal(s.settlements.length,1);assert.equal(s.settlements[0].usage.outputTokens,2305);
});
test('usage hilang: USAGE_UNAVAILABLE + settle null tercatat',async()=>{
 const s=setup({body:reply(null)});
 await assert.rejects(extractMetaText(text,s.env,{fetcher:s.fetcher}),/USAGE_UNAVAILABLE/);
 assert.equal(s.settlements.length,1);assert.equal(s.settlements[0].usage,null);assert.equal(s.settlements[0].chargedUSD,.05);
});
test('usage cacat (string/negatif) diperlakukan hilang',async()=>{
 for(const usage of [{input_tokens:'banyak',output_tokens:100},{input_tokens:100,output_tokens:-5},{input_tokens:1.5,output_tokens:100}]){
  const s=setup({body:reply(usage)});
  await assert.rejects(extractMetaText(text,s.env,{fetcher:s.fetcher}),/USAGE_UNAVAILABLE/);
  assert.equal(s.settlements[0].usage,null);
 }
});
test('settle gagal: hasil valid tidak bocor, BUDGET_SETTLEMENT_FAILED',async()=>{
 const s=setup({settleOk:false});
 await assert.rejects(extractMetaText(text,s.env,{fetcher:s.fetcher}),/BUDGET_SETTLEMENT_FAILED/);
 assert.equal(s.settlements.length,1);
});
test('duplikat/kunci global: reserve ditolak, provider tidak dipanggil, tanpa settle',async()=>{
 const s=setup({reserve:{allowed:false}});
 await assert.rejects(extractMetaText(text,s.env,{fetcher:s.fetcher}),/BUDGET_EXHAUSTED/);
 assert.equal(s.calls.length,1);assert.equal(s.settlements.length,0);
});
test('timeout provider: MODEL_TIMEOUT + settle null tercatat',async()=>{
 const s=setup({fetcher:(u,o)=>new Promise((_,rej)=>o.signal.addEventListener('abort',()=>rej(new DOMException('batal','AbortError'))))});
 await assert.rejects(extractMetaText(text,s.env,{fetcher:s.fetcher,timeoutMs:30}),/MODEL_TIMEOUT/);
 assert.equal(s.settlements.length,1);assert.equal(s.settlements[0].usage,null);
});
test('preflight input di atas 20000: INPUT_TOKEN_LIMIT + settle null',async()=>{
 const s=setup({inputTokens:20001});
 await assert.rejects(extractMetaText(text,s.env,{fetcher:s.fetcher}),/INPUT_TOKEN_LIMIT/);
 assert.equal(s.settlements.length,1);assert.equal(s.settlements[0].usage,null);
});
