import {test} from 'node:test';
import assert from 'node:assert/strict';
import {streamItinerary} from '../worker/itinerary-stream.js';
import {itineraryResponse} from '../app/itinerary-response.mjs';
test('server streams only permitted stages and preserves localized error status without AI calls',async()=>{
 const stages=[];const response=streamItinerary(new Request('https://test/api/itinerary',{headers:{'X-SortTrip-Language':'en'}}),{},async(req,env,progress)=>{progress('research');progress('private-diagnostic');progress('hotels');return Response.json({code:'TEST',error:'fixture'},{status:402})});
 const result=await itineraryResponse(response,s=>stages.push(s));assert.equal(result.status,402);assert.equal(result.ok,false);assert.deepEqual(stages,['validating','research','hotels']);assert.equal(result.body.code,'TEST');
});
test('client handles UTF-8 frame boundaries, heartbeats and JSON fallback',async()=>{
 const bytes=new TextEncoder().encode('data: {"type":"heartbeat"}\n\ndata: {"type":"progress","stage":"draft"}\n\ndata: {"type":"result","status":200,"body":{"summary":"Hà Nội"}}\n\n');
 let i=0;const stream=new ReadableStream({pull(c){if(i===bytes.length)c.close();else c.enqueue(bytes.slice(i,i+=1))}});
 const seen=[],result=await itineraryResponse(new Response(stream,{headers:{'Content-Type':'text/event-stream'}}),s=>seen.push(s));assert.equal(result.body.summary,'Hà Nội');assert.deepEqual(seen,['draft']);
 assert.deepEqual(await itineraryResponse(Response.json({error:'fixture'},{status:401})),{status:401,ok:false,body:{error:'fixture'}});
});
test('missing terminal result and malformed result cannot be treated as success',async()=>{
 for(const data of ['data: {"type":"heartbeat"}\n\n','data: {"type":"result","status":999,"body":{}}\n\n'])await assert.rejects(()=>itineraryResponse(new Response(data,{headers:{'Content-Type':'text/event-stream'}})),/ai_progress_interrupted/);
});
test('cancelling streamed response aborts provider work and avoids unhandled stream errors',async()=>{
 let signal;const r=streamItinerary(new Request('https://test/api/itinerary'),{},async req=>{signal=req.signal;await new Promise(resolve=>req.signal.addEventListener('abort',resolve,{once:true}));return Response.json({cancelled:true})});
 await r.body.cancel();assert.equal(signal.aborted,true);
});
