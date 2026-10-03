import {test} from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,readFile,writeFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {pathToFileURL} from 'node:url';
import ts from 'typescript';
const tmp=await mkdtemp(join(tmpdir(),'sorttrip-test-'));
let api,travel,saveState,network;
try{
 for(const name of ['travel-data','api-flights','trip-save','bounded-fetch']){const src=await readFile(new URL('../app/'+name+'.ts',import.meta.url),'utf8');const js=ts.transpileModule(src,{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ES2022}}).outputText.replace("'./travel-data'","'./travel-data.mjs'");await writeFile(join(tmp,name+'.mjs'),js);}
 api=await import(pathToFileURL(join(tmp,'api-flights.mjs')));travel=await import(pathToFileURL(join(tmp,'travel-data.mjs')));saveState=await import(pathToFileURL(join(tmp,'trip-save.mjs')));network=await import(pathToFileURL(join(tmp,'bounded-fetch.mjs')));
}finally{await rm(tmp,{recursive:true,force:true});}
const q={origin:'CGK',destination:'kl',journey:'return',minDays:3,maxDays:5,people:2,budget:5000000};
const f={id:'real',destinationId:'kl',origin:'CGK',destination:'KUL',start:'2027-01-10',end:'2027-01-13',days:4,price:1234567,airline:'AK',flightNumber:'381',departureAt:'2027-01-10T07:00:00+07:00',returnAt:'2027-01-13T18:00:00+08:00',durationTo:120,durationBack:130,transfers:0,bookingUrl:'https://www.aviasales.com/search/example'};
test('API itinerary preserves actual returned fare and link, budgets use correct group multiplier',()=>{const t=api.apiTrip(f,q);assert.equal(t.flight.source,'aviasales');assert.equal(t.flight.depart,'07:00');assert.equal(t.flight.arrive,'10:00');assert.equal(t.days,4);const item=t.items.find(x=>x.id==='flight');assert.equal(item.price,f.price);assert.equal(item.bookingUrl,f.bookingUrl);assert.ok(!item.note.includes('simulasi'));assert.ok(t.items.filter(x=>x.category==='Wisata').length>=2);assert.equal(travel.costs(t).total,t.items.reduce((a,x)=>a+x.price*(x.shared?1:2),0));assert.equal(JSON.parse(JSON.stringify(t)).flight.source,'aviasales');});
test('one-way stays one-way and unknown times not invented',()=>{const t=api.apiTrip({...f,end:'',returnAt:null,durationTo:null},{...q,journey:'oneway'});assert.equal(t.journey,'oneway');assert.equal(t.days,3);assert.equal(t.flight.arrive,'--:--');assert.equal(t.flight.duration,0);assert.ok(!t.items.some(x=>x.returnLeg));});
test('overnight arrival carries destination day offset and excludes pre-arrival activities',()=>{
 const t=api.apiTrip({...f,departureAt:'2027-01-10T23:00:00+07:00',durationTo:180,destinationZone:'Asia/Kuala_Lumpur'},q);
 assert.equal(t.flight.arrivalDay,1);assert.equal(t.flight.arrive,'03:00');
 assert.ok(!t.items.some(x=>['Wisata','Makan'].includes(x.category)&&x.day===1));
 assert.equal(t.items.find(x=>x.id==='hotel').day,2);
});
test('late arrival hotel time belongs to next day and early return has no conflicting visits',()=>{
 const t=api.apiTrip({...f,departureAt:'2027-01-10T20:50:00+07:00',durationTo:125,returnAt:'2027-01-13T07:00:00+08:00'},q);
 assert.equal(t.items.find(x=>x.id==='hotel').day,2);
 assert.equal(t.items.find(x=>x.id==='hotel').time,'01:55');
 assert.ok(!t.items.some(x=>['Wisata','Makan'].includes(x.category)&&x.day===4));
});
test('flight request preserves domestic scope, cancellation and no fake data',async()=>{
 const original=globalThis.fetch;let requested;
 globalThis.fetch=async(url)=>{requested=String(url);return Response.json({flights:[]});};
 try{const r=await api.fetchFlights({...q,scope:'all'},new AbortController().signal);assert.equal(new URL(requested,'https://test').searchParams.get('scope'),'all');assert.deepEqual(r.flights,[]);}finally{globalThis.fetch=original;}
});

test('worldwide itinerary is saveable without invented hotel or attraction costs',()=>{const t=api.apiTrip({...f,destinationId:'TYO',destination:'NRT',city:'Tokyo',country:'Jepang',destinationZone:'Asia/Tokyo'},q);assert.equal(t.destination,'TYO');assert.equal(t.destinationMeta.city,'Tokyo');assert.equal(t.estimateIncomplete,true);assert.equal(t.items.length,1);assert.equal(t.items[0].price,f.price);assert.equal(t.flight.arrive,'11:00');assert.equal(travel.costs(t).perPerson,f.price);assert.equal(JSON.parse(JSON.stringify(t)).destinationMeta.code,'NRT');});

test('save response keeps concurrent edits and identity, without attaching id to a different draft',()=>{
 const snapshot=api.apiTrip(f,q);const edited={...snapshot,budget:6000000};
 const result=saveState.reconcileSavedTrip(edited,snapshot,'saved-id',true);
 assert.equal(result.trip.budget,6000000);assert.equal(result.trip.id,'saved-id');assert.equal(result.dirty,true);
 assert.equal(saveState.reconcileSavedTrip(snapshot,snapshot,'saved-id',true).dirty,false);
 assert.equal(saveState.reconcileSavedTrip(edited,snapshot,'saved-id',false),null);
 assert.equal(saveState.reconcileSavedTrip(null,snapshot,'saved-id',true),null);
});

test('bounded fetch preserves cancellation for Request and init signals',async()=>{
 const original=globalThis.fetch;let observed;globalThis.fetch=async(_input,init)=>{observed=init.signal;return Response.json({ok:true});};
 try{for(const asRequest of [false,true]){const c=new AbortController();await network.boundedFetch(asRequest?new Request('https://example.test',{signal:c.signal}):'https://example.test',asRequest?{}:{signal:c.signal});assert.equal(observed.aborted,false);c.abort();assert.equal(observed.aborted,true);}}finally{globalThis.fetch=original;}
});
