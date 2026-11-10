import {test} from 'node:test';
import assert from 'node:assert/strict';
import {transportResearchHints} from '../worker/transport-research-hints.mjs';
import {transportResearchRequest} from '../worker/ai-draft.js';
import {relevantSource,checkRouteSources} from '../worker/itinerary-evidence.mjs';
test('exact KL connector checklist keeps official discovery candidates separate from evidence',()=>{
 const q={city:'Kuala Lumpur',interests:'Muzium Negara',retained:[{title:'Travelodge Kuala Lumpur City Centre'}],routeRequests:[{day:2,from:'Hotel',to:'Museum',mode:'MRT',private:'discard'}]};
 const hints=transportResearchHints(q);assert.equal(hints.candidateSources.length,3);assert.equal(hints.requiredConnections[0].private,undefined);
 const request=transportResearchRequest(q,{},'Existing evidence');const input=JSON.parse(request.input);
 assert.deepEqual(input.sourceSearchHints,hints);assert.equal(input.sources,undefined);assert.match(request.instructions,/discovery hints, not evidence/);
 assert.match(request.instructions,/not another museum-admission/);
});
test('other cities do not receive irrelevant KL hints or arbitrary client URLs',()=>{
 const hints=transportResearchHints({city:'Hanoi',interests:'Muzium Negara',candidateSources:[{url:'https://private.invalid'}]});
 assert.deepEqual(hints.candidateSources,[]);assert.ok(!JSON.stringify(hints).includes('private.invalid'));
});
test('station role labels keep exact-place information links relevant without granting fare proof',()=>{
 const source={url:'https://operator.test/pasar-seni',title:'Pasar Seni station access'};
 for(const label of ['Station Pasar Seni','Stasiun Pasar Seni','Pasar Seni Station'])assert.equal(relevantSource({category:'Transfer',title:label,sourceUrl:source.url},[source]),true);
 assert.equal(relevantSource({category:'Transfer',title:'Station KLCC',sourceUrl:source.url},[source]),false);
 const result=checkRouteSources({routeOptions:[{legs:[{fromPlace:'Station Pasar Seni',toPlace:'Station KLCC',mode:'MRT',sourceUrl:source.url,fare:'MYR 2',checkedAt:'2026-11-03'}]}]},[source],'No fare quote');
 assert.equal(result.routeOptions[0].legs[0].sourceRelevant,true);assert.equal(result.routeOptions[0].legs[0].fare,undefined);
});
