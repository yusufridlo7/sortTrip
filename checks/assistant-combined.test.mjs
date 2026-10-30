import {test} from 'node:test';
import assert from 'node:assert/strict';
import {assistantMedia,mediaInstructions} from '../lib/assistant-media.mjs';
import {demoDestinations} from '../lib/video-itinerary.mjs';
import {validateInput} from '../worker/itinerary.js';
import {researchRequest} from '../worker/ai-draft.js';
import {extractMetaText} from '../worker/video-itinerary.js';
const request='Hari pertama museum, hotel di bawah 500000 per malam, hari terakhir dekat KLIA.';
test('caption, hotel budget intent, dates, transport preferences and reviewed places all reach one normal planner context',()=>{
 const q=validateInput({city:'Kuala Lumpur',country:'Malaysia',start:'2027-01-30',days:3,people:3,budget:4500000,pace:'santai',transportPreference:'hemat',interests:request,mediaDestinations:assistantMedia(demoDestinations().destinations),locked:[{day:1,time:'13:00',title:'Purchased museum'}],preserveItemIds:['paid-1']});
 assert.equal(q.interests,request);assert.equal(q.hotelBudget.maxNightIDR,500000);assert.equal(q.hotelStay.city,'Sepang');assert.equal(q.people,3);assert.equal(q.budget,4500000);assert.equal(q.transportPreference,'hemat');assert.equal(q.mediaDestinations.length,2);assert.equal(q.locked[0].title,'Purchased museum');assert.deepEqual(q.preserveItemIds,['paid-1']);
 const research=researchRequest(q,{}),input=JSON.parse(research.input);assert.equal(input.interests,request);assert.equal(input.mediaDestinations[0].name,'Muzium Negara');assert.match(research.instructions,/mediaDestinations/);assert.match(research.instructions,/protected|purchased/);
});
test('retained attachment metadata excludes transcript, credentials, model coordinates and false verification',()=>{
 const rows=assistantMedia([{...demoDestinations().destinations[0],sourceEvidence:'private transcript',access_token:'fixture',geo:{lat:9,lng:9}},{name:'Unknown Gallery',city:'Bangkok',country:'Thailand',verified:true,sourceUrl:'https://evil.test',confidence:'high'}]);
 assert.equal(rows[0].verified,true);assert.equal(rows[0].sourceEvidence,undefined);assert.equal(rows[0].geo,undefined);assert.equal(rows[0].access_token,undefined);assert.equal(rows[1].verified,false);assert.equal(rows[1].sourceUrl,undefined);
 assert.equal(assistantMedia([rows[0],{...rows[0],name:'National Museum'}]).length,1);assert.throws(()=>assistantMedia(Array(9).fill(rows[0])));assert.throws(()=>assistantMedia([{name:'',city:'x',country:'y'}]));
});
test('invalid caption is rejected before a budget reservation or model egress',async()=>{
 assert.throws(()=>mediaInstructions('x'.repeat(1001)));let calls=0;await assert.rejects(extractMetaText('transcript',{}, {instructions:'x'.repeat(1001),fetcher:()=>{calls++}}),/INVALID_INPUT/);assert.equal(calls,0);
});
test('Meta receives separate caption and source evidence in one call; caption is not accepted as transcript evidence',async()=>{
 const text=demoDestinations().transcript,fields=['name','city','country','category','activity','sourceEvidence','evidenceKind','confidence','verified','recommendedDurationMinutes'];let calls=0;
 const env={META_AI_CUTOFF_AT:'2026-11-04T17:00:00Z',META_VIDEO_NONPRODUCTION:'true',META_VIDEO_TEXT_ENABLED:'true',META_MODEL_API_KEY:'fixture',META_TEST_BUDGET:{reserve:async()=>({allowed:true,id:'fixture',hardCap:true,totalLimitUSD:10,reservedUSD:.05}),settle:async()=>({ok:true})}};
 const fetcher=async(u,o)=>{calls++;if(String(u).endsWith('/input_tokens'))return Response.json({input_tokens:500});const b=JSON.parse(o.body),content=JSON.parse(b.input[0].content[0].text);assert.equal(content.sourceTranscript,text);assert.equal(content.travelerRequest,request);assert.equal(b.tools,undefined);return Response.json({status:'completed',usage:{input_tokens:500,output_tokens:50},output:[{type:'message',content:[{type:'output_text',text:JSON.stringify({destinations:demoDestinations().destinations.map(c=>Object.fromEntries(fields.map(k=>[k,c[k]])))})}]}]});};
 const result=await extractMetaText(text,env,{fetcher,instructions:request});assert.equal(calls,2);assert.equal(result.destinations.length,2);
 const falseEvidence=async(u)=>String(u).endsWith('/input_tokens')?Response.json({input_tokens:500}):Response.json({status:'completed',output:[{type:'message',content:[{type:'output_text',text:JSON.stringify({destinations:[{name:'Muzium Negara',city:'Kuala Lumpur',country:'Malaysia',category:'museum',activity:'Visit',sourceEvidence:request,evidenceKind:'mentioned',confidence:'high',verified:false,recommendedDurationMinutes:90}]})}]}]});
 await assert.rejects(extractMetaText(text,env,{fetcher:falseEvidence,instructions:request}),/INVALID_EVIDENCE/);
});
