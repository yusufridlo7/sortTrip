import {test} from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,readFile,writeFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {pathToFileURL} from 'node:url';
import ts from 'typescript';
import {resolveI18n} from './i18n-loader.mjs';
const tmp=await mkdtemp(join(tmpdir(),'sorttrip-test-'));
let api,travel,saveState,network,replacement,prices,stay;
try{
 for(const name of ['travel-data','api-flights','trip-save','bounded-fetch','replace-flight','apply-price-quotes','hotel-stay']){const src=await readFile(new URL('../app/'+name+'.ts',import.meta.url),'utf8');const js=resolveI18n(ts.transpileModule(src,{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ES2022}}).outputText.replace("'./travel-data'","'./travel-data.mjs'"));await writeFile(join(tmp,name+'.mjs'),js);}
 stay=await import(pathToFileURL(join(tmp,'hotel-stay.mjs')));
 prices=await import(pathToFileURL(join(tmp,'apply-price-quotes.mjs')));
 replacement=await import(pathToFileURL(join(tmp,'replace-flight.mjs')));
 api=await import(pathToFileURL(join(tmp,'api-flights.mjs')));travel=await import(pathToFileURL(join(tmp,'travel-data.mjs')));saveState=await import(pathToFileURL(join(tmp,'trip-save.mjs')));network=await import(pathToFileURL(join(tmp,'bounded-fetch.mjs')));
}finally{await rm(tmp,{recursive:true,force:true});}
const q={origin:'CGK',destination:'kl',journey:'return',minDays:3,maxDays:5,people:2,budget:5000000};
test('assistant hash navigation keeps itinerary while valid browser back still changes view',()=>{
 for(const state of [null,{}, {sorttripView:'invalid'}])assert.equal(saveState.historyTripView('planner',state),'planner');
 assert.equal(saveState.historyTripView('planner',{sorttripView:'explore'}),'explore');
 assert.equal(saveState.historyTripView('planner',{sorttripView:'explore'},true),'planner');
});
test('hotel amount duration follows the individual stay, not the whole itinerary',()=>{
 const trip={start:'2027-01-30',days:3};const hotel={category:'Penginapan',day:1,checkin:'2027-01-30',checkout:'2027-02-01'};
 assert.equal(stay.hotelStay(hotel,trip).nights,2);
 assert.match(stay.hotelStay(hotel,trip).label,/Total 2 malam/);
 const night=stay.hotelStay({...hotel,day:2,checkin:undefined,checkout:undefined},trip);
 assert.equal(night.nights,1);assert.equal(night.checkin,'2027-01-31');assert.equal(night.checkout,'2027-02-01');
 assert.equal(stay.hotelStay({...hotel,checkout:hotel.checkin},trip),null);
 assert.equal(stay.hotelStay({...hotel,category:'Pesawat'},trip),null);
});
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
test('reload restores itinerary rather than flight search only for a valid stored draft',()=>{
 const draft=JSON.stringify(api.apiTrip(f,q));assert.equal(saveState.restoredTripView('planner',draft),'planner');
 for(const raw of [null,'invalid','{}','{"items":[]}'])assert.equal(saveState.restoredTripView('planner',raw),'explore');
 assert.equal(saveState.restoredTripView(null,draft),'explore');assert.equal(saveState.restoredTripView('flights',draft),'explore');
});

test('price refresh waits behind older save and opening saved trips reads the latest persisted amount',async()=>{
 const queue=saveState.createSaveQueue();let release,stored,started=false;
 const slow=new Promise(resolve=>{release=resolve});
 const old={items:[{id:'hotel',price:100}]},updated={items:[{id:'hotel',price:250,priceQuote:{checkedAt:'2026-10-11'}}]};
 const first=queue.run(async()=>{started=true;await slow;stored=old;});
 const second=queue.run(async()=>{assert.equal(stored,old);stored=updated;});
 let opened=false;const read=queue.idle().then(()=>{opened=true;return JSON.parse(JSON.stringify(stored));});
 await Promise.resolve();assert.equal(started,true);assert.equal(opened,false);release();
 await Promise.all([first,second]);const reloaded=await read;
 assert.equal(reloaded.items[0].price,250);assert.equal(reloaded.items[0].priceQuote.checkedAt,'2026-10-11');
});

test('a failed save does not discard a queued result; assigning an insert ID is not an unsaved price edit',async()=>{
 const queue=saveState.createSaveQueue();const failure=queue.run(async()=>{throw Error('offline')});
 const latest=queue.run(async()=>123);await assert.rejects(failure);assert.equal(await latest,123);await queue.idle();
 const snapshot=api.apiTrip(f,q);assert.equal(saveState.reconcileSavedTrip({...snapshot,id:'new-id'},snapshot,'new-id',true).dirty,false);
 const changed={...snapshot,id:'new-id',items:snapshot.items.map(x=>({...x,price:x.price+1}))};assert.equal(saveState.reconcileSavedTrip(changed,snapshot,'new-id',true).dirty,true);
});

test('bounded fetch preserves cancellation for Request and init signals',async()=>{
 const original=globalThis.fetch;let observed;globalThis.fetch=async(_input,init)=>{observed=init.signal;return Response.json({ok:true});};
 try{for(const asRequest of [false,true]){const c=new AbortController();await network.boundedFetch(asRequest?new Request('https://example.test',{signal:c.signal}):'https://example.test',asRequest?{}:{signal:c.signal});assert.equal(observed.aborted,false);c.abort();assert.equal(observed.aborted,true);}}finally{globalThis.fetch=original;}
});

