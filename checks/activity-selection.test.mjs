import {test} from 'node:test';
import assert from 'node:assert/strict';
import ts from 'typescript';
import {readFile} from 'node:fs/promises';
const source=await readFile(new URL('../app/activity-selection.ts',import.meta.url),'utf8');
const code=ts.transpileModule(source,{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ES2022}}).outputText;
const {applyActivityOffer,activityContextKey,safeActivityOffer}=await import('data:text/javascript;base64,'+Buffer.from(code).toString('base64'));
const item={id:'visit',title:'Petronas Twin Towers',place:'Petronas Twin Towers',day:2,time:'10:00',category:'Wisata',price:250000,paid:false,note:'Keep this note',geo:{lat:3.1579,lng:101.7123}};
const trip={id:'trip',destination:'kl',start:'2027-01-30',people:2,days:3,budget:4500000,items:[item,{id:'other',price:50000}]};
const offer={productCode:'TEST1',title:'Petronas ticket',description:'Example ticket',currency:'IDR',fromPrice:300000,bookingUrl:'https://www.viator.com/tours/Kuala-Lumpur/Ticket/d335-TEST1?pid=example',checkedAt:'2026-10-22T00:00:00Z'};
test('link preserves existing budget, itinerary identity, route, notes and purchase state by default',()=>{
 const next=applyActivityOffer(trip,'visit',offer,activityContextKey(trip,item));
 assert.equal(next.items[0].price,250000);assert.equal(next.items[0].title,item.title);assert.equal(next.items[0].geo,item.geo);assert.equal(next.items[0].note,item.note);assert.equal(next.items[0].paid,false);assert.equal(next.items[1],trip.items[1]);assert.equal(next.budget,trip.budget);assert.equal(trip.items[0].activityOffer,undefined);
 assert.deepEqual(JSON.parse(JSON.stringify(next)).items[0].activityOffer,next.items[0].activityOffer);
});
test('explicit estimate updates only selected ticket per-person cost; original item untouched',()=>{
 const next=applyActivityOffer(trip,'visit',offer,activityContextKey(trip,item),true);
 assert.equal(next.items[0].price,300000);assert.equal(next.items[0].shared,false);assert.equal(next.items[0].priceUnknown,false);assert.equal(next.items[0].activityOffer.usedForEstimate,true);assert.equal(item.price,250000);
 const rounded=applyActivityOffer(trip,'visit',{...offer,fromPrice:72574.87},activityContextKey(trip,item),true);
 assert.equal(rounded.items[0].price,72575);assert.equal(rounded.items[0].activityOffer.fromPrice,72574.87);
});
test('paid, changed, removed, wrong-category and unsafe selections are rejected',()=>{
 const context=activityContextKey(trip,item);
 for(const changed of [{...item,paid:true},{...item,title:'Other place'},{...item,day:3},{...item,category:'Penginapan'}])assert.throws(()=>applyActivityOffer({...trip,items:[changed]},'visit',offer,context));
 assert.throws(()=>applyActivityOffer({...trip,items:[]},'visit',offer,context));
 for(const bookingUrl of ['https://evil.test/tours/x','javascript:alert(1)','https://www.viator.com@evil.test/tours/x'])assert.equal(safeActivityOffer({...offer,bookingUrl}),false);
 assert.equal(safeActivityOffer({...offer,currency:'USD'}),false);
 assert.throws(()=>applyActivityOffer(trip,'visit',{...offer,fromPrice:NaN},context));
});
