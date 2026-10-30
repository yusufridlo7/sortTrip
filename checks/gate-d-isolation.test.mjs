import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {gateDDemoEnabled,gateDFetch,GATE_D_QA} from '../lib/gate-d-network.mjs';
test('demo flag cannot affect production, staging, wrong project or normal QA profile',()=>{
 assert.equal(gateDDemoEnabled('qa-preparation','true',GATE_D_QA),true);
 for(const args of [['production','true',GATE_D_QA],['staging','true',GATE_D_QA],['qa-preparation','false',GATE_D_QA],['qa-preparation','true','https://production.invalid']])assert.equal(gateDDemoEnabled(...args),false);
});
test('QA network gate denies suppliers/models/legacy/preview and keeps auth/trips',async()=>{
 const calls=[],f=gateDFetch(async(...args)=>{calls.push(args);return Response.json({})},'http://127.0.0.1:5176');
 for(const url of ['/api/flights','/api/hotels/search','/api/recommendations','/api/itinerary','/api/video-itinerary','/api/meta-qa/discovery-preview','https://api.openai.com/v1/responses','https://api.meta.ai/v1/responses','https://production.invalid/rest/v1/trips',GATE_D_QA+'/rest/v1/rpc/reserve_meta_video_test'])await assert.rejects(f(url),/GATE_D_NETWORK_DENIED/);
 assert.equal(calls.length,0);
 await f('/api/assistant/discover',{method:'POST'});await f('/api/assistant/access',{method:'POST'});
 await f(GATE_D_QA+'/auth/v1/user');await f(GATE_D_QA+'/rest/v1/trips?select=*');
 assert.equal(calls.length,4);
 assert(calls.every(([,init])=>init.redirect==='error'));
});
test('SQL proposal locks before drift checks and keeps manual gate closed',()=>{
 const sql=readFileSync('docs/staging-proposal/sql/08_PROPOSED_GLOBAL_META_GUARD.sql','utf8');
 assert(sql.indexOf('EXCLUSIVE MODE NOWAIT')<sql.indexOf('DO $preflight$'));
 for(const term of ["statement_timeout='10s'","verified_project_ref constant text := 'UNVERIFIED'",'deployed definition drift','ownership/ACL/search_path mismatch','STOP data changed','service_role','aclexplode'])assert(sql.includes(term));
});
