import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import ts from 'typescript';
import {demoDestinations,initialVideoTrip} from '../lib/video-itinerary.mjs';
import {reviewedTrip} from '../lib/reviewed-trip.mjs';
const rows=new Map();let writes=0;
const client={auth:{getUser:async()=>({data:{user:{id:'fixture-owner'}},error:null})},from(table){assert.equal(table,'trips');let op='read',data,filters=[];const q={
 select:()=>q,eq:(key,value)=>{filters.push([key,value]);return q;},update:value=>{op='update';data=value;return q;},insert:value=>{op='insert';data=value;return q;},
 order:async()=>({data:[...rows].filter(([id,r])=>filters.every(([key,v])=>(key==='id'?id:r[key])===v)).map(([id,r])=>({id,data:r.data})),error:null}),
 single:async()=>{writes++;if(op==='insert'){rows.set('fixture-trip',data);return {data:{id:'fixture-trip'},error:null};}const found=[...rows].find(([id,r])=>filters.every(([key,v])=>(key==='id'?id:r[key])===v));if(!found)return {error:new Error('not found')};rows.set(found[0],{...found[1],...data});return {data:{id:found[0]},error:null};}};return q;}};
globalThis.__sorttripFixtureClient=client;
let code=ts.transpileModule(await readFile('app/database-trips.ts','utf8'),{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ES2022}}).outputText;
code=code.replace(/import .* from ['"]\.\/supabase['"];?/,"const supabase=globalThis.__sorttripFixtureClient;const setupMessage='Fixture unavailable';");
const {databaseTrips}=await import('data:text/javascript;base64,'+Buffer.from(code).toString('base64'));
test('existing authenticated persistence adapter saves, edits and reloads video trip with booking metadata intact using only memory fixture',async()=>{
 const trip=initialVideoTrip(demoDestinations('Bangkok').destinations,{start:'2026-11-10',days:3,people:3,demo:true});
 const protectedHotel={id:'hotel-fixture',title:'Previously selected hotel',category:'Penginapan',price:123,paid:true,day:1,time:'18:00',note:'Fixture only',bookingUrl:'https://supplier.example/hotel?tracking=fixture',checkin:'2026-11-10',checkout:'2026-11-12'};
 const updated=reviewedTrip(demoDestinations('Bangkok').destinations,{...trip,items:[...trip.items,protectedHotel]},{reviewed:true});
 assert.strictEqual(updated.items.find(x=>x.id===protectedHotel.id),protectedHotel);
 const save=await databaseTrips('fixture-owner','/ignored',{method:'POST',body:JSON.stringify(updated)});assert.equal(save.status,200);
 const {id}=await save.json();const next={...updated,id,items:updated.items.map((x,i)=>i===0?{...x,time:'11:10'}:x)};
 assert.equal((await databaseTrips('fixture-owner','/ignored',{method:'POST',body:JSON.stringify(next)})).status,200);
 const loaded=await(await databaseTrips('fixture-owner','/ignored')).json();assert.equal(loaded.trips[0].items[0].time,'11:10');assert.equal(loaded.trips[0].people,3);assert.equal(loaded.trips[0].items.find(x=>x.id===protectedHotel.id).bookingUrl,protectedHotel.bookingUrl);
 const count=writes;assert.equal((await databaseTrips('different-fixture-owner','/ignored',{method:'POST',body:JSON.stringify(next)})).status,400);assert.equal(writes,count);
});
