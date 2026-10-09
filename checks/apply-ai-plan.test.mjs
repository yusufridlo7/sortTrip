import {test} from 'node:test';
import assert from 'node:assert/strict';
import ts from 'typescript';
import {readFile} from 'node:fs/promises';
const source=await readFile(new URL('../app/apply-ai-plan.ts',import.meta.url),'utf8');
const js=ts.transpileModule(source,{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ES2022}}).outputText.replace(/^import[^\n]+;\n/,"const destinations=[];const geoData={};const addDays=(s,n)=>new Date(Date.parse(s+'T12:00:00Z')+n*86400000).toISOString().slice(0,10);\n");
const {applyAIPlan,aiTripContext}=await import('data:text/javascript;base64,'+Buffer.from(js).toString('base64'));
const sourceUrl='https://example.com/attraction';
const context={city:'Kuala Lumpur',start:'2026-12-10',days:3,people:1,budget:4500000};
const flight={id:'flight',category:'Pesawat',price:1000000,paid:true,day:1,time:'',title:'Flight'};
const hotel={id:'hotel',category:'Penginapan',price:500000,paid:true,day:1,time:'',title:'Hotel'};
const manual={id:'manual',category:'Wisata',price:123,paid:false,day:1,time:'10:00',title:'Manual'};
const trip={...context,destination:'kl',destinationMeta:{city:context.city},items:[flight,hotel,manual]};
test('excursion intent reaches AI even when overnight city differs; generated visit schedule is replaceable',()=>{
 const visit={id:'old-visit',category:'Wisata',cityId:'melaka',dayPlan:true,generated:true,day:2,time:'12:23',title:'Dutch Square',price:0,paid:false,note:'Old automatically scheduled visit'};
 const t={...trip,items:[...trip.items,visit]};const ctx=aiTripContext(t,context.city,'Malaysia');assert.equal(ctx.requestedStops.find(x=>x.title==='Dutch Square').city,'Melaka');assert.ok(!ctx.retained.some(x=>x.title==='Dutch Square'));
 const next=applyAIPlan(t,plan);assert.ok(!next.items.some(x=>x.id==='old-visit'));
});
test('regeneration replaces automatic day-plan transport but preserves paid/manual transport',()=>{
 const old={id:'old-bus',dayPlan:true,generated:true,category:'Transportasi',title:'Old expensive transfer',paid:false,day:2,time:'08:00',price:500,note:''};
 const protectedItem={...old,id:'manual-transport',userEdited:true};const paidItem={...old,id:'paid-transport',paid:true,time:''};
 const updated=applyAIPlan({...trip,items:[...trip.items,old,protectedItem,paidItem]},plan);
 assert.ok(!updated.items.some(x=>x.id===old.id));assert.ok(updated.items.includes(protectedItem));assert.ok(updated.items.includes(paidItem));
});
test('AI context includes cross-city transfer endpoints and protects paid segments; multi-leg recommendations stay separate',()=>{
 const crossing={id:'crossing',category:'Transportasi',day:2,title:'Singapura → Melaka',fromCity:'sin',toCity:'melaka',mode:'bus',price:100,paid:true,time:'08:00',note:''};
 const ctx=aiTripContext({...trip,items:[...trip.items,crossing]},context.city,'Malaysia');assert.deepEqual(ctx.routeRequests,[{day:2,from:'Singapura',to:'Melaka',mode:'bus',protected:true}]);
 const legs=[['Hotel','Terminal','MRT'],['Terminal','Terminal tujuan','Bus']].map(([fromPlace,toPlace,mode],i)=>({id:'route-'+i,day:2,time:i?'13:00':'11:00',category:'Transfer',title:fromPlace+' → '+toPlace,fromPlace,toPlace,mode,note:'Usulan bersumber; periksa sambungan',sourceUrl}));
 const next=applyAIPlan(trip,{context,summary:'Rute bertahap',sources:[{url:sourceUrl}],activities:legs});const routes=next.items.filter(x=>x.aiGenerated);assert.equal(routes.length,2);assert.deepEqual(routes.map(x=>x.mode),['MRT','Bus']);assert.ok(routes.every(x=>x.priceUnknown&&x.price===0));
});
const plan={context,summary:'Draft',sources:[{url:sourceUrl}],activities:[{id:'ai-1',day:2,time:'10:00',category:'Wisata',title:'Attraction',note:'Check hours',sourceUrl},{id:'ai-2',day:2,time:'14:00',category:'Transfer',title:'Transfer',note:'Check route',sourceUrl},{id:'ai-3',day:1,time:'18:00',category:'Area menginap',title:'District',note:'Area suggestion',sourceUrl}]};
test('applies daily visits/transfers, preserves paid/manual records and never fabricates prices/hotels',()=>{
 const next=applyAIPlan(trip,plan);assert.equal(next.items.length,5);for(const item of trip.items)assert.equal(next.items.find(x=>x.id===item.id),item);
 const added=next.items.filter(x=>x.aiGenerated);assert.deepEqual(added.map(x=>x.category),['Wisata','Transportasi']);assert.ok(added.every(x=>x.priceUnknown&&x.price===0&&!x.bookingUrl&&!x.geo));
 assert.equal(next.aiPlan,plan);assert.equal(JSON.parse(JSON.stringify(next)).items.filter(x=>x.aiGenerated).length,2);
});
test('reapply replaces prior unpaid AI draft without duplicating or removing manual records',()=>{const next=applyAIPlan(applyAIPlan(trip,plan),plan);assert.equal(next.items.length,5);assert.ok(next.items.includes(manual));});
test('rejects stale context, invalid schedule, ungrounded source and paid conflicts',()=>{
 assert.throws(()=>applyAIPlan({...trip,budget:1},plan));
 for(const changed of [{day:9},{time:'25:00'},{sourceUrl:'https://unverified.test/'}])assert.throws(()=>applyAIPlan(trip,{...plan,activities:[{...plan.activities[0],...changed}]}));
 assert.throws(()=>applyAIPlan({...trip,items:[...trip.items,{...manual,id:'paid',day:2,time:'10:30',paid:true}]},plan));
 assert.throws(()=>applyAIPlan({...trip,flight:{arrive:'09:00',arrivalDay:1}},plan));
 assert.throws(()=>applyAIPlan({...trip,journey:'return',flight:{arrive:'--:--',returnAt:'2026-12-11T15:00:00+08:00'}},plan));
});
test('hotel and transport recommendations are daily items replacing only template coverage',()=>{
 const oldHotel={...hotel,id:'template-hotel',paid:false,template:true,note:'Template',checkin:context.start,checkout:'2026-12-12'};
 const oldVisit={...manual,id:'template-visit',template:true,day:2,note:'Template'};
 const input={...trip,items:[flight,manual,oldHotel,oldVisit]};
 const integrated={...plan,activities:plan.activities.map(a=>a.category==='Area menginap'?{...a,category:'Penginapan',title:'Sourced hotel',location:'Sourced hotel',city:'Kuala Lumpur'}:a.category==='Transfer'?{...a,fromPlace:'Sourced hotel',toPlace:'Attraction',mode:'MRT',city:'Kuala Lumpur'}:a)};
 const next=applyAIPlan(input,integrated);assert.ok(next.items.includes(flight));assert.ok(next.items.includes(manual));assert.ok(!next.items.some(x=>x.id===oldVisit.id));
 const recommended=next.items.find(x=>x.category==='Penginapan'&&x.aiGenerated);assert.equal(recommended.title,'Sourced hotel');assert.equal(recommended.checkin,'2026-12-10');assert.equal(recommended.checkout,'2026-12-11');assert.equal(recommended.priceUnknown,true);assert.equal(recommended.bookingUrl,undefined);
 const remaining=next.items.find(x=>x.id==='template-hotel-remaining-2');assert.equal(remaining.price,250000);assert.equal(remaining.checkin,'2026-12-11');
 const route=next.items.find(x=>x.category==='Transportasi'&&x.aiGenerated);assert.equal(route.fromPlace,'Sourced hotel');assert.equal(route.toPlace,'Attraction');assert.equal(route.mode,'MRT');
 const restored=JSON.parse(JSON.stringify(next));assert.deepEqual(restored.items,next.items);
});
test('AI receives per-day cities and retained choices; edited items survive regeneration',()=>{
 const edited={...manual,id:'edited-ai',aiGenerated:true,userEdited:true};const input={...trip,cityDays:['kl','melaka','kl'],items:[flight,hotel,edited]};const ctx=aiTripContext(input,'Kuala Lumpur','Malaysia');assert.equal(ctx.dailyCities[1].city,'Melaka');assert.ok(ctx.retained.some(x=>x.title===hotel.title));assert.ok(!ctx.locked.some(x=>x.title===hotel.title));assert.ok(applyAIPlan(input,plan).items.includes(edited));
});
test('rejects a stale multi-city plan and protects selected unpaid hotel stays',()=>{
 assert.throws(()=>applyAIPlan({...trip,cityDays:['kl','melaka','kl']},{...plan,context:{...context,dailyCities:[{day:2,city:'Kuala Lumpur'}]}}));
 const selected={...hotel,paid:false,hotelId:'selected',checkin:'2026-12-10',checkout:'2026-12-12'};
 const result=applyAIPlan({...trip,items:[flight,selected,manual]},plan);assert.ok(result.items.includes(selected));assert.ok(!result.items.some(x=>x.category==='Penginapan'&&x.aiGenerated));
});
