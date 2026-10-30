import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import ts from 'typescript';
import {qaClientReady,QA_SUPABASE_URL} from '../lib/qa-client-config.mjs';
import {verifyQAOwner,verifyStagingAccess} from '../worker/staging-access.js';
const publicFixture='sb_publishable_'+'fixture'.repeat(4);
const legacy=(role='anon',ref='aytrcvfncsklhqozreyk')=>['fixture',Buffer.from(JSON.stringify({role,ref})).toString('base64url'),'fixture'].join('.');
test('missing/disabled QA bindings never permit client initialization',()=>{
 for(const [url,key,enabled] of [[undefined,undefined,undefined],[QA_SUPABASE_URL,'','true'],[QA_SUPABASE_URL,publicFixture,'false'],['',publicFixture,'true'],[QA_SUPABASE_URL,null,'true']])assert.equal(qaClientReady(url,key,enabled),false);
});
test('actual production project and alternate URLs are rejected even with an apparent public key',()=>{
 for(const url of ['https://tznxfgosmjcmwoszvkdk.supabase.co',QA_SUPABASE_URL+'/',QA_SUPABASE_URL+'/rest/v1',QA_SUPABASE_URL.replace('https:','http:'),'https://example.invalid'])assert.equal(qaClientReady(url,publicFixture,'true'),false);
});
test('server secrets, legacy service role and wrong-project JWT cannot be used by QA browser client',()=>{
 for(const key of ['sb_secret_'+'synthetic'.repeat(4),legacy('service_role'),legacy('anon','tznxfgosmjcmwoszvkdk'),'fixture-not-a-key','a.b.c',publicFixture+'\n'])assert.equal(qaClientReady(QA_SUPABASE_URL,key,'true'),false);
});
test('public binding syntax accepts QA anon or publishable only after authorization, without treating it as a verified session',()=>{
 assert.equal(qaClientReady(QA_SUPABASE_URL,publicFixture,'true'),true);assert.equal(qaClientReady(QA_SUPABASE_URL,legacy(),'true'),true);assert.equal(qaClientReady(QA_SUPABASE_URL,legacy(),true),false);
});
test('actual Supabase module fails closed before createClient for missing, wrong-project or server bindings',async()=>{
 const original=ts.transpileModule(await readFile('app/supabase.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.ES2022,target:ts.ScriptTarget.ES2022}}).outputText;
 const data=source=>'data:text/javascript;base64,'+Buffer.from(source).toString('base64');
 globalThis.__qaClientConstruction=0;
 for(const values of [{MODE:'qa-preparation',VITE_SUPABASE_URL:QA_SUPABASE_URL,VITE_SUPABASE_PUBLISHABLE_KEY:''},{MODE:'staging',VITE_SUPABASE_URL:'https://tznxfgosmjcmwoszvkdk.supabase.co',VITE_SUPABASE_PUBLISHABLE_KEY:publicFixture,VITE_QA_AUTH_READY:'true'},{MODE:'qa-preparation',VITE_SUPABASE_URL:QA_SUPABASE_URL,VITE_SUPABASE_PUBLISHABLE_KEY:legacy('service_role'),VITE_QA_AUTH_READY:'true'}]){
  const code=original.replace(/(['"])@supabase\/supabase-js\1/,JSON.stringify(data('export function createClient(){globalThis.__qaClientConstruction++;throw Error("Unexpected client")};'))).replace(/(['"])\.\/bounded-fetch\1/,JSON.stringify(data('export const boundedFetch=()=>{throw Error("Unexpected network")};'))).replace(/(['"])\.\.\/lib\/qa-client-config.mjs\1/,JSON.stringify(pathToFileURL(resolve('lib/qa-client-config.mjs')).href)).replaceAll('import.meta.env',JSON.stringify(values));
  assert.equal((await import(data(code))).supabase,null);
 }
 assert.equal(globalThis.__qaClientConstruction,0);delete globalThis.__qaClientConstruction;
});
test('missing QA publishable key cannot even query QA Auth and unconfigured Access cannot serve assets',async()=>{
 let calls=0;const fetcher=()=>{calls++;assert.fail('No egress permitted')};
 await assert.rejects(verifyQAOwner(new Request('https://staging.invalid/api/staging/session',{headers:{Authorization:'Bearer fixture'}}),{}, {email:'owner@example.invalid'},{fetcher}),/STAGING_CONFIG_REQUIRED/);
 await assert.rejects(verifyStagingAccess(new Request('https://staging.invalid'),{}, {fetcher}),/STAGING_CONFIG_REQUIRED/);assert.equal(calls,0);
});