test('flight replacement retains account identity and preferences but rebuilds dated itinerary and offer',()=>{
 const old=travel.makeTrip(travel.destinations[2],'CGK','2026-11-10',3,2,5500000);old.id='saved-trip';old.aiPrompt='hemat dan alam';old.aiPlan={summary:'old'};old.aiConversation=[{role:'assistant',text:'old'}];old.items.push({id:'old-bus',category:'Transportasi',title:'old transfer',day:2,price:99,paid:false,time:'10:00',note:'old'});
 const before=JSON.stringify(old),selected=api.apiTrip(f,q),next=replacement.replaceFlight(old,selected);
 assert.equal(JSON.stringify(old),before);assert.equal(next.id,old.id);assert.equal(next.start,f.start);assert.equal(next.days,4);assert.equal(next.budget,old.budget);assert.equal(next.aiPrompt,old.aiPrompt);assert.equal(next.aiPlan,undefined);assert.equal(next.aiConversation,undefined);assert.ok(!next.items.some(x=>x.id==='old-bus'));assert.equal(next.items.find(x=>x.id==='flight').bookingUrl,f.bookingUrl);assert.equal(next.items.find(x=>x.id==='flight').price,f.price);assert.equal(next.items.find(x=>x.id==='hotel').checkin,f.start);assert.equal(next.items.find(x=>x.id==='hotel').checkout,f.end);
});
test('replacement blocks paid reservations, simulations and mismatched passenger counts without mutation',()=>{
 const old=travel.makeTrip(travel.destinations[2],'CGK','2026-11-10',3,2,5500000),selected=api.apiTrip(f,q);
 old.items[1].paid=true;const before=JSON.stringify(old);assert.throws(()=>replacement.replaceFlight(old,selected),/dibayar/);assert.equal(JSON.stringify(old),before);
 old.items[1].paid=false;assert.throws(()=>replacement.replaceFlight(old,old),/hasil pencarian/);assert.throws(()=>replacement.replaceFlight(old,{...selected,people:1}),/pelancong/);
});
test('replacement arrival and return windows follow new ticket, never old AI routes',()=>{
 const old=travel.makeTrip(travel.destinations[0],'CGK','2026-11-10',3,2,5500000);old.dayPlans={'1':{cities:['sin'],modes:['bus'],start:'09:00'}};
 const selected=api.apiTrip({...f,departureAt:'2027-01-10T23:00:00+07:00',durationTo:180,destinationZone:'Asia/Kuala_Lumpur',returnAt:'2027-01-13T06:00:00+08:00'},q),next=replacement.replaceFlight(old,selected);
 assert.equal(next.dayPlans,undefined);assert.equal(next.flight.arrivalDay,1);assert.ok(!next.items.some(x=>x.category==='Wisata'&&(x.day===1||x.day===next.days)));
});

test('price refresh protects paid and flight fares, handles room nights/group costs, persists sources',()=>{
 const trip=api.apiTrip(f,q),hotel=trip.items.find(x=>x.category==='Penginapan'),paid={...trip.items.find(x=>x.category==='Transportasi'),id:'paid',paid:true};trip.items.push(paid);
 const quote={id:hotel.id,amountIDR:500000,basis:'room_night',sourceUrl:'https://www.tiket.com/hotel/example',quote:'Example Rp 500.000 per room night',checkedAt:'2026-10-11T00:00:00Z',scope:'reference',provider:'tiket.com'};
 const before=JSON.stringify(trip),next=prices.applyPriceQuotes(trip,[quote,{...quote,id:'paid',basis:'person'},{...quote,id:'flight',basis:'person'}]);assert.equal(JSON.stringify(trip),before);assert.equal(next.items.find(x=>x.id===hotel.id).price,1500000);assert.equal(next.items.find(x=>x.id===hotel.id).shared,true);assert.equal(next.items.find(x=>x.id==='paid'),paid);assert.equal(next.items.find(x=>x.id==='flight').price,f.price);assert.equal(JSON.parse(JSON.stringify(next)).items.find(x=>x.id===hotel.id).priceQuote.sourceUrl,quote.sourceUrl);
});

test('connecting-route quotes price each leg and leave subtotal incomplete when another fare is unknown',()=>{
 const trip=api.apiTrip(f,q);trip.items=[{id:'transit',title:'Connecting journey',category:'Transportasi',day:2,time:'10:00',price:0,priceUnknown:true,paid:false,note:'',routeOptions:[{kind:'hemat',summary:'Transfer',legs:[{mode:'MRT',fromPlace:'Singapore',toPlace:'Johor Bahru',sourceUrl:'https://operator.test'},{mode:'Bus',fromPlace:'Johor Bahru',toPlace:'Melaka',sourceUrl:'https://12go.asia'}]}]}];
 const targets=prices.buildPriceTargets(trip,'Singapore');assert.equal(targets.length,1);assert.equal(targets[0].id,'transit::1');assert.equal(targets[0].from,'Johor Bahru');
 const quote={id:'transit::1',amountIDR:125000,basis:'person',sourceUrl:'https://12go.asia',quote:'Johor Bahru to Melaka Rp 125000 per ticket',checkedAt:'2026-10-11T00:00:00Z',scope:'reference',provider:'12go.asia'};
 const next=prices.applyPriceQuotes(trip,[quote]);assert.equal(next.items[0].price,125000);assert.equal(next.items[0].priceUnknown,true);assert.equal(next.items[0].routePriceQuotes.length,1);
 trip.items[0].routeOptions[0].legs[0].mode='walking';assert.equal(prices.applyPriceQuotes(trip,[quote]).items[0].priceUnknown,false);
 trip.items[0].paid=true;assert.equal(prices.applyPriceQuotes(trip,[quote]).items[0],trip.items[0]);
});
