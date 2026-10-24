import {test} from 'node:test';
import assert from 'node:assert/strict';
import ts from 'typescript';
import {readFile} from 'node:fs/promises';
const source=await readFile(new URL('../app/apply-ai-plan.ts',import.meta.url),'utf8');
const js=ts.transpileModule(source,{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ES2022}}).outputText.replace(/^import[^\n]+;\n/,"const destinations=[];const geoData={};const addDays=(s,n)=>new Date(Date.parse(s+'T12:00:00Z')+n*86400000).toISOString().slice(0,10);\n");
const pricingSource=await readFile(new URL('../app/apply-price-quotes.ts',import.meta.url),'utf8');
const pricingJs=ts.transpileModule(pricingSource,{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ES2022}}).outputText.replace(/^import[^\n]+;\n/,"const addDays=(s,n)=>new Date(Date.parse(s+'T12:00:00Z')+n*86400000).toISOString().slice(0,10);const dayDiff=(a,b)=>(Date.parse(b)-Date.parse(a))/86400000;\n");
const pricingUrl='data:text/javascript;base64,'+Buffer.from(pricingJs).toString('base64');
const {applyAIPlan,aiTripContext,reconcileHotelTransfers}=await import('data:text/javascript;base64,'+Buffer.from(js.replace('./apply-price-quotes',pricingUrl).replace('../worker/itinerary-intent.mjs',new URL('../worker/itinerary-intent.mjs',import.meta.url).href).replace('../worker/hotel-stay-policy.mjs',new URL('../worker/hotel-stay-policy.mjs',import.meta.url).href)).toString('base64'));
const sourceUrl='https://example.com/attraction';
const context={city:'Kuala Lumpur',start:'2026-12-10',days:3,people:1,budget:4500000};
const flight={id:'flight',category:'Pesawat',price:1000000,paid:true,day:1,time:'',title:'Flight'};
const hotel={id:'hotel',category:'Penginapan',price:500000,paid:true,day:1,time:'',title:'Hotel'};
const manual={id:'manual',category:'Wisata',price:123,paid:false,day:1,time:'10:00',title:'Manual'};
const trip={...context,destination:'kl',destinationMeta:{city:context.city},items:[flight,hotel,manual]};

test('hotel change replaces obsolete transfer endpoints, clears old fares and preserves protected bookings',()=>{
 const old={...hotel,paid:false,title:'Travelodge Kuala Lumpur City Centre',checkin:context.start,checkout:'2026-12-12'};
 const first={...old,id:'first',title:'Riccarton Capsule Hotel',checkout:'2026-12-11',time:'19:00'};
 const last={...first,id:'last',day:2,title:'KLIA Budget Hotel',checkin:'2026-12-11',checkout:'2026-12-12'};
 const transfer={id:'route',category:'Transportasi',day:2,time:'17:00',title:'Genting → Travelodge',fromPlace:'Sky Sentral Genting',toPlace:old.title,routeOptions:[{legs:[{fromPlace:'Genting',toPlace:old.title}]}],price:100000,priceUnknown:false,paid:false,bookingUrl:'https://12go.asia/old',priceQuote:{amountIDR:100000},note:'old route'};
 const input={...trip,items:[old,transfer]};
 const result=reconcileHotelTransfers(input,[first,last,transfer,{...transfer,id:'paid',paid:true},{...transfer,id:'manual',userEdited:true,aiLocked:true}]);
 const changed=result.find(x=>x.id==='route');assert.equal(changed.toPlace,last.title);assert.equal(changed.title,'Sky Sentral Genting → KLIA Budget Hotel');assert.equal(changed.routeOptions,undefined);assert.equal(changed.priceQuote,undefined);assert.equal(changed.bookingUrl,undefined);assert.equal(changed.priceUnknown,true);assert.doesNotMatch(changed.note,/Travelodge/);
 assert.equal(result.find(x=>x.id==='paid').toPlace,old.title);assert.equal(result.find(x=>x.id==='manual').toPlace,old.title);
 const morning=reconcileHotelTransfers(input,[first,last,{...transfer,day:3,time:'06:00',fromPlace:'Travelodge',toPlace:'KLIA',title:'Travelodge → KLIA'}]).at(-1);assert.equal(morning.fromPlace,last.title);
 const ctx=aiTripContext(input,context.city,'Malaysia','hotel cari dibawah 500000 permalam');assert.equal(ctx.routeRequests.length,0);assert.ok(!ctx.retained.some(x=>x.category==='Transportasi'));
 assert.equal(reconcileHotelTransfers(input,[first,last,changed]).at(-1),changed);
 const validMorning={...transfer,time:'08:00',title:first.title+' → Museum',fromPlace:first.title,toPlace:'Museum'};
 assert.equal(reconcileHotelTransfers(input,[first,last,validMorning]).at(-1),validMorning);
});

