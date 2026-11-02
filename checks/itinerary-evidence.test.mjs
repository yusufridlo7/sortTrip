import {test} from 'node:test';
import assert from 'node:assert/strict';
import {relevantSource,attractionSource,checkRouteSources,validateTransitAnchors,normalizeStationConnections,usableActivitySource,connectionGaps} from '../worker/itinerary-evidence.mjs';
const sources=[{url:'https://travelodge.test/hotel/kuala-lumpur',title:'Travelodge City Centre'},{url:'https://tourism.test/pasar-seni',title:'Central Market / Pasar Seni'},{url:'https://museum.test/ticket',title:'National Museum admission'},{url:'https://guide.test/train-stations',title:'Kuala Lumpur train stations'}];
test('source membership or shared city alone cannot ground an attraction',()=>{
 for(const source of [sources[0],sources[3]])assert.equal(relevantSource({title:'Pasar Seni',city:'Kuala Lumpur',location:'Pasar Seni',sourceUrl:source.url},sources),false);
 assert.equal(relevantSource({title:'Dataran Merdeka',sourceUrl:sources[3].url},sources),false);
});
test('specific title/path and local place name can establish page relevance, not fee accuracy',()=>{
 assert.equal(relevantSource({title:'Pasar Seni',sourceUrl:sources[1].url},sources),true);
 assert.equal(relevantSource({title:'Muzium Negara',location:'National Museum',sourceUrl:sources[2].url},sources),true);
 assert.equal(relevantSource({title:'Museum',sourceUrl:'javascript:alert(1)'},sources),false);
 assert.equal(relevantSource({title:'Pasar',sourceUrl:'https://missing.test/'},sources),false);
});
test('legacy AI citations are reassessed as information links against current page metadata, never used to create prices',()=>{
 const item={aiGenerated:true,title:'Pasar Seni',sourceUrl:sources[0].url};
 assert.equal(usableActivitySource(item,[sources[0]]),null);
 assert.equal(usableActivitySource(item,sources),sources[1].url);
 assert.equal(usableActivitySource({...item,sourceUrl:sources[1].url},sources),sources[1].url);
 assert.equal(usableActivitySource({...item,sourceUrl:sources[1].url,sourceRelevant:false},sources),sources[1].url);
 assert.equal(item.admission,undefined);
});
test('dual-language museum names match the museum domain, not a similarly named station',()=>{
 const museum={url:'https://www.muziumnegara.gov.my/en/faq',title:'Frequently asked questions'};
 assert.equal(relevantSource({title:'Muzium Negara / National Museum',sourceUrl:museum.url},[museum]),true);
 assert.equal(relevantSource({title:'Muzium Negara / National Museum',sourceUrl:sources[3].url},sources),false);
});
test('a station sharing a museum name is not the museum; a replacement reference never creates an admission tariff',()=>{
 const station={url:'https://transit.test/muzium-negara',title:'Muzium Negara MRT Station'};
 assert.equal(relevantSource({title:'Muzium Negara',sourceUrl:station.url},[station]),false);
 const result=attractionSource({title:'Pasar Seni',sourceUrl:sources[0].url,note:'Unverified hours'},sources,'en');
 assert.equal(result.sourceUrl,sources[1].url);assert.equal(result.admission,undefined);assert.match(result.note,/verify factual details/);
});
const q={city:'Kuala Lumpur',start:'2026-11-07',days:4,retained:[{category:'Penginapan',title:'Travelodge',day:2,time:'00:00',checkin:'2026-11-07',checkout:'2026-11-10'}]};
const visit=(title,time,day=2)=>({category:'Wisata',title,location:title,day,time});
const transfer=(fromPlace,toPlace,time,day=2)=>({category:'Transfer',day,time,fromPlace,toPlace,routeOptions:[{legs:[{fromPlace,toPlace,mode:'Walking',sourceUrl:sources[1].url}]}]});
const visits=[visit('KLCC Park','09:00'),visit('Pasar Seni','11:30')];
const complete=[transfer('Travelodge','KLCC Park','08:30'),...visits,transfer('KLCC Park','Pasar Seni','11:00'),transfer('Pasar Seni','Travelodge','16:00')];
test('detects outbound, consecutive-visit and return-to-hotel gaps separately',()=>{
 assert.deepEqual(connectionGaps(visits,q),[{day:2,from:'Travelodge',to:'KLCC Park'},{day:2,from:'KLCC Park',to:'Pasar Seni'},{day:2,from:'Pasar Seni',to:'Travelodge'}]);
 assert.deepEqual(connectionGaps(complete,q),[]);
 assert.deepEqual(connectionGaps(complete.filter(x=>x.fromPlace!=='Pasar Seni'),q),[{day:2,from:'Pasar Seni',to:'Travelodge'}]);
});
test('cannot join a route that is late, reversed, on another day or ends at another station',()=>{
 for(const bad of [transfer('KLCC Park','Pasar Seni','12:00'),transfer('Pasar Seni','KLCC Park','11:00'),transfer('KLCC Park','Pasar Seni','11:00',3),transfer('KLCC Park','Other station','11:00')]){
  assert.ok(connectionGaps([complete[0],...visits,bad,complete.at(-1)],q).some(g=>g.from==='KLCC Park'&&g.to==='Pasar Seni'));
 }
});
test('a chain of explicit last-mile transfers can close a gap; a station gap cannot',()=>{
 const chain=[complete[0],...visits,transfer('KLCC Park','Station A','10:00'),transfer('Station A','Station B','10:30'),transfer('Station B','Pasar Seni','11:00'),complete.at(-1)];
 assert.deepEqual(connectionGaps(chain,q),[]);
 assert.ok(connectionGaps(chain.filter(x=>x.fromPlace!=='Station B'),q).some(g=>g.to==='Pasar Seni'));
});
test('arrival after midnight and departure day require airport connections without inventing a service',()=>{
 const context={...q,airport:'KUL',arrival:'23:55',arrivalDay:0};
 assert.ok(connectionGaps(complete,context).some(g=>g.from==='KUL'&&g.to==='Travelodge'));
 assert.ok(connectionGaps(complete,context).some(g=>g.day===4&&g.to==='KUL'));
 const all=[transfer('KUL','Travelodge','02:00'),...complete,transfer('Travelodge','KUL','12:00',4)];
 assert.deepEqual(connectionGaps(all,context),[]);
 assert.ok(!connectionGaps(complete,{...context,oneWay:true}).some(g=>g.day===4));
});
test('same place needs no invented connector and does not imply a sourced travel duration',()=>{
 assert.deepEqual(connectionGaps([visit('Travelodge','09:00')],q),[]);
 assert.equal(complete[0].routeOptions[0].legs[0].duration,undefined);
});
test('ambiguous rail services, a hotel used as a rail platform, and placeholder city stations are rejected',()=>{
 const station='Pasar Seni Station';
 for(const legs of [
  [{fromPlace:'Travelodge',toPlace:station,mode:'MRT'}],
  [{fromPlace:station,toPlace:'Central Market',mode:'LRT/MRT'}],
  [{fromPlace:'KUL Station',toPlace:'Stasiun City Centre Kuala Lumpur',mode:'kereta bandara'}]
 ])assert.throws(()=>validateTransitAnchors([{category:'Transfer',routeOptions:[{legs}]}],q),/tidak dapat diverifikasi/);
 const valid={category:'Transfer',routeOptions:[{legs:[{fromPlace:'Travelodge',toPlace:station,mode:'Walking'},{fromPlace:station,toPlace:'Muzium Negara Station',mode:'MRT Kajang Line'},{fromPlace:'Muzium Negara Station',toPlace:'National Museum',mode:'Walking'}]}]};
 assert.doesNotThrow(()=>validateTransitAnchors([valid],q));
});
test('a textual rail edge from a hotel cannot close the itinerary connection gap',()=>{
 const invalid={...transfer('Travelodge','KLCC Park','08:30'),routeOptions:[{legs:[{fromPlace:'Travelodge',toPlace:'KLCC Park',mode:'MRT'}]}]};
 assert.ok(connectionGaps([invalid,...visits,...complete.slice(3)],q).some(g=>g.from==='Travelodge'));
});
test('station and museum with the same name stay distinct; redundant same-hotel walking does not create a fake leg',()=>{
 const routes={routeOptions:[{legs:[{fromPlace:'Hotel',toPlace:'Pasar Seni',mode:'Walking'},{fromPlace:'Pasar Seni',toPlace:'Muzium Negara',mode:'kereta KGL'},{fromPlace:'Muzium Negara',toPlace:'Muzium Negara',mode:'Walking'}]}]};
 const result=normalizeStationConnections(routes);
 assert.deepEqual(result.routeOptions[0].legs.map(l=>[l.fromPlace,l.toPlace]),[['Hotel','Stasiun Pasar Seni'],['Stasiun Pasar Seni','Stasiun Muzium Negara'],['Stasiun Muzium Negara','Muzium Negara']]);
 assert.equal(routes.routeOptions[0].legs[0].toPlace,'Pasar Seni');
 const taxi=normalizeStationConnections({routeOptions:[{legs:[{fromPlace:'KUL',toPlace:'Hotel',mode:'Taxi'},{fromPlace:'Hotel',toPlace:'Hotel',mode:'Walking'}]}]});
 assert.equal(taxi.routeOptions[0].legs.length,1);
});
test('transport price/duration need both a related page and a literal research quote; unrelated source cannot assert fares',()=>{
 const source={url:'https://rail.test/klcc',title:'KLCC station access'};
 const routes={routeOptions:[{legs:[{fromPlace:'KLCC',toPlace:'Pasar Seni',mode:'LRT',sourceUrl:source.url,fare:'MYR 2.00',duration:'15 minutes',checkedAt:'2026-11-02'}]}],selectedRoute:0};
 const kept=checkRouteSources(routes,[source],'MYR 2.00; 15 minutes').routeOptions[0].legs[0];assert.equal(kept.fare,'MYR 2.00');
 const missing=checkRouteSources(routes,[source],'Unavailable').routeOptions[0].legs[0];assert.equal(missing.fare,undefined);assert.equal(missing.duration,undefined);
 const unrelated=checkRouteSources(routes,[{...source,title:'Hotel room offers',url:source.url.replace('klcc','rooms')}],'MYR 2.00; 15 minutes').routeOptions[0].legs[0];assert.equal(unrelated.sourceRelevant,false);assert.equal(unrelated.fare,undefined);
 assert.equal(routes.routeOptions[0].legs[0].fare,'MYR 2.00');
});
