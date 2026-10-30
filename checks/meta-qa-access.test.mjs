import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {handleMetaQAAccess} from '../worker/meta-qa-access.js';
const request=(headers={})=>new Request('http://127.0.0.1:8790/api/meta-qa/model-access',{method:'POST',headers:{Authorization:'Bearer fixture-session',...headers}});
const env={SUPABASE_URL:'https://qa.example.test',SUPABASE_PUBLISHABLE_KEY:'fixture-public',META_MODEL_API_KEY:'fixture-private',AI_LIMITER:{limit:async()=>({success:true})}};
test('metadata check authenticates before egress and rejects cross-origin/missing auth',async()=>{
 let calls=0;const fetcher=async()=>{calls++;throw Error('unexpected');};assert.equal((await handleMetaQAAccess(request({Origin:'https://untrusted.example'}),env,{fetcher})).status,403);assert.equal((await handleMetaQAAccess(request({Authorization:''}),env,{fetcher})).status,401);assert.equal(calls,0);
});
test('metadata-only check uses fixed GET model path, no generation/media/budget requests or secret response',async()=>{
 const calls=[];const r=await handleMetaQAAccess(request(),env,{fetcher:async(url,o)=>{calls.push({url,method:o.method||'GET',redirect:o.redirect,body:o.body});return Response.json(url.endsWith('/auth/v1/user')?{id:'fixture-user'}:{id:'muse-spark-1.3',private_field:'must-not-expose'});}});const text=await r.text();assert.equal(r.status,200);assert.equal(calls.length,2);assert.equal(calls[1].url,'https://api.meta.ai/v1/models/muse-spark-1.3');assert.equal(calls[1].method,'GET');assert.equal(calls[1].body,undefined);assert.equal(calls[1].redirect,'manual');assert.doesNotMatch(text,/fixture-private|fixture-session|fixture-user|private_field/);assert.equal(JSON.parse(text).inferencePerformed,false);
});
test('metadata errors and limiter are sanitized and never retry',async()=>{
 for(const status of [401,403,404,429,500]){let calls=0;const r=await handleMetaQAAccess(request(),env,{fetcher:async url=>{calls++;return url.endsWith('/auth/v1/user')?Response.json({id:'fixture-user'}):Response.json({error:'sensitive-provider-details'},{status});}});assert.equal(calls,2);assert.equal(r.status,status===429?429:503);assert.doesNotMatch(await r.text(),/sensitive-provider-details/);}
 let calls=0;assert.equal((await handleMetaQAAccess(request(),{...env,AI_LIMITER:{limit:async()=>({success:false})}},{fetcher:async()=>{calls++;return Response.json({id:'fixture-user'});}})).status,429);assert.equal(calls,1);
});
test('QA verification UI is gated by Vite mode and documents metadata-only meaning',()=>{
 const source=readFileSync(new URL('../app/travel-app.tsx',import.meta.url),'utf8');assert.match(source,/import\.meta\.env\.MODE==='meta-qa'&&<><MetaQAAccess\/><MetaQARLS\/><\/>/);const ui=readFileSync(new URL('../app/meta-qa-access.tsx',import.meta.url),'utf8');assert.match(ui,/inferencePerformed===false/);assert.doesNotMatch(ui,/\/v1\/responses|META_MODEL_API_KEY|SUPABASE_SECRET_KEY/);
});
test('Cloudflare-compatible manual redirect refuses auth/model redirects without forwarding keys',async()=>{
 for(const authRedirect of [true,false]){const calls=[];const r=await handleMetaQAAccess(request(),env,{fetcher:async(url,o)=>{assert.equal(o.redirect,'manual');calls.push(url);return url.endsWith('/auth/v1/user')&&!authRedirect?Response.json({id:'fixture-user'}):new Response(null,{status:302,headers:{Location:'https://untrusted.example'}});}});assert.equal(r.status,authRedirect?401:503);assert.equal(calls.length,authRedirect?1:2);assert.ok(calls.every(u=>!u.includes('untrusted.example')));}
});
