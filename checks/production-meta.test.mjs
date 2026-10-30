import test from 'node:test';
import assert from 'node:assert/strict';
import {productionMetaEnabled,qaMetaEnabled,PRODUCTION_SUPABASE} from '../worker/meta-environment.js';
import {metaVideoBudget} from '../worker/meta-video-budget.js';
import {extractMetaText} from '../worker/video-itinerary.js';
const env={SUPABASE_URL:PRODUCTION_SUPABASE,META_ITINERARY_ENABLED:'true',META_AI_BUDGET_READY:'true',SUPABASE_SECRET_KEY:'synthetic'};
test('production opt-in cannot be supplied by QA flag',()=>{
 assert.equal(productionMetaEnabled({...env,META_VIDEO_NONPRODUCTION:'true'}),false);
 assert.equal(qaMetaEnabled({...env,META_VIDEO_NONPRODUCTION:'true'}),false);
 assert.equal(productionMetaEnabled({...env,SUPABASE_URL:'https://qa.invalid'}),false);
 assert.equal(metaVideoBudget({...env,META_ITINERARY_ENABLED:'false'}),null);
});
test('production RPC names are isolated from QA ledger',async()=>{
 const paths=[];const ledger=metaVideoBudget(env,async(url)=>{paths.push(new URL(url).pathname);return Response.json(paths.length===1?{version:2,globalExclusive:true}:paths.length===2?{allowed:true,globalExclusive:true}:{ok:true});});
 await ledger.reserve({id:'synthetic',userId:'synthetic'});await ledger.settle({id:'synthetic'});
 assert.deepEqual(paths.map(p=>p.split('/').pop()),['meta_ai_safety_status','reserve_meta_ai_request','settle_meta_ai_request']);
});
test('production rejects direct extraction without paid discovery route',async()=>{
 let calls=0;await assert.rejects(extractMetaText('KL',{...env,META_MODEL_API_KEY:'synthetic'},{fetcher:async()=>{calls++;}}),e=>e.code==='MODEL_UNAVAILABLE');assert.equal(calls,0);
});

test('owner production allocation cap is 100; QA stays 10',async()=>{
 const {metaAllocationLimit}=await import('../worker/meta-environment.js');
 assert.equal(metaAllocationLimit(env),100);
 assert.equal(metaAllocationLimit({...env,SUPABASE_URL:'https://qa.invalid',META_VIDEO_NONPRODUCTION:'true'}),10);
 assert.equal(metaAllocationLimit({...env,META_ITINERARY_ENABLED:'false'}),10);
});
