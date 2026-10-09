import {test} from 'node:test';
import assert from 'node:assert/strict';
import {validateRoutes} from '../worker/transport-plan.js';
const sourceUrl='https://example.test/operator',sources=[{url:sourceUrl}];
const leg=(fromPlace,toPlace,mode)=>({fromPlace,toPlace,mode,note:'Verify service and border conditions',sourceUrl});
const options=[{kind:'hemat',summary:'Public transport with connection; fare unverified',legs:[leg('A','Terminal','Local bus'),leg('Terminal','B','Coach')]},{kind:'cepat',summary:'Direct journey; schedule unverified',legs:[leg('A','B','Direct coach')]}];
test('selects requested feasible alternative, preserves connected legs without invented fares',()=>{
 const r=validateRoutes(options,sources,'hemat');assert.equal(r.selectedRoute,0);assert.equal(r.routeOptions[0].legs.length,2);assert.equal(r.routeOptions[0].price,undefined);assert.equal(validateRoutes(options,sources,'cepat').selectedRoute,1);
});
test('rejects missing transit connection, mismatched endpoints and unresearched operator source',()=>{
 for(const changed of [[{...options[0],legs:[leg('A','Terminal','Bus'),leg('Other terminal','B','Coach')]}],[options[0],{...options[1],legs:[leg('A','C','Coach')]}],[{...options[0],legs:[{...leg('A','B','Bus'),sourceUrl:'https://unverified.test'}]}]])assert.throws(()=>validateRoutes(changed,sources));
});
test('keeps dated sourced fare quotes outside budget and rejects undated quotes',()=>{
 const quoted={...options[0],legs:[{...leg('A','B','Bus'),fare:'SGD 2 / orang',duration:'30–45 menit',checkedAt:'2026-10-09'}]};
 const r=validateRoutes([quoted],sources);assert.equal(r.routeOptions[0].legs[0].fare,'SGD 2 / orang');assert.equal(r.routeOptions[0].price,undefined);
 assert.throws(()=>validateRoutes([{...quoted,legs:[{...quoted.legs[0],checkedAt:null}]}],sources));
});
