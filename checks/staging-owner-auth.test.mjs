import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {originalQAConfig,QA_URL} from '../qa-config/original-ui.mjs';
import {publicKeyFingerprint,QA_STAGING_ORIGIN,QA_LOCAL_ORIGIN} from '../qa-config/gate-a.mjs';
function reviewed(){const key='sb_publishable_'+'fixture'.repeat(4),owner={email:'owner@example.invalid',qaUserId:'11111111-1111-4111-8111-111111111111'};return {version:1,targetOrigin:QA_STAGING_ORIGIN,supabaseURL:QA_URL,publishableKey:key,owner,review:{qaProjectVerified:true,publicKeyProjectVerified:true,publicKeySHA256:publicKeyFingerprint(key),ownerIdentityVerified:true,redirectsVerified:true,siteURL:QA_STAGING_ORIGIN+'/',redirectURLs:[QA_STAGING_ORIGIN+'/'],noProductionResourcesVerified:true,accessVerified:true,accessIssuer:'https://fixture.cloudflareaccess.com',accessAudience:'a'.repeat(64),accessOwnerEmail:owner.email,accessOwnerQAUserId:owner.qaUserId,nextStepAuthorization:'GATE_B_QA_AUTH'}};}
function compile(c){return originalQAConfig({environment:'staging',allowAuthentication:true,gateBAuthorization:'STAGING_OWNER_AUTH',gateSource:{config:c},supplierFactory:()=>assert.fail('No suppliers'),assistantFactory:()=>assert.fail('No Meta adapter')});}
test('staging auth enables only with complete independent remote review; source remains unchanged',()=>{
 const c=reviewed(),before=JSON.stringify(c),v=compile(c);assert.equal(v.define['import.meta.env.VITE_QA_AUTH_READY'],'"true"');assert.equal(v.define['import.meta.env.VITE_SUPABASE_URL'],JSON.stringify(QA_URL));assert.equal(v.define['import.meta.env.VITE_QA_SUPPLIER_TEST'],'"false"');assert.equal(JSON.stringify(c),before);
});
test('staging auth rejects localhost configuration and never promotes local approval',()=>{
 const c=reviewed();c.targetOrigin=QA_LOCAL_ORIGIN;c.review.siteURL=QA_LOCAL_ORIGIN+'/';c.review.redirectURLs=[QA_LOCAL_ORIGIN+'/'];assert.equal(compile(c).define['import.meta.env.VITE_QA_AUTH_READY'],'"false"');
 const r=reviewed();r.review.nextStepAuthorization='';assert.equal(compile(r).define['import.meta.env.VITE_QA_AUTH_READY'],'"false"');assert.equal(r.review.nextStepAuthorization,'');
});
test('staging auth fails closed for missing config, Access drift and unconfirmed redirects',()=>{
 assert.equal(compile(null).define['import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY'],'""');
 for(const patch of [{accessVerified:false},{accessAudience:'invalid'},{accessOwnerEmail:'other@example.invalid'},{accessOwnerQAUserId:'other'},{redirectsVerified:false},{publicKeyProjectVerified:false}]){const c=reviewed();Object.assign(c.review,patch);assert.equal(compile(c).define['import.meta.env.VITE_QA_AUTH_READY'],'"false"');}
});
test('staging auth entry uses a separate ignored owner file and release verifier refuses auth-off build',()=>{
 const config=readFileSync('vite.staging.config.js','utf8');assert.match(config,/loadStagingGateAConfig/);assert.match(config,/STAGING_OWNER_AUTH/);assert.doesNotMatch(config,/gate-d-live|gate-b-session|readFile|process\.env/);
 assert.match(readFileSync('qa-config/gate-a.mjs','utf8'),/\.sorttrip-qa\/staging-connection\.local\.json/);
 assert.match(readFileSync('scripts/staging-verify.mjs','utf8'),/STAGING_OWNER_AUTH_NOT_CONFIGURED/);
});
