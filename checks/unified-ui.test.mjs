import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {manualItinerary} from '../lib/manual-itinerary.mjs';
import {initialVideoTrip,demoDestinations} from '../lib/video-itinerary.mjs';
import {mergeReviewedVideoDraft} from '../lib/reviewed-trip.mjs';
const location={city:'Bangkok',country:'Thailand',code:'BKK'};
test('manual destination creates the existing Trip contract without simulated bookings or prices',()=>{
 const t=manualItinerary(location,{start:'2026-11-10',days:3,people:3,budget:4000000,origin:'SUB'});
 assert.equal(t.destinationMeta.code,'BKK');assert.equal(t.origin,'SUB');assert.equal(t.people,3);assert.equal(t.budget,4000000);assert.deepEqual(t.items,[]);assert(t.estimateIncomplete);assert.equal(t.version,2);
 assert.throws(()=>manualItinerary(null,{start:'2026-11-10',days:3,people:1}),/DESTINATION_REQUIRED/);
 for(const bad of [{start:'2026-02-30'},{days:0},{people:0},{origin:'XXX'},{budget:-1}])assert.throws(()=>manualItinerary(location,{start:'2026-11-10',days:3,people:1,...bad}),/INVALID_MANUAL_TRIP/);
});
test('reviewed video updates preserve paid/locked items, dates, travelers and affiliate data',()=>{
 const draft=initialVideoTrip(demoDestinations('Bangkok').destinations,{start:'2026-11-10',days:3,people:3,demo:true});
 const hotel={id:'hotel',title:'Protected fixture hotel',category:'Penginapan',paid:true,aiLocked:true,bookingUrl:'https://supplier.example?affiliate=preserved',checkin:'2026-11-10',checkout:'2026-11-12'};
 const trip={...draft,id:'fixture-trip',items:[hotel,...draft.items]};const next=mergeReviewedVideoDraft(trip,draft);
 assert.strictEqual(next.items[0],hotel);assert.equal(next.items.length,3);assert.equal(next.id,trip.id);assert.equal(next.people,3);assert.equal(next.start,trip.start);assert.equal(next.items[0].bookingUrl,hotel.bookingUrl);
 assert.throws(()=>mergeReviewedVideoDraft(trip,{...draft,destinationMeta:{...draft.destinationMeta,city:'Hanoi'}}),/REVIEW_REQUIRED/);
});
test('original root and authentication remain the default, isolated MVP is not substituted',()=>{
 assert.match(readFileSync('index.html','utf8'),/src="\/main.jsx"/);assert.match(readFileSync('main.jsx','utf8'),/<AuthApp\/>/);
 assert.doesNotMatch(readFileSync('main.jsx','utf8'),/mvp-demo|staging-entry/);
 const owner=readFileSync('vite.owner-ui.config.js','utf8');assert.match(owner,/envDir:false/);assert.doesNotMatch(owner,/createRoot|mvp-demo.html/);
 assert.match(readFileSync('app/travel-app.tsx','utf8'),/databaseTrips\(user.id/);
});
