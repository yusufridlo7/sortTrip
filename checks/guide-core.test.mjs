import {test} from 'node:test';
import assert from 'node:assert/strict';
import {guideSnapshot,guideRevision,guideCheckpoints,zonedInstant,guideProgress,autoHelpDecision,validateGuideChanges,applyGuideChanges} from '../shared/guide-core.mjs';
const trip={id:'11111111-1111-4111-8111-111111111111',destination:'kl',origin:'CGK',start:'2026-11-07',days:3,people:1,budget:4500000,items:[{id:'a',title:'Museum',category:'Wisata',day:2,time:'09:00',geo:{lat:3.14,lng:101.68},paid:false,price:0},{id:'b',title:'Park',category:'Wisata',day:2,time:'11:00',paid:false,price:0}]};
test('Guide snapshot strips booking URLs, account data and media; revision binds all relevant item protections',async()=>{
 const s=guideSnapshot({...trip,secret:'SENSITIVE',media:['raw'],items:trip.items.map(i=>({...i,bookingUrl:'https://private.example/?token=private'}))});
 assert.ok(!JSON.stringify(s).includes('SENSITIVE'));assert.ok(!JSON.stringify(s).includes('private'));assert.ok(!JSON.stringify(s).includes('raw'));
 assert.notEqual(await guideRevision(s),await guideRevision(guideSnapshot({...trip,items:[{...trip.items[0],aiLocked:true},trip.items[1]]})));
 assert.equal(await guideRevision(guideSnapshot(trip)),await guideRevision(guideSnapshot({...trip,items:[...trip.items].reverse()})));
 assert.equal(guideSnapshot({...trip,items:[{...trip.items[0],sourceUrl:'https://example.com/?access_token=PRIVATE'}]}).items[0].sourceUrl,'');
 for(const bad of [{...trip,start:'2026-02-30'},{...trip,items:[{...trip.items[0],day:0}]},{...trip,items:[trip.items[0],trip.items[0]]}])assert.throws(()=>guideSnapshot(bad));
});
test('checkpoint times use destination time zone, including departure origin; invalid/DST gaps fail closed',()=>{
 assert.equal(zonedInstant('2026-11-08','09:00','Asia/Kuala_Lumpur'),Date.parse('2026-11-08T01:00:00Z'));
 assert.equal(zonedInstant('2026-02-30','10:00','Asia/Jakarta'),null);assert.equal(zonedInstant('2026-03-08','02:30','America/New_York'),null);
 const c=guideCheckpoints(guideSnapshot({...trip,items:[...trip.items,{id:'flight',category:'Pesawat',title:'CGK KUL',day:1,time:'07:00',paid:false}]}),'Asia/Kuala_Lumpur');assert.equal(c[0].at,Date.parse('2026-11-07T00:00:00Z'));
 assert.throws(()=>guideCheckpoints(guideSnapshot(trip),'not-a-zone'));
});
test('elapsed time changes EXPECTED checkpoint, never claims the user arrived; unknown coordinates remain unknown',()=>{
 const c=guideCheckpoints(guideSnapshot(trip),'Asia/Kuala_Lumpur'),now=c[0].at+20*60000;
 const p=guideProgress(c,now);assert.equal(p.current.id,'a');assert.equal(p.late,true);assert.equal(p.locationStatus,'unknown');assert.equal(guideProgress(c,c[0].at-1).current,null);
 assert.equal(guideProgress(c,c[1].at+1,[],{lat:3.14,lng:101.68,accuracy:10,timestamp:c[1].at+1}).locationStatus,'unverifiable');
});
test('fresh/accurate GPS distinguishes near/off-route while stale, denied or inaccurate readings do not trigger AI',()=>{
 const c=guideCheckpoints(guideSnapshot(trip),'Asia/Kuala_Lumpur'),now=c[0].at+60000,p={lat:3.14,lng:101.68,accuracy:20,timestamp:now};
 assert.equal(guideProgress(c,now,[],p).locationStatus,'near');assert.equal(guideProgress(c,now,[],{...p,lat:3.3}).locationStatus,'off_route');
 for(const value of [null,{...p,accuracy:500},{...p,timestamp:now-121000},{...p,timestamp:now+60000}])assert.equal(guideProgress(c,now,[],value).locationStatus,'unknown');
});
test('automatic help requires two distinct accurate samples, cooldown and cap; each checkpoint triggers once',()=>{
 const c=guideCheckpoints(guideSnapshot(trip),'Asia/Kuala_Lumpur'),now=c[0].at+60000,position={lat:3.3,lng:101.7,accuracy:20,timestamp:now};const p=guideProgress(c,now,[],position),h={count:0,lastAt:0,ids:[]};
 assert.equal(autoHelpDecision(p,[{...position,timestamp:now-25000},position],now,h),true);
 for(const [samples,history]of [[[position],h],[[position,position],h],[[{...position,timestamp:now-25000},position],{...h,count:3}],[[{...position,timestamp:now-25000},position],{...h,lastAt:now-1000}],[[{...position,timestamp:now-25000},position],{...h,ids:['a']}]])assert.equal(autoHelpDecision(p,samples,now,history),false);
});
test('schedule proposals cannot edit paid/locked/booking/flight/hotel items or exceed arrival/return/locked buffers',()=>{
 const s=guideSnapshot({...trip,flight:{arrive:'10:00',arrivalDay:0,returnAt:'2026-11-09T18:00:00'},items:[...trip.items,{...trip.items[0],id:'locked',aiLocked:true,time:'15:00'},{...trip.items[1],id:'paid',paid:true},{...trip.items[1],id:'pending',bookingHold:true},{...trip.items[1],id:'flight',category:'Pesawat'},{...trip.items[1],id:'hotel',category:'Penginapan'}]});
 assert.deepEqual(validateGuideChanges(s,[{itemId:'a',day:2,time:'12:30'}]),[{itemId:'a',day:2,time:'12:30'}]);
 for(const itemId of ['locked','paid','pending','flight','hotel','unknown'])assert.throws(()=>validateGuideChanges(s,[{itemId,day:2,time:'10:00'}]));
 for(const [day,time]of [[1,'11:00'],[3,'15:00'],[2,'14:30'],[4,'10:00'],[2,'25:00']])assert.throws(()=>validateGuideChanges(s,[{itemId:'a',day,time}]));
 assert.throws(()=>validateGuideChanges(s,[{itemId:'a',day:2,time:'10:00',price:1}]));assert.throws(()=>validateGuideChanges(s,[{itemId:'a',day:2,time:'10:00'},{itemId:'a',day:2,time:'11:00'}]));
});
test('approved changes preserve other items, sync plan context and invalidate dated offers instead of reusing stale booking prices',()=>{
 const original={...trip,items:[{...trip.items[0],category:'Transportasi',price:10000,priceUnknown:false,routeOptions:[{}],priceQuote:{},bookingUrl:'https://example.com/old'},trip.items[1]],aiPlan:{activities:trip.items.map(i=>({...i}))}};
 const next=applyGuideChanges(original,[{itemId:'a',day:2,time:'09:30'}]);
 assert.equal(original.items[0].time,'09:00');assert.equal(next.items[0].time,'09:30');assert.equal(next.items[0].priceUnknown,true);assert.equal(next.items[0].bookingUrl,undefined);assert.equal(next.items[0].routeOptions,undefined);assert.equal(next.aiPlan.activities[0].time,'09:30');assert.strictEqual(next.items[1],original.items[1]);
});
