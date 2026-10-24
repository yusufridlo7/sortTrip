import {test} from 'node:test';
import assert from 'node:assert/strict';
import {validateTransferOrder} from '../worker/itinerary-order.mjs';
import {parseOfficialAdmission,enrichOfficialAdmissions} from '../worker/official-admission.js';
const url='https://www.muziumnegara.gov.my/en/ticket';
const museum={category:'Wisata',title:'National Museum (Muzium Negara)',city:'Kuala Lumpur'};
test('museum transfer must occur before the destination visit and after origin visit',()=>{
 const visits=[{...museum,day:1,time:'10:00'},{category:'Wisata',title:'Islamic Arts Museum Malaysia',day:1,time:'13:00'}];
 const route={category:'Transfer',day:1,time:'15:30',fromPlace:museum.title,toPlace:visits[1].title};
 assert.throws(()=>validateTransferOrder([...visits,route]),/Urutan/);
 assert.throws(()=>validateTransferOrder([...visits,{...route,time:'09:00'}]),/Urutan/);
 assert.doesNotThrow(()=>validateTransferOrder([...visits,{...route,time:'12:00'}]));
 assert.doesNotThrow(()=>validateTransferOrder([...visits,{...route,day:2}]));
});
test('official foreign adult price never falls back to cheaper citizen fare or another domain',()=>{
 const html='<h1>Muzium Negara</h1><table>MALAYSIAN CITIZEN Adult RM 2.00 FOREIGNER Adult RM 5.00 Children aged 6-12 RM 2.00</table>';
 assert.equal(parseOfficialAdmission(museum,url,html).amount,5);
 assert.equal(parseOfficialAdmission(museum,url.replace('.gov.my','.evil.test'),html),null);
 assert.equal(parseOfficialAdmission({...museum,title:'Other Museum'},url,html),null);
 assert.equal(parseOfficialAdmission(museum,url,'Muzium Negara MALAYSIAN CITIZEN Adult RM 2.00'),null);
 assert.equal(parseOfficialAdmission(museum,url,'Muzium Negara FOREIGNER Adult RM oops'),null);
});
test('official IAMM price includes adults and never substitutes student discount',()=>{
 const html='<h1>Islamic Arts Museum Malaysia</h1><h2>Admissions and Tickets</h2>Adults RM20 Students RM10';
 const result=parseOfficialAdmission({title:'Islamic Arts Museum Malaysia'},'https://iamm.org.my/visit-us',html);
 assert.equal(result.amount,20);assert.equal(result.currency,'MYR');assert.match(result.quote,/Adults RM20/);
});
test('admission fetch uses only fixed official URLs, deduplicates and uses dated verified reference on refresh failure',async()=>{
 const plan={activities:[museum,{...museum}, {category:'Wisata',title:'https://localhost/private'}],sources:[]};let calls=0;
 const result=await enrichOfficialAdmissions(plan,async(u,o)=>{calls++;assert.equal(u,url);assert.equal(o.redirect,'error');return new Response('Muzium Negara FOREIGNER Adult RM 5.00');});
 assert.equal(calls,1);assert.equal(result.activities[0].admission.amount,5);assert.equal(result.sources.length,1);assert.equal(result.activities[2].admission,undefined);
 const failed=await enrichOfficialAdmissions(plan,async()=>{throw Error('private');});assert.equal(failed.activities[0].admission?.amount,5);assert.equal(failed.activities[0].admission?.checkedAt,'2026-10-24T10:57:20Z');
});


test('full itinerary pipeline carries official museum admission through supplier enrichment',async()=>{
 const {handleItinerary}=await import('../worker/itinerary.js');const original=globalThis.fetch;
 const sources=[{url:'https://www.muziumnegara.gov.my/en/ticket',title:'Muzium Negara'},{url:'https://iamm.org.my/visit-us',title:'Islamic Arts Museum Malaysia'}];
 const activities=[{...museum,day:1,time:'10:00',sourceUrl:sources[0].url},{category:'Wisata',city:'Kuala Lumpur',title:'Islamic Arts Museum Malaysia',day:1,time:'13:00',sourceUrl:sources[1].url}];
 globalThis.fetch=async(url,options)=>{
  const u=String(url);if(u.endsWith('/auth/v1/user'))return Response.json({id:'fixture'});
  if(u.includes('reserve_ai_request'))return Response.json({allowed:true});if(u.includes('finish_ai_request'))return Response.json({ok:true});
  if(u===sources[0].url)return new Response('Muzium Negara FOREIGNER Adult RM 5.00');if(u===sources[1].url)return new Response('Islamic Arts Museum Malaysia Admissions and Tickets Adults RM20 Students RM10');
  const body=JSON.parse(options.body);if(body.tools)return Response.json({status:'completed',output:[{action:{sources}},{content:[{type:'output_text',text:'Official museum references'}]}]});
  return Response.json({status:'completed',output:[{content:[{type:'output_text',text:JSON.stringify({summary:'Test',activities})}]}]});
 };
 try{const r=await handleItinerary(new Request('https://sorttrip.test/api/itinerary',{method:'POST',headers:{Authorization:'Bearer fixture'},body:JSON.stringify({city:'Kuala Lumpur',country:'Malaysia',start:'2027-01-30',days:3,people:1,budget:4500000})}),{OPENAI_API_KEY:'fixture',SUPABASE_URL:'https://db.test',SUPABASE_SERVICE_ROLE_KEY:'fixture',SUPABASE_PUBLISHABLE_KEY:'fixture',AI_LIMITER:{limit:async()=>({success:true})}});assert.equal(r.status,200);const body=await r.json();assert.deepEqual(body.plan.activities.map(x=>x.admission?.amount),[5,20]);}finally{globalThis.fetch=original;}
});

 test('dated admission reference expires without refreshing its timestamp',async()=>{const {referenceAdmission}=await import('../worker/admission-reference.mjs');const now=Date.parse('2026-10-25T00:00:00Z');assert.equal(referenceAdmission('National Museum','Kuala Lumpur',now)?.amount,5);assert.equal(referenceAdmission('National Museum','Singapore',now),undefined);assert.equal(referenceAdmission('National Museum Annex','Kuala Lumpur',now),undefined);assert.equal(referenceAdmission('National Museum','Kuala Lumpur',now+31*86400000),undefined);});
