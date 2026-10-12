import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import ts from 'typescript';
import {resolveI18n} from './i18n-loader.mjs';
import {hotelPropertyUrl,datedHotelUrl,checkedHotelQuote,browserHotelPrices,navigationKind} from '../worker/trip-hotel-browser.js';
import {resolveHotelPages} from '../worker/price-research.js';
const sourceUrl='https://www.trip.com/hotels/singapore-hotel-detail-1729952/cube-boutique-capsule-hotel-kampong-glam/';
const target={id:'hotel',category:'Penginapan',title:'CUBE Boutique Capsule Hotel at Kampong Glam',sourceUrl,checkin:'2027-02-04',checkout:'2027-02-05',rooms:1};
const offer={roomType:'Bed In Mixed Single Capsule',text:"Today's lowest price\nNon-refundable\nPrepay online\n1 adult\nIDR 538,076\nTotal (incl. taxes & fees): IDR 645,152\nOur last 3!\nReserve"};
const observation={url:datedHotelUrl(target,1),hotel:'Cube Boutique Capsule Hotel @ Kampong Glam',nights:1,guests:'1 room, 1 adult, 0 children',offers:[offer]};
test('navigation diagnostics expose only fixed categories, never opaque URL parts',()=>{
 assert.equal(navigationKind('https://www.trip.com/hotels/detail/?token=private'),'HOTEL_DETAIL');
 assert.equal(navigationKind('https://www.trip.com/w/opaque-value/?private=value'),'W_GATE');
 assert.equal(navigationKind('https://www.trip.com/security/opaque-value'),'ACCESS_CHECK');
 assert.equal(navigationKind('https://www.trip.com/opaque-value'),'OTHER_PATH');
});
test('public observed dated hotel total includes taxes, preserves exact evidence and room terms',()=>{
 const q=checkedHotelQuote(target,1,observation);assert.equal(q.amountIDR,645152);assert.equal(q.basis,'stay_total');assert.equal(q.scope,'dated');assert.equal(q.taxesIncluded,true);assert.equal(q.policy,'Non-refundable');assert.equal(q.roomType,offer.roomType);assert.ok(q.checkedAt);
 assert.equal(checkedHotelQuote(target,1,{...observation,offers:[{...offer,text:offer.text.replace('645,152','645152')}]}).amountIDR,645152);
});
test('multi-night rendered total includes room/night context and capacity may exceed selected guest count',()=>{
 const t={...target,checkout:'2027-02-06'},o={...observation,url:datedHotelUrl(t,1),nights:2,offers:[{roomType:'Superior Twin Room',text:'Non-refundable\n2 adults\nIDR 583,284\nTotal price: IDR 1,347,511\n1 room × 2 nights incl. taxes & fees\nReserve'}]};
 assert.equal(checkedHotelQuote(t,1,o).amountIDR,1347511);assert.equal(checkedHotelQuote(t,1,{...o,offers:[{...o.offers[0],text:o.offers[0].text.replace('× 2 nights','× 3 nights')}]}),null);

});
test('rejects mismatched hotel, guest, nights, URL dates and missing inclusive total',()=>{
 for(const change of [{hotel:'CUBE Boutique Capsule Hotel @ Chinatown'},{guests:'1 room, 2 adults, 0 children'},{nights:2},{url:observation.url.replace('2027-02-05','2027-02-06')},{offers:[{...offer,text:'Non-refundable\n1 adult\nIDR 538,076'}]},{offers:[{...offer,text:offer.text.replace('IDR 645,152','USD 645,152')}]},{offers:[{...offer,text:offer.text+'\nFirst booking deal'}]},{offers:{}}])assert.equal(checkedHotelQuote(target,1,{...observation,...change}),null);
});
test('property guard rejects arbitrary origins, account pages, credentials and invalid dates or room scope',()=>{
 for(const url of ['https://www.trip.com.evil.test'+new URL(sourceUrl).pathname,'http://www.trip.com'+new URL(sourceUrl).pathname,'https://user:pass@www.trip.com'+new URL(sourceUrl).pathname,'https://www.trip.com/account','https://127.0.0.1/hotels/test'])assert.equal(hotelPropertyUrl(url),null);
 for(const change of [{checkin:'2027-02-30'},{checkout:'2027-02-04'},{rooms:2}])assert.equal(datedHotelUrl({...target,...change},1),null);
 assert.equal(datedHotelUrl(target,3),null);
});
test('disabled or unbound cloud browser cannot invent a quote',async()=>{assert.deepEqual(await browserHotelPrices({people:1},[target],{}),[]);assert.deepEqual(await browserHotelPrices({people:1},[target],{HOTEL_BROWSER_ENABLED:'true'}),[]);});
test('property resolution accepts only returned public source URLs and rejects model-only fabricated URLs',async()=>{
 for(const supported of [true,false]){
  const call=async()=>Response.json({status:'completed',output:[{action:{sources:supported?[{url:sourceUrl}]:[]},content:[{type:'output_text',text:JSON.stringify({hotels:[{id:target.id,url:sourceUrl}]})}]}]});
  const resolved=await resolveHotelPages([{...target,sourceUrl:null}],{},call);assert.equal(resolved[0].sourceUrl,supported?sourceUrl:null);
 }
});
const compile=s=>resolveI18n(ts.transpileModule(s,{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ES2022}}).outputText);
const dataUrl='data:text/javascript;base64,'+Buffer.from(compile(await readFile(new URL('../app/travel-data.ts',import.meta.url),'utf8'))).toString('base64');
const compiled=compile(await readFile(new URL('../app/apply-price-quotes.ts',import.meta.url),'utf8')).replace("'./travel-data'",JSON.stringify(dataUrl));
const {applyPriceQuotes}=await import('data:text/javascript;base64,'+Buffer.from(compiled).toString('base64'));
test('dated stay total is inserted once, retains metadata in trip JSON, preserves paid or mismatched stay',()=>{
 const q=checkedHotelQuote(target,1,observation),item={...target,day:1,paid:false,price:0,priceUnknown:true},trip={start:target.checkin,people:1,items:[item]};
 const changed=applyPriceQuotes(trip,[q]);assert.equal(changed.items[0].price,645152);assert.equal(changed.items[0].shared,true);assert.equal(changed.items[0].priceUnknown,false);assert.deepEqual(JSON.parse(JSON.stringify(changed)).items[0].priceQuote,q);
 for(const quote of [{...q,checkout:'2027-02-06'},{...q,adults:2},{...q,taxesIncluded:false},{...q,rooms:2}])assert.deepEqual(applyPriceQuotes(trip,[quote]).items[0],item);
 const paid={...item,paid:true,price:123};assert.deepEqual(applyPriceQuotes({...trip,items:[paid]},[q]).items[0],paid);
});

test('multi-night stay total is not multiplied by nights a second time',()=>{const t={...target,checkout:'2027-02-06'},q={...checkedHotelQuote(target,1,observation),checkout:t.checkout,amountIDR:1347511},trip={start:t.checkin,people:1,items:[{...t,day:1,paid:false,price:0,priceUnknown:true}]};assert.equal(applyPriceQuotes(trip,[q]).items[0].price,1347511);});
