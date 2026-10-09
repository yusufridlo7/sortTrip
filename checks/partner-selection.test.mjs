import {test} from 'node:test';
import assert from 'node:assert/strict';
import ts from 'typescript';
import {readFile} from 'node:fs/promises';
const source=await readFile(new URL('../app/partner-selection.ts',import.meta.url),'utf8');
const compile=s=>ts.transpileModule(s,{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ES2022}}).outputText;
const dataUrl='data:text/javascript;base64,'+Buffer.from(compile(await readFile(new URL('../app/travel-data.ts',import.meta.url),'utf8'))).toString('base64');
const compiled=compile(source).replace("'./travel-data'",JSON.stringify(dataUrl)).replace("'./transport-affiliate.mjs'",JSON.stringify(new URL('../app/transport-affiliate.mjs',import.meta.url).href));
const {manualPartnerItem,applyPartnerSelection,tripHotelAffiliate,tripHotelWidget,hotelAffiliateLink}=await import('data:text/javascript;base64,'+Buffer.from(compiled).toString('base64'));
const trip={start:'2027-01-01',days:4,people:2,items:[{id:'paid',paid:true}]};
const input={name:'Selected service',date:'2027-01-02',checkOut:'2027-01-03',from:'Kuala Lumpur',to:'Melaka',price:''};
test('manual transport carries trip day, route and affiliate without inventing price or paid status',()=>{
 const item=manualPartnerItem(trip,'transport',input,'new');assert.equal(item.day,2);assert.equal(item.priceUnknown,true);assert.equal(item.paid,false);assert.equal(item.userEdited,true);assert.equal(new URL(item.bookingUrl).searchParams.get('z'),'17068680');assert.equal(new URL(item.bookingUrl).searchParams.get('date'),input.date);assert.equal(trip.items.length,1);
});
test('manual hotel preserves immutable generated affiliate URL and correct stay dates',()=>{
 const item=manualPartnerItem(trip,'hotels',{...input,price:'250000'},'new');assert.equal(item.bookingUrl,tripHotelAffiliate);assert.equal(item.checkin,input.date);assert.equal(item.checkout,input.checkOut);assert.equal(item.price,250000);assert.equal(item.priceUnknown,false);assert.equal(new URL(tripHotelWidget).searchParams.get('Allianceid'),'10936143');
});
test('invalid date, outside trip, negative price, identical transport endpoints or checkout outside trip rejected',()=>{
 for(const changes of [{date:'2027-02-01'},{date:'2027-01-00'},{price:'-1'},{price:'NaN'},{to:'Kuala Lumpur'}])assert.throws(()=>manualPartnerItem(trip,'transport',{...input,...changes},'new'));
 for(const checkOut of ['2027-01-02','2027-01-05'])assert.throws(()=>manualPartnerItem(trip,'hotels',{...input,checkOut},'new'));
});

test('explicit replacement preserves paid records and refuses partial hotel range replacement',()=>{const old={id:'old',category:'Penginapan',day:2,paid:false,checkin:input.date,checkout:input.checkOut};const t={...trip,items:[...trip.items,old]};const item=manualPartnerItem(t,'hotels',input,'new');const result=applyPartnerSelection(t,item,'old');assert.equal(result.items.length,2);assert.deepEqual(result.items[0],trip.items[0]);assert.equal(result.items[1].id,'new');assert.throws(()=>applyPartnerSelection({...t,items:[{...old,paid:true}]},item,'old'));assert.throws(()=>applyPartnerSelection(t,{...item,checkout:'2027-01-04'},'old'));});

test('only verified hotel resolves to exact generated affiliate link, others use working hotel landing',()=>{const result=hotelAffiliateLink({title:'CUBE Boutique Capsule Hotel at Kampong Glam'});assert.equal(result.specific,true);assert.match(result.url,/hotel-detail-1729952/);assert.equal(new URL(result.url).searchParams.get('SID'),'332965312');for(const title of ['Different hotel','CUBE Boutique Capsule Hotel at Chinatown','CUBE Boutique Capsule Hotel']){const other=hotelAffiliateLink({title});assert.equal(other.specific,false);assert.equal(other.url,tripHotelAffiliate);}assert.equal(new URL(tripHotelAffiliate).hostname,'www.trip.com');});
