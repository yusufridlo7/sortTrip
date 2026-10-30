import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {jpegDimensions,preparedFrames} from '../lib/prepared-media.mjs';
import {extractMetaText,handleVideoItinerary} from '../worker/video-itinerary.js';
import {resolvePlace,normalizeDestinations,initialVideoTrip,placeCatalog,demoDestinations} from '../lib/video-itinerary.mjs';
import {prepareLocalVideo} from '../scripts/prepare-video-local.mjs';
import {readdir} from 'node:fs/promises';
const jpeg=readFileSync(new URL('../docs/hackathon-2026/phase-2/evidence/phase-2b/frame-qa.jpg',import.meta.url));
const image='data:image/jpeg;base64,'+jpeg.toString('base64');
const input=()=>({kind:'frames',consent:true,durationSeconds:3,frames:[{seconds:.45,image},{seconds:1.5,image},{seconds:2.55,image}],text:''});
const fields=['name','city','country','category','activity','sourceEvidence','evidenceKind','confidence','verified','recommendedDurationMinutes'];
const raw=()=>({destinations:[{...Object.fromEntries(fields.map(k=>[k,demoDestinations().destinations[0][k]])),sourceEvidence:'frame@0.45s',evidenceKind:'inferred'}]});
function setup({count=1500,code=200,settleFail=false,body=raw()}={}){
 const calls=[],settled=[];
 const env={META_AI_CUTOFF_AT:'2026-11-04T17:00:00Z',META_VIDEO_NONPRODUCTION:'true',META_VIDEO_FRAMES_ENABLED:'true',META_VIDEO_TEXT_ENABLED:'true',META_MODEL_API_KEY:'fixture-not-a-key',META_TEST_BUDGET:{reserve:async r=>({allowed:true,id:r.id,hardCap:true,totalLimitUSD:10,reservedUSD:.05}),settle:async r=>{settled.push(r);if(settleFail)throw Error('fixture-offline');return {ok:true};}}};
 const fetcher=async(url,options)=>{calls.push({url,body:JSON.parse(options.body)});if(url.endsWith('/input_tokens'))return Response.json({input_tokens:count});return Response.json({status:'completed',usage:{input_tokens:1500,output_tokens:100},output:[{type:'message',content:[{type:'output_text',text:JSON.stringify(body)}]}]},{status:code});};
 return {env,fetcher,calls,settled};
}
test('prepared JPEGs have bounded actual SOF dimensions; external URLs/signature/overflow rejected',()=>{
 assert.deepEqual(jpegDimensions(jpeg),{width:160,height:90});assert.equal(preparedFrames(input()).frames.length,3);
 for(const mutate of [b=>b.frames[0].image='https://example.test/image.jpg',b=>b.frames[0].seconds=4,b=>b.frames[1].seconds=0,b=>b.durationSeconds=61,b=>b.consent=false,b=>b.frames.push(b.frames[0]),b=>b.frames[0].image='data:image/jpeg;base64,'+Buffer.from('not jpeg').toString('base64')]){const b=input();mutate(b);assert.throws(()=>preparedFrames(b));}
 const huge=Uint8Array.from(jpeg);for(let i=0;i<huge.length-8;i++)if(huge[i]===255&&huge[i+1]===192){huge[i+5]=255;huge[i+6]=255;break;}assert.throws(()=>jpegDimensions(huge),/INVALID_FRAME/);
});
test('video frame mock: exact payload preflight before one inference; no audio, URLs, files upload or retry',async()=>{
 const s=setup(),r=await extractMetaText('Sampled video frames.',s.env,{fetcher:s.fetcher,prepared:input(),instructions:'hotel below 500000'});
 assert.equal(r.inputKind,'video-frames');assert.equal(r.audioIncluded,false);assert.equal(r.destinations[0].evidenceKind,'inferred');assert.equal(s.calls.length,2);assert.match(s.calls[0].url,/input_tokens$/);assert.deepEqual(s.calls[0].body,s.calls[1].body);assert.equal(s.calls[1].body.input[0].content.filter(c=>c.type==='input_image').length,3);assert.equal(s.calls[1].body.tools,undefined);assert.equal(s.settled.length,1);
});
test('token count rejection occurs before generation and retains full uncertain allocation',async()=>{
 for(const count of [0,20001,null,-1,'1500']){const s=setup({count});await assert.rejects(extractMetaText('Frames',s.env,{fetcher:s.fetcher,prepared:input()}),/INPUT_TOKEN_LIMIT/);assert.equal(s.calls.length,1);assert.equal(s.settled[0].chargedUSD,.05);}
});
test('paid extraction requires explicit nonproduction setting and frames gate before egress',async()=>{
 for(const flag of ['META_VIDEO_NONPRODUCTION','META_VIDEO_FRAMES_ENABLED']){const s=setup();delete s.env[flag];await assert.rejects(extractMetaText('Frames',s.env,{fetcher:s.fetcher,prepared:input()}),/MODEL_UNAVAILABLE/);assert.equal(s.calls.length,0);}
});
test('media cannot fabricate audio/caption evidence and settlement failure never retries',async()=>{
 const b=raw();b.destinations[0].sourceEvidence='heard in unsupplied audio';const s=setup({body:b});await assert.rejects(extractMetaText('Frames',s.env,{fetcher:s.fetcher,prepared:input()}),/INVALID_EVIDENCE/);
 const fail=setup({settleFail:true});await assert.rejects(extractMetaText('Frames',fail.env,{fetcher:fail.fetcher,prepared:input()}),/BUDGET_SETTLEMENT_FAILED/);assert.equal(fail.calls.length,2);assert.equal(fail.settled.length,1);
});
test('frame handler integrates authentication, schema and Meta mock; disabled route never forwards media',async()=>{
 const s=setup(),env={...s.env,SUPABASE_URL:'https://fixture.test',SUPABASE_PUBLISHABLE_KEY:'fixture',AI_LIMITER:{limit:async()=>({success:true})}};
 const request=()=>new Request('https://sorttrip.test/api/video-itinerary',{method:'POST',headers:{Authorization:'Bearer fixture','Content-Type':'application/json'},body:JSON.stringify(input())});
 const fetcher=(url,o)=>url.endsWith('/auth/v1/user')?Response.json({id:'fixture-user'}):s.fetcher(url,o);
 assert.equal((await handleVideoItinerary(request(),env,{fetcher})).status,200);delete env.META_VIDEO_NONPRODUCTION;const before=s.calls.length;assert.equal((await handleVideoItinerary(request(),env,{fetcher})).status,503);assert.equal(s.calls.length,before);
});
test('atomic-ledger mock serializes 250 concurrent users to exactly 200 allocations; exhaustion has no generation',async()=>{
 // Mock concurrency contract only: not proof of deployed PostgreSQL locks.
 let cents=0,tail=Promise.resolve(),generated=0;const active=new Set();
 const reserve=async r=>{let release;const previous=tail;tail=new Promise(r=>release=r);await previous;try{if(cents+5>1000||active.has(r.userId))return {allowed:false};cents+=5;active.add(r.userId);return {allowed:true,id:r.id,hardCap:true,totalLimitUSD:10,reservedUSD:.05};}finally{release();}};
 const s=setup();s.env.META_TEST_BUDGET={reserve,settle:async()=>({ok:true})};
 const fetcher=async(url,o)=>{if(!url.endsWith('/input_tokens'))generated++;return s.fetcher(url,o);};
 const results=await Promise.allSettled(Array.from({length:250},(_,i)=>extractMetaText('Frame',s.env,{fetcher,userId:'user-'+i,prepared:input()})));
 assert.equal(results.filter(x=>x.status==='fulfilled').length,200);assert.equal(generated,200);assert.equal(cents,1000);assert.equal(results.filter(x=>x.status==='rejected'&&x.reason.code==='BUDGET_EXHAUSTED').length,50);
});
test('same-user concurrent mock admits one request and keeps failed-settlement allocation',async()=>{
 let occupied=false,allocations=0;const s=setup();s.env.META_TEST_BUDGET={reserve:async r=>{if(occupied)return {allowed:false};occupied=true;allocations++;return {allowed:true,id:r.id,hardCap:true,totalLimitUSD:10,reservedUSD:.05};},settle:async()=>{throw Error('down');}};
 const results=await Promise.allSettled(Array.from({length:20},()=>extractMetaText('Frames',s.env,{fetcher:s.fetcher,userId:'same',prepared:input()})));assert.equal(results.filter(r=>r.status==='fulfilled').length,0);assert.equal(results.filter(r=>r.reason?.code==='BUDGET_SETTLEMENT_FAILED').length,1);assert.equal(allocations,1);assert.equal(occupied,true);
});
test('expanded dataset requires exact country/city and aliases dedupe; wrong city stays unverified',()=>{
 assert.ok(placeCatalog.length>=5);for(const [name,city,country] of [['Hoan Kiem Lake','Hanoi','Vietnam'],['Merlion','Singapore','Singapore'],['Candi Borobudur','Magelang','Indonesia']])assert.ok(resolvePlace(name,city,country)?.geo);
 assert.equal(resolvePlace('Borobudur','Yogyakarta','Indonesia'),undefined);assert.equal(resolvePlace('Merlion','Singapore','Malaysia'),undefined);
 const c={...raw().destinations[0],name:'Hoan Kiem Lake',city:'Hanoi',country:'Vietnam'};const rows=normalizeDestinations({destinations:[c,{...c,name:'Hồ Hoàn Kiếm'}]});assert.equal(rows[1].duplicate,true);const trip=initialVideoTrip(rows,{start:'2027-01-30',days:2,people:1});assert.equal(trip.items.length,1);assert.equal(trip.items[0].priceUnknown,true);const reloaded=JSON.parse(JSON.stringify(trip));assert.deepEqual(reloaded.items[0].geo,resolvePlace(c.name,c.city,c.country).geo);
});
test('SQL source has global lock, user attempt bound, anomaly halt and no refunds; not live RLS',()=>{
 const s=readFileSync(new URL('../supabase/meta-video-budget.sql',import.meta.url),'utf8');assert.match(s,/for update/);assert.match(s,/count\(\*\).*>=10/);assert.match(s,/set blocked=true/);assert.doesNotMatch(s,/allocated_usd\s*-/);
});
test('native offline QA really decodes synthetic MP4 frames/audio and cleans only its scratch directory',async()=>{
 const before=(await readdir(new URL('../artifacts/',import.meta.url))).filter(n=>n.startsWith('video-qa-'));
 const r=await prepareLocalVideo(new URL('../docs/hackathon-2026/phase-2/evidence/phase-2b/synthetic-qa.mp4',import.meta.url));
 assert.equal(r.frames.length,3);assert.equal(r.audio.status,'extracted-local-only');assert.equal(r.modelCalled,false);assert.equal(r.temporaryMediaDeleted,true);
 assert.deepEqual((await readdir(new URL('../artifacts/',import.meta.url))).filter(n=>n.startsWith('video-qa-')),before);
});
test('ambiguous dataset aliases do not use the first match or self-assert coordinates',()=>{
 const p=placeCatalog[0];placeCatalog.push({...p,id:'fixture-ambiguous'});try{assert.equal(resolvePlace(p.names[0],p.city,p.country),undefined);}finally{placeCatalog.pop();}
});
test('video localization is UTF-8 and contains no common mojibake sequences',()=>{
 const s=readFileSync(new URL('../app/i18n/locales/video.json',import.meta.url),'utf8');assert.doesNotMatch(s,/\u00c2\u00b7|\u00e2\u20ac/);assert.ok(JSON.parse(s).en.video_file.includes('·'));
});
test('accounting logs only fixed cost metadata and rejects an unexpected returned model',async()=>{
 const logs=[],original=console.info;console.info=value=>logs.push(JSON.parse(value));
 try{const s=setup();await extractMetaText('private source fixture',s.env,{fetcher:s.fetcher,prepared:input(),instructions:'private preferences fixture'});const output=JSON.stringify(logs);assert.doesNotMatch(output,/private source|private preferences|fixture-not-a-key|data:image|userId|Authorization/);assert.equal(logs[0].retainedAllocationUSD,.05);assert.equal(logs[0].settlementRecorded,true);
 const fetcher=async(url)=>url.endsWith('/input_tokens')?Response.json({input_tokens:1000}):Response.json({status:'completed',model:'unexpected-provider-model'});await assert.rejects(extractMetaText('Frames',s.env,{fetcher,prepared:input()}),/INVALID_MODEL_OUTPUT/);
 }finally{console.info=original;}
});