test('final airport night requires a geographically matching quote before an old full stay can be replaced',()=>{
 const old={...hotel,paid:false,hotelId:'old',checkin:context.start,checkout:'2026-12-12'};
 const base={category:'Penginapan',time:'19:00',provider:'LiteAPI',sourceUrl,note:''};
 const first={...base,id:'first',hotelId:'city',title:'City hotel',day:1,checkin:context.start,checkout:'2026-12-11'};
 const last={...base,id:'last',hotelId:'airport',title:'Airport hotel',day:2,checkin:'2026-12-11',checkout:'2026-12-12'};
 const fresh={context:{...context,replaceItemIds:[old.id],hotelStay:{day:2,city:'Sepang',area:'KLIA'}},sources:[{url:sourceUrl}],activities:[first,last]};
 const input={...trip,items:[old]},quotes=[hotelQuote(first,250000),hotelQuote(last,300000)];
 assert.ok(applyAIPlan(input,fresh,quotes).items.includes(old));
 const near={lat:2.76,lng:101.71};const valid={...fresh,activities:[first,{...last,geo:near}]};
 const result=applyAIPlan(input,valid,[quotes[0],{...quotes[1],geo:near}]);assert.ok(!result.items.includes(old));assert.deepEqual(result.items.map(x=>x.hotelId),['city','airport']);
});
test('pending supplier hotel booking cannot be replaced by an explicit hotel-change prompt',()=>{
 const held={...hotel,paid:false,bookingHold:true,aiGenerated:true,hotelId:'held'};
 const input={...trip,items:[flight,held,manual]},ctx=aiTripContext(input,context.city,'Malaysia','ganti hotel di bawah 500000 per malam');
 assert.ok(!ctx.replaceItemIds.includes(held.id));assert.ok(ctx.retained.some(r=>r.title===held.title));
 assert.ok(applyAIPlan(input,{...plan,context:{...context,replaceItemIds:[held.id]}}).items.includes(held));
});
test('first-day museum edit preserves later-day attractions, including unedited AI selections',()=>{
 const later={...manual,id:'genting',title:'Genting',day:2,aiGenerated:true};
 const input={...trip,items:[flight,hotel,manual,later]};
 const ctx=aiTripContext(input,context.city,'Malaysia','hari pertama ganti menjadi wisata museum, hotel cari yg dibawah 500000 permalam');
 assert.deepEqual(ctx.replaceItemIds,['manual']);assert.deepEqual(ctx.preserveItemIds,['genting']);
 assert.ok(ctx.retained.some(x=>x.title==='Genting'));assert.ok(ctx.requestedStops.some(x=>x.title==='Genting'));
 const result=applyAIPlan(input,{...plan,context:{...context,replaceItemIds:ctx.replaceItemIds,preserveItemIds:ctx.preserveItemIds},activities:[{...plan.activities[0],day:1,title:'Museum'}]});
 assert.ok(result.items.includes(later));assert.ok(!result.items.some(x=>x.id==='manual'));
});
test('explicit museum and nightly budget request releases only unpaid selections and carries budget',()=>{
 const selected={...hotel,paid:false,hotelId:'selected',checkin:context.start,checkout:'2026-12-12',userEdited:true};
 const input={...trip,items:[flight,selected,{...manual,day:2},{...manual,time:'',id:'paid-museum',paid:true}]};
 const ctx=aiTripContext(input,context.city,'Malaysia','ganti wisata menjadi museum dan hotel ganti cari yg dibawah 500000 permalam');
 assert.deepEqual(ctx.hotelBudget,{maxNightIDR:500000,exclusive:true});
 assert.deepEqual(ctx.replaceItemIds,['hotel','manual']);
 assert.ok(!ctx.retained.some(x=>x.title===selected.title));
 assert.ok(ctx.retained.some(x=>x.title===manual.title)); // paid museum is still retained
 const fresh={...plan,context:{...context,replaceItemIds:ctx.replaceItemIds},activities:[...plan.activities.filter(a=>a.category!=='Penginapan'),{id:'new-hotel',day:1,time:'16:00',category:'Penginapan',title:'Budget hotel',sourceUrl,hotelId:'budget',provider:'LiteAPI',checkin:context.start,checkout:'2026-12-12',note:''}]};
 const result=applyAIPlan(input,fresh,[hotelQuote(fresh.activities.at(-1))]);
 assert.ok(!result.items.some(x=>x.id==='hotel'||x.id==='manual'));
 assert.ok(result.items.some(x=>x.id==='paid-museum'));
 assert.ok(result.items.some(x=>x.hotelId==='budget'));
});
test('unavailable hotel replacement preserves the existing stay, including a prior AI selection',()=>{
 const old={...hotel,paid:false,aiGenerated:true,hotelId:'old',checkin:context.start,checkout:'2026-12-12'};
 const result=applyAIPlan({...trip,items:[flight,old]}, {...plan,context:{...context,replaceItemIds:['hotel']},activities:plan.activities.filter(a=>a.category==='Wisata')});
 assert.ok(result.items.includes(old));
});
test('excursion intent reaches AI even when overnight city differs; generated visit schedule is replaceable',()=>{
 const visit={id:'old-visit',category:'Wisata',cityId:'melaka',dayPlan:true,generated:true,day:2,time:'12:23',title:'Dutch Square',price:0,paid:false,note:'Old automatically scheduled visit'};
 const t={...trip,items:[...trip.items,visit]};const ctx=aiTripContext(t,context.city,'Malaysia');assert.equal(ctx.requestedStops.find(x=>x.title==='Dutch Square').city,'Melaka');assert.ok(!ctx.retained.some(x=>x.title==='Dutch Square'));
 const next=applyAIPlan(t,plan);assert.ok(!next.items.some(x=>x.id==='old-visit'));
});
test('regeneration replaces automatic day-plan transport but preserves paid/explicitly locked transport',()=>{
 const old={id:'old-bus',dayPlan:true,generated:true,category:'Transportasi',title:'Old expensive transfer',paid:false,day:2,time:'08:00',price:500,note:''};
 const protectedItem={...old,id:'manual-transport',userEdited:true,aiLocked:true};const paidItem={...old,id:'paid-transport',paid:true,time:''};
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
test('AI receives per-day cities; manual edits alone are not protected',()=>{
 const edited={...manual,id:'edited-ai',aiGenerated:true,userEdited:true};const input={...trip,cityDays:['kl','melaka','kl'],items:[flight,hotel,edited]};const ctx=aiTripContext(input,'Kuala Lumpur','Malaysia');assert.equal(ctx.dailyCities[1].city,'Melaka');assert.ok(ctx.retained.some(x=>x.title===hotel.title));assert.ok(!ctx.locked.some(x=>x.title===hotel.title));assert.ok(!ctx.retained.some(x=>x.title===edited.title));assert.ok(!applyAIPlan(input,plan).items.includes(edited));
});
test('rejects a stale multi-city plan and protects selected unpaid hotel stays',()=>{
 assert.throws(()=>applyAIPlan({...trip,cityDays:['kl','melaka','kl']},{...plan,context:{...context,dailyCities:[{day:2,city:'Kuala Lumpur'}]}}));
 const selected={...hotel,paid:false,hotelId:'selected',checkin:'2026-12-10',checkout:'2026-12-12'};
 const result=applyAIPlan({...trip,items:[flight,selected,manual]},plan);assert.ok(result.items.includes(selected));assert.ok(!result.items.some(x=>x.category==='Penginapan'&&x.aiGenerated));
});

function hotelQuote(a,amountIDR=600000){return {id:'ai-plan-'+a.id,provider:'LiteAPI',scope:'dated',basis:'stay_total',hotelId:a.hotelId,hotelName:a.title,amountIDR,checkin:a.checkin,checkout:a.checkout,adults:1,rooms:1,taxesIncluded:true,roomType:'Standard',sourceUrl,quote:'Fixture supplier quote',checkedAt:'2026-10-24T00:00:00Z'};}

test('AI-generated hotel survives unrelated regeneration without an explicit replacement',()=>{
 const old={...hotel,paid:false,aiGenerated:true,hotelId:'old',checkin:context.start,checkout:'2026-12-12'};
 const result=applyAIPlan({...trip,items:[flight,old]},{...plan,activities:plan.activities.filter(a=>a.category==='Wisata')});
 assert.ok(result.items.includes(old));
});

test('retained activity ID collision cannot discard a valid replacement hotel or its quote',()=>{
 const old={...hotel,paid:false,hotelId:'old',checkin:context.start,checkout:'2026-12-12'};
 const protectedVisit={...manual,id:'ai-plan-collision',userEdited:true,aiLocked:true,time:''};
 const a={id:'collision',category:'Penginapan',day:1,time:'16:00',title:'Budget hotel',hotelId:'new',provider:'LiteAPI',checkin:context.start,checkout:'2026-12-12',sourceUrl,note:''};
 const input={...trip,items:[flight,old,protectedVisit]},replacement={...plan,context:{...context,replaceItemIds:[old.id]},activities:[a]};
 const result=applyAIPlan(input,replacement,[hotelQuote(a)]);
 assert.ok(result.items.includes(protectedVisit));assert.ok(!result.items.includes(old));
 const stay=result.items.find(x=>x.hotelId==='new');assert.ok(stay);assert.equal(stay.price,600000);assert.equal(stay.priceUnknown,false);assert.equal(stay.priceQuote.id,stay.id);
 assert.equal(new Set(result.items.map(x=>x.id)).size,result.items.length);
 assert.equal(applyAIPlan(result,replacement,[hotelQuote(a)]).items.length,result.items.length);
});

test('missing, partial, out-of-budget or malformed replacement quote preserves the original full stay',()=>{
 const old={...hotel,paid:false,aiGenerated:true,hotelId:'old',checkin:context.start,checkout:'2026-12-12'};
 const a={id:'budget',category:'Penginapan',day:1,time:'16:00',title:'Budget hotel',hotelId:'new',provider:'LiteAPI',checkin:context.start,checkout:'2026-12-12',sourceUrl,note:''};
 const input={...trip,items:[flight,old]},replacement={...plan,context:{...context,replaceItemIds:[old.id],hotelBudget:{maxNightIDR:500000,exclusive:true}},activities:[a]};
 for(const quote of [null,{...hotelQuote(a),taxesIncluded:false},{...hotelQuote(a),checkout:'2026-12-11'},hotelQuote(a,1000000)]){
  const result=applyAIPlan(input,replacement,quote?[quote]:[]);assert.ok(result.items.includes(old));assert.equal(result.items.filter(x=>x.category==='Penginapan').length,1);
 }
 const partial={...a,checkout:'2026-12-11'};
 assert.ok(applyAIPlan(input,{...replacement,activities:[partial]},[hotelQuote(partial)]).items.includes(old));
});

test('partial overlap cannot delete one stay when its replacement conflicts with a retained later stay',()=>{
 const first={...hotel,paid:false,hotelId:'first',checkin:context.start,checkout:'2026-12-11'};
 const second={...hotel,id:'second',day:2,paid:false,hotelId:'second',checkin:'2026-12-11',checkout:'2026-12-12',userEdited:true,aiLocked:true};
 const a={id:'overlap',category:'Penginapan',day:1,time:'16:00',title:'Overlapping hotel',hotelId:'new',provider:'LiteAPI',checkin:context.start,checkout:'2026-12-12',sourceUrl,note:''};
 const next=applyAIPlan({...trip,items:[flight,first,second]},{...plan,context:{...context,replaceItemIds:[first.id]},activities:[a]},[hotelQuote(a)]);
 assert.ok(next.items.includes(first));assert.ok(next.items.includes(second));assert.equal(next.items.filter(x=>x.category==='Penginapan').length,2);
});


test('manual edits can be replaced; explicit locks survive regeneration and unlocking releases them',()=>{
 const edited={...manual,id:'edited',day:2,time:'06:00',userEdited:true};
 const input={...trip,items:[flight,hotel,edited]};
 assert.ok(!applyAIPlan(input,plan).items.some(x=>x.id===edited.id));
 const locked={...edited,aiLocked:true};
 const frozen={...input,items:[flight,hotel,locked]};
 assert.ok(aiTripContext(frozen,context.city,'Malaysia','ganti wisata').retained.some(x=>x.title===locked.title));
 assert.ok(!aiTripContext(frozen,context.city,'Malaysia','ganti wisata').replaceItemIds.includes(locked.id));
 const result=applyAIPlan(frozen,{...plan,context:{...context,replaceItemIds:[locked.id]}});
 assert.equal(result.items.find(x=>x.id===locked.id),locked);
 assert.equal(JSON.parse(JSON.stringify(result)).items.find(x=>x.id===locked.id).aiLocked,true);
 assert.ok(!applyAIPlan({...frozen,items:[flight,hotel,{...locked,aiLocked:false}]},plan).items.some(x=>x.id===locked.id));
});

test('legacy manually edited Travelodge routes are reconciled unless explicitly locked or bought',()=>{
 const old={...hotel,paid:false,title:'Travelodge Kuala Lumpur City Centre'};
 const first={...old,id:'first',title:'City Budget Hotel',checkin:context.start,checkout:'2026-12-11'};
 const last={...first,id:'last',day:2,title:'KLIA Budget Hotel',checkin:'2026-12-11',checkout:'2026-12-12'};
 const route={...manual,id:'route',category:'Transportasi',day:2,time:'17:00',title:'Sky Sentral Genting → KL Sentral → Travelodge',userEdited:true,price:100,routeOptions:[{legs:[{toPlace:'Travelodge'}]}]};
 const items=reconcileHotelTransfers({...trip,items:[old,route]},[first,last,route,{...route,id:'locked',aiLocked:true},{...route,id:'bought',paid:true}]);
 const changed=items.find(x=>x.id==='route');assert.match(changed.title,/KLIA Budget Hotel/);assert.doesNotMatch(changed.title,/Travelodge/);assert.equal(changed.routeOptions,undefined);assert.equal(changed.price,0);assert.equal(changed.priceUnknown,true);
 assert.match(items.find(x=>x.id==='locked').title,/Travelodge/);assert.match(items.find(x=>x.id==='bought').title,/Travelodge/);
});

test('a current user lock wins over an older plan requesting a priced hotel replacement',()=>{
 const old={...hotel,paid:false,aiLocked:true,hotelId:'old',checkin:context.start,checkout:'2026-12-12'};
 const a={id:'replacement',category:'Penginapan',day:1,time:'16:00',title:'New hotel',hotelId:'new',provider:'LiteAPI',checkin:context.start,checkout:'2026-12-12',sourceUrl,note:''};
 const result=applyAIPlan({...trip,items:[flight,old]},{...plan,context:{...context,replaceItemIds:[old.id]},activities:[a]},[hotelQuote(a)]);
 assert.equal(result.items.find(x=>x.id===old.id),old);assert.ok(!result.items.some(x=>x.hotelId==='new'));
});

test('supplier-verified hotel replacement does not require narrow replacement keywords',()=>{
 const old={...hotel,paid:false,hotelId:'old',userEdited:true,checkin:context.start,checkout:'2026-12-12'};
 const a={id:'replacement',category:'Penginapan',day:1,time:'16:00',title:'New hotel',hotelId:'new',provider:'LiteAPI',checkin:context.start,checkout:'2026-12-12',sourceUrl,note:''};
 const result=applyAIPlan({...trip,items:[flight,old]},{...plan,activities:[a]},[hotelQuote(a)]);
 assert.ok(!result.items.includes(old));assert.ok(result.items.some(x=>x.hotelId==='new'));
});


test('AI price refresh cannot mutate paid, pending or user-locked items',async()=>{
 const {applyPriceQuotes,buildPriceTargets}=await import(pricingUrl);
 const item={id:'bus',title:'Bus',category:'Transportasi',day:2,time:'10:00',price:100,paid:false};
 for(const protection of [{paid:true},{bookingHold:true},{aiLocked:true}]){
  const frozen={...item,...protection};const input={...trip,items:[frozen]};
  assert.deepEqual(buildPriceTargets(input,context.city),[]);
  assert.equal(applyPriceQuotes(input,[{id:'bus',basis:'person',amountIDR:999,checkedAt:'2026-10-24'}]).items[0],frozen);
 }
 assert.equal(applyPriceQuotes({...trip,items:[item]},[{id:'bus',basis:'person',amountIDR:999,checkedAt:'2026-10-24'}]).items[0].price,999);
});
