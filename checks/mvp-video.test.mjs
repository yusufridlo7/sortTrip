import {test} from 'node:test';
import assert from 'node:assert/strict';
import {demoDestinations,initialVideoTrip,socialVideoUrl,normalizeDestinations,destinationSchema} from '../lib/video-itinerary.mjs';
import {tiktokReference} from '../worker/tiktok-reference.js';
const options={start:'2026-11-10',days:3,people:3,language:'id',demo:true};
test('Bangkok reviewed fixture creates priced-unknown editable itinerary with consistent airport and no media storage',()=>{
 const rows=demoDestinations('Bangkok').destinations;
 const trip=initialVideoTrip(rows,options);
 assert.equal(trip.destinationMeta.code,'DMK');assert.equal(trip.people,3);
 assert.deepEqual(trip.items.map(x=>x.title),['Wat Arun','Wat Pho']);
 assert(trip.items.every(x=>x.priceUnknown&&x.price===0&&!x.paid&&x.note.includes('CONTOH DEMO')));
 assert(!JSON.stringify(trip).includes('data:image'));
 const edited={...trip,items:[{...trip.items[1],time:'11:30'},trip.items[0]]};
 const reload=JSON.parse(JSON.stringify(edited));assert.equal(reload.items[0].title,'Wat Pho');assert.equal(reload.items[0].time,'11:30');
});
test('deselection and reordering produce only the selected destinations in the requested order',()=>{
 const rows=demoDestinations('Bangkok').destinations;
 assert.equal(initialVideoTrip([rows[1]],options).items.length,1);
 assert.equal(initialVideoTrip([...rows].reverse(),options).items[0].title,'Wat Pho');
 assert.throws(()=>initialVideoTrip([],options),/REVIEW_REQUIRED/);
});
test('uncertain manual correction needs explicit confirmation and never inherits forged coordinates',()=>{
 const base=demoDestinations('Bangkok').destinations[0];
 const raw=Object.fromEntries(destinationSchema.properties.destinations.items.required.map(k=>[k,base[k]]));
 const candidate=normalizeDestinations({destinations:[{...raw,name:'Owner selected meeting point',confidence:'low'}]})[0];
 candidate.geo={lat:1,lng:1};candidate.verified=true;
 assert.throws(()=>initialVideoTrip([candidate],options),/REVIEW_REQUIRED/);
 const trip=initialVideoTrip([{...candidate,manualConfirmed:true}],{...options,manualReview:true});
 assert.equal(trip.items[0].geo,undefined);assert.equal(trip.items[0].priceUnknown,true);
 assert.throws(()=>initialVideoTrip([{...candidate,manualConfirmed:true,city:'Hanoi'},base],{...options,manualReview:true}),/REVIEW_REQUIRED/);
});
test('TikTok validation and inaccessible metadata never equal successful video analysis',async()=>{
 for(const url of ['https://vt.tiktok.com/ZSgq41yuY/','https://vm.tiktok.com/Abc123/','https://www.tiktok.com/t/Abc123/','https://www.tiktok.com/@travel/video/1234567890123456789'])assert.equal(socialVideoUrl(url).provider,'tiktok');
 for(const url of ['http://127.0.0.1/x','https://tiktok.com.evil.test/@x/video/1234567890','https://user:pass@vt.tiktok.com/Abc123/'])assert.throws(()=>socialVideoUrl(url));
 const urls=[];const result=await tiktokReference('https://vt.tiktok.com/Abc123/',{fetcher:async(url)=>{urls.push(url);return new Response(null,{status:302,headers:{Location:'http://127.0.0.1/private'}});}});
 assert.equal(result.status,'unavailable');assert.equal(result.caption,'');assert.equal(urls.length,1);
 const caption=await tiktokReference('https://www.tiktok.com/t/Abc123/',{fetcher:async(url)=>url.includes('/t/')?new Response(null,{status:302,headers:{Location:'https://www.tiktok.com/@travel/video/1234567890123456789'}}):Response.json({title:'Bangkok travel'})});
 assert.equal(caption.status,'caption');assert.equal(caption.caption,'Bangkok travel');assert.equal(caption.videoAccessed,undefined);
});
