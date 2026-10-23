import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import ts from 'typescript';
import {itineraryIntent} from '../worker/itinerary-intent.mjs';
import {validateInput,attractionReferences,validatePlan} from '../worker/itinerary.js';
import {priceTargets} from '../worker/price-research.js';
test('current-message hotel budget is parsed on the server, never trusted from client budget overrides',()=>{
 for(const message of ['hotel ganti cari dibawah 500000 permalam','replace hotel under IDR 500000 per night','cari hotel di bawah 500 rb per malam'])assert.equal(itineraryIntent(message).maxNightIDR,500000);
 assert.equal(itineraryIntent('jangan ganti hotel di bawah 500000 per malam').replaceHotels,false);
 const input=validateInput({city:'Kuala Lumpur',start:'2027-01-30',days:3,people:1,budget:4000000,interests:'cari hotel dibawah 500000 permalam',hotelBudget:{maxNightIDR:9000000}});
 assert.equal(input.hotelBudget.maxNightIDR,500000);
 const target=priceTargets([{id:'a',title:'Area',category:'Penginapan',day:1,searchAny:true,maxNightIDR:500000,maxNightExclusive:true}],3)[0];
 assert.equal(target.maxNightIDR,500000);assert.equal(target.searchAny,true);assert.equal(target.maxNightExclusive,true);
});
test('admission and map coordinates require identity, exact research evidence and cited sources',()=>{
 const sourceUrl='https://museum.example/admission';const sources=[{url:sourceUrl}];
 const quote='Example Museum foreign adult admission MYR 20; location latitude 3.14 longitude 101.7.';
 const activity={title:'Example Museum',admission:{amount:20,currency:'MYR',audience:'Foreign adult',quote,sourceUrl},coordinates:{lat:3.14,lng:101.7,quote,sourceUrl}};
 const facts=attractionReferences(activity,sources,quote);
 assert.equal(facts.admission.amount,20);assert.deepEqual(facts.geo,{lat:3.14,lng:101.7});
 assert.deepEqual(attractionReferences(activity,sources,''),{});
 assert.deepEqual(attractionReferences({...activity,title:'Another Museum'},sources,quote),{});
 assert.deepEqual(attractionReferences({...activity,admission:{...activity.admission,amount:200},coordinates:{...activity.coordinates,lat:9}},sources,quote),{});
 assert.deepEqual(attractionReferences(activity,[],quote),{});
});
const code=ts.transpileModule(await readFile(new URL('../app/itinerary-connections.ts',import.meta.url),'utf8'),{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ES2022}}).outputText.replace(/^import[^\n]+;\n/gm,'');
const {itineraryConnections}=await import('data:text/javascript;base64,'+Buffer.from("const addDays=(d,n)=>new Date(Date.parse(d+'T12:00:00Z')+n*86400000).toISOString().slice(0,10);const cityById=()=>undefined,cityAt=()=>undefined;"+code).toString('base64'));
test('all consecutive visits and hotel return have map directions even without any coordinates',()=>{
 const hotel={id:'hotel',title:'Economy hotel',category:'Penginapan',day:1,checkin:'2027-01-30',checkout:'2027-02-01'};
 const trip={start:'2027-01-30',days:3,destination:'kl',destinationMeta:{city:'Kuala Lumpur'},items:[hotel,{id:'museum1',title:'Museum A',category:'Wisata',day:2,time:'10:00'},{id:'museum2',title:'Museum B',category:'Wisata',day:2,time:'14:00'}]};
 const links=itineraryConnections(trip,2);assert.equal(links.length,3);
 assert.equal(links[0].from,'Economy hotel, Kuala Lumpur');assert.equal(links[0].to,'Museum A, Kuala Lumpur');
 assert.equal(links[1].from,links[0].to);assert.equal(links[2].to,links[0].from);assert.equal(links[2].returnToStay,true);
 assert.equal(itineraryConnections({...trip,items:[hotel]},1).length,0);
 const excursion=itineraryConnections({...trip,items:[hotel,{...trip.items[1],place:'Awana SkyWay, Genting Highlands'}]},2);
 assert.equal(excursion[0].to,'Awana SkyWay, Genting Highlands');
});
