import {test} from 'node:test';
import assert from 'node:assert/strict';
import {metaDraftWire} from '../worker/meta-wire.js';
import {draftRequest} from '../worker/ai-draft.js';
test('Meta-only source compaction is lossless and schema keeps arrival bounds without mutating original',()=>{
 const q={city:'Kuala Lumpur',days:4,start:'2026-11-07',arrival:'22:55',arrivalDay:0,oneWay:true};
 const source='https://example.com/a/long/verified/source';
 const original=draftRequest(q,{},'Evidence',[{url:source,title:'Source'}]),before=structuredClone(original),wire=metaDraftWire(original);
 assert.deepEqual(original,before);assert.deepEqual(wire.body.text.format.schema.properties.activities.items.properties.sourceUrl.enum,['S1']);
 assert.equal(wire.body.text.format.schema.properties.activities.items.properties.day.minimum,2);
 assert.equal(wire.body.text.format.schema.properties.activities.maxItems,70); // do not drop required connectors to fit sixteen records
 assert.equal(JSON.parse(wire.body.input).sourceRegistry.S1,source);
 const restored=wire.restore({status:'completed',output:[{type:'message',content:[{type:'output_text',text:JSON.stringify({activities:[{sourceUrl:'S1',note:'S1 stays literal',routeOptions:[{legs:[{sourceUrl:'S1'}]}],admission:{sourceUrl:'S1',quote:'S1 untouched'}}]})}]}]});
 const result=JSON.parse(restored.output[0].content[0].text);assert.equal(result.activities[0].sourceUrl,source);assert.equal(result.activities[0].routeOptions[0].legs[0].sourceUrl,source);assert.equal(result.activities[0].note,'S1 stays literal');assert.equal(result.activities[0].admission.quote,'S1 untouched');
});
test('incomplete responses and non-itinerary calls are never repaired into valid plans',()=>{
 const request={input:'raw',instructions:'original'};assert.equal(metaDraftWire(request).body,request);
 const d=draftRequest({days:3,start:'2026-11-07',oneWay:true},{},'Evidence',[{url:'https://example.com'}]);
 const incomplete={status:'incomplete',output:[]};assert.equal(metaDraftWire(d).restore(incomplete),incomplete);
});
