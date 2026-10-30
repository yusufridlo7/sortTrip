import test from 'node:test';
import assert from 'node:assert/strict';
import {originalQAConfig,QA_URL} from '../qa-config/original-ui.mjs';
import {publicKeyFingerprint,QA_LOCAL_ORIGIN} from '../qa-config/gate-a.mjs';
import {localGateBSession} from '../qa-config/gate-b-session.mjs';
import {gateBRequestAllowed} from '../lib/qa-gate-b-network.mjs';
const key='sb_publishable_'+'fixture'.repeat(4),owner={email:'owner@example.invalid',qaUserId:'11111111-1111-4111-8111-111111111111'};
const config=()=>({version:1,targetOrigin:QA_LOCAL_ORIGIN,supabaseURL:QA_URL,publishableKey:key,owner,review:{qaProjectVerified:true,publicKeyProjectVerified:true,publicKeySHA256:publicKeyFingerprint(key),ownerIdentityVerified:true,redirectsVerified:true,siteURL:QA_LOCAL_ORIGIN+'/',redirectURLs:[QA_LOCAL_ORIGIN+'/'],noProductionResourcesVerified:true,nextStepAuthorization:''}});
const input={url:QA_LOCAL_ORIGIN+'/api/staging/session',host:'127.0.0.1:5176',origin:QA_LOCAL_ORIGIN,remoteAddress:'127.0.0.1',authorization:'Bearer fixture.token',method:'POST'};
test('explicit local Gate B authorization enables Auth only after Gate A proofs; private config unchanged',()=>{
 const c=config(),v=originalQAConfig({gateSource:{config:c},allowAuthentication:true,gateBAuthorization:'GATE_B_QA_AUTH'});assert.equal(JSON.parse(v.define['import.meta.env.VITE_QA_AUTH_READY']),'true');assert.equal(c.review.nextStepAuthorization,'');
 for(const options of [{},{allowAuthentication:true},{gateBAuthorization:'GATE_B_QA_AUTH'}])assert.equal(JSON.parse(originalQAConfig({gateSource:{config:c},...options}).define['import.meta.env.VITE_QA_AUTH_READY']),'false');
});
test('Gate B cannot bypass missing proof or authorize remote staging',()=>{
 for(const review of [{publicKeyProjectVerified:false},{redirectsVerified:false},{noProductionResourcesVerified:false},{ownerIdentityVerified:false}]){const c=config();Object.assign(c.review,review);assert.equal(JSON.parse(originalQAConfig({gateSource:{config:c},allowAuthentication:true,gateBAuthorization:'GATE_B_QA_AUTH'}).define['import.meta.env.VITE_QA_AUTH_READY']),'false');}
 assert.equal(JSON.parse(originalQAConfig({environment:'staging',gateSource:{config:config()},allowAuthentication:true,gateBAuthorization:'GATE_B_QA_AUTH'}).define['import.meta.env.VITE_QA_AUTH_READY']),'false');
});
test('loopback owner session uses only fixed QA Auth read and matches confirmed UUID/email',async()=>{
 const calls=[];const r=await localGateBSession(input,config(),{enabled:true,fetcher:async(url,init)=>{calls.push(url);assert.equal(url,QA_URL+'/auth/v1/user');assert.equal(init.redirect,'manual');assert.equal(init.headers.apikey,key);return Response.json({id:owner.qaUserId,email:owner.email,email_confirmed_at:'2026-10-29'});}});assert.equal(r.status,200);assert.equal((await r.json()).ownerVerified,true);assert.equal(calls.length,1);
});
test('loopback session rejects LAN, hostname, missing/foreign origin or wrong path before network',async()=>{
 for(const change of [{remoteAddress:'192.168.1.5'},{remoteAddress:undefined},{host:'localhost:5176'},{origin:undefined},{origin:'https://evil.invalid'},{url:QA_LOCAL_ORIGIN+'/api/other'}]){const r=await localGateBSession({...input,...change},config(),{enabled:true,fetcher:()=>assert.fail('No egress')});assert.equal(r.status,403);}
 assert.equal((await localGateBSession(input,config(),{enabled:false,fetcher:()=>assert.fail('No egress')})).status,503);
});
test('wrong QA session and non-owner cannot pass local identity',async()=>{
 for(const user of [{id:'other',email:owner.email,email_confirmed_at:'yes'},{id:owner.qaUserId,email:'other@example.invalid',email_confirmed_at:'yes'},{id:owner.qaUserId,email:owner.email,email_confirmed_at:null}])assert.equal((await localGateBSession(input,config(),{enabled:true,fetcher:async()=>Response.json(user)})).status,403);
 assert.equal((await localGateBSession(input,config(),{enabled:true,fetcher:async()=>new Response(null,{status:401})})).status,401);
});
test('unavailable owner verification never emits upstream private errors',async()=>{const r=await localGateBSession(input,config(),{enabled:true,fetcher:async()=>{throw Error('PRIVATE_UPSTREAM_VALUE')}});assert.equal(r.status,503);assert.equal((await r.json()).code,'QA_AUTH_UNAVAILABLE');});
test('SDK allowlist permits owner login/session/logout and trips GET/POST/PATCH only',()=>{
 for(const [p,m] of [['/auth/v1/token?grant_type=password','POST'],['/auth/v1/token?grant_type=refresh_token','POST'],['/auth/v1/user','GET'],['/auth/v1/logout?scope=local','POST'],['/rest/v1/trips?select=id,data','GET'],['/rest/v1/trips','POST'],['/rest/v1/trips?id=eq.fixture','PATCH']])assert.equal(gateBRequestAllowed(QA_URL+p,m),true);
});
test('SDK allowlist denies production, signup, account updates, RPC, other tables and delete',()=>{
 for(const [u,m] of [['https://tznxfgosmjcmwoszvkdk.supabase.co/rest/v1/trips','POST'],['https://api.meta.ai/v1/responses','POST'],[QA_URL+'/auth/v1/signup','POST'],[QA_URL+'/auth/v1/user','PUT'],[QA_URL+'/rest/v1/rpc/reserve_meta_video_test','POST'],[QA_URL+'/rest/v1/trip_passes','GET'],[QA_URL+'/rest/v1/trips','DELETE'],[QA_URL+'/auth/v1/token?grant_type=id_token','POST']])assert.equal(gateBRequestAllowed(u,m),false);
});
