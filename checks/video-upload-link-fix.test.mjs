import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {socialVideoUrl,demoDestinations} from '../lib/video-itinerary.mjs';
import {FRAME_LIMITS,preparedFrames} from '../lib/prepared-media.mjs';
import {handleVideoItinerary} from '../worker/video-itinerary.js';
const auth={SUPABASE_URL:'https://qa.fixture.test',SUPABASE_PUBLISHABLE_KEY:'fixture',AI_LIMITER:{limit:async()=>({success:true})}};
const request=body=>new Request('https://sorttrip.test/api/video-itinerary',{method:'POST',headers:{Authorization:'Bearer fixture','Content-Type':'application/json'},body:JSON.stringify(body)});
const source='https://vt.tiktok.com/ZSgq41yuY/';
function model(){
 const calls=[],fields=['name','city','country','category','activity','sourceEvidence','evidenceKind','confidence','verified','recommendedDurationMinutes'];
 const output={destinations:demoDestinations().destinations.map(c=>Object.fromEntries(fields.map(k=>[k,c[k]])))};
 const env={...auth,META_AI_CUTOFF_AT:'2026-11-04T17:00:00Z',META_VIDEO_NONPRODUCTION:'true',META_VIDEO_TEXT_ENABLED:'true',META_VIDEO_FRAMES_ENABLED:'true',META_MODEL_API_KEY:'fixture',META_TEST_BUDGET:{reserve:async r=>({allowed:true,id:r.id,hardCap:true,totalLimitUSD:10,reservedUSD:.05}),settle:async()=>({ok:true})}};
 const fetcher=async(url,options)=>{
  calls.push(url);
  if(url.endsWith('/auth/v1/user'))return Response.json({id:'fixture-user'});
  assert.ok(url.startsWith('https://api.meta.ai/')); // No TikTok/redirect egress.
  if(url.endsWith('/input_tokens'))return Response.json({input_tokens:1000});
  const payload=JSON.parse(options.body);assert.equal(payload.reasoning.effort,'low');
  assert.equal(JSON.stringify(payload).includes('vt.tiktok.com'),false);
  return Response.json({status:'completed',model:'muse-spark-1.3',usage:{input_tokens:1000,output_tokens:200},output:[{type:'message',content:[{type:'output_text',text:JSON.stringify(output)}]}]});
 };
 return {env,fetcher,calls};
}
test('known vt/vm share links accepted, tracking stripped; hosts and paths remain restricted',()=>{
 assert.deepEqual(socialVideoUrl(source+'?share_id=tracking'),{provider:'tiktok',url:source});
 assert.equal(socialVideoUrl('https://vm.tiktok.com/Abc123').url,'https://vm.tiktok.com/Abc123/');
 for(const url of ['https://vt.tiktok.com/abc/def','https://vt.tiktok.com.evil.test/Abc123/','https://vt.tiktok.com:443/Abc123/','https://vt.tiktok.com/Abc%2f12/','https://vt.tiktok.com/@name']){
  // URL normalizes an explicit default HTTPS port; nondefault ports must fail.
  if(url.includes(':443'))continue;
  assert.throws(()=>socialVideoUrl(url));
 }
 assert.throws(()=>socialVideoUrl('https://vt.tiktok.com:444/Abc123/'));
});
test('frame request above old16KB cap reaches disabled analysis gate instead of false413',async()=>{
 const jpeg=readFileSync(new URL('../docs/hackathon-2026/phase-2/evidence/phase-2b/frame-qa.jpg',import.meta.url));
 const segment=Buffer.alloc(20004);segment[0]=255;segment[1]=224;segment.writeUInt16BE(20002,2);
 const image='data:image/jpeg;base64,'+Buffer.concat([jpeg.subarray(0,2),segment,jpeg.subarray(2)]).toString('base64');
 const body={kind:'frames',consent:true,durationSeconds:3,text:'',frames:[{seconds:.45,image},{seconds:1.5,image},{seconds:2.55,image}]};
 assert.ok(JSON.stringify(body).length>16000);assert.equal(preparedFrames(body).frames.length,3);
 let calls=0;const response=await handleVideoItinerary(request(body),auth,{fetcher:async()=>{calls++;return Response.json({id:'fixture-user'});}});
 assert.equal(response.status,503);assert.equal((await response.json()).code,'MODEL_UNAVAILABLE');assert.equal(calls,1);
 const enabled=model();const ok=await handleVideoItinerary(request({...body,text:demoDestinations().transcript}),enabled.env,{fetcher:enabled.fetcher});
 assert.equal(ok.status,200);assert.equal((await ok.json()).inputKind,'video-frames');
});
test('transport overflow is distinguished from file size, with or without activation',async()=>{
 for(const active of ['false','true']){
  const r=await handleVideoItinerary(request({kind:'frames',extra:'x'.repeat(FRAME_LIMITS.totalBody)}),{...auth,META_VIDEO_FRAMES_ENABLED:active},{fetcher:async()=>Response.json({id:'fixture-user'})});
  assert.equal(r.status,413);assert.equal((await r.json()).code,'REQUEST_TOO_LARGE');
 }
});
test('linked transcript follows normal auth/model/budget path and never fetches social media',async()=>{
 const s=model(),text=demoDestinations().transcript;
 const r=await handleVideoItinerary(request({kind:'linked-transcript',url:source,text,consent:true,instructions:'Hotel below 500000 per night'}),s.env,{fetcher:s.fetcher});
 assert.equal(r.status,200);const data=await r.json();assert.equal(data.inputKind,'transcript');assert.equal(data.videoAccessed,false);assert.equal(data.source.url,source);assert.equal(data.destinations.length,2);assert.equal(s.calls.length,3);
 for(const body of [{text:'',consent:true},{text,consent:false},{text:'x'.repeat(12001),consent:true}]){
  const invalid=model();assert.equal((await handleVideoItinerary(request({kind:'linked-transcript',url:source,...body}),invalid.env,{fetcher:invalid.fetcher})).status,400);assert.equal(invalid.calls.length,1);
 }
});

test('QA validation failure exposes only fixed stage and usage, never model output or source content',async()=>{
 const s=model();let requests=0;
 const fetcher=async(url,o)=>{
  if(url.endsWith('/responses')){requests++;return Response.json({status:'incomplete',model:'muse-spark-1.3',usage:{input_tokens:401,output_tokens:2000},output:[{type:'message',content:[{type:'output_text',text:'DO_NOT_EXPOSE_MODEL_TEXT'}]}]});}
  return s.fetcher(url,o);
 };
 const r=await handleVideoItinerary(request({kind:'linked-transcript',url:source,text:'PRIVATE_SOURCE_FIXTURE',consent:true}),s.env,{fetcher});
 assert.equal(r.status,502);const data=await r.json();assert.equal(data.qa.validationStage,'response-not-completed');assert.equal(data.qa.usage.outputTokens,2000);assert.equal(requests,1);
 assert.doesNotMatch(JSON.stringify(data),/PRIVATE_SOURCE_FIXTURE|DO_NOT_EXPOSE|Authorization|vt\.tiktok|fixture-user/);
});
