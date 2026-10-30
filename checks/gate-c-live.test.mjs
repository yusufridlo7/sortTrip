import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {createGateCLive} from '../qa-config/gate-c-live.mjs';
const origin='http://127.0.0.1:5176';
const query={origin:'CGK',destination:'KUL',journey:'return',outFrom:'2026-11-10',outTo:'2026-11-10',backFrom:'2026-11-12',backTo:'2026-11-12',minDays:3,maxDays:3};
const hotel={city:'Kuala Lumpur',country:'MY',checkin:'2026-11-10',checkout:'2026-11-12',people:1};
const connection={host:'127.0.0.1:5176',remoteAddress:'127.0.0.1'};
const request=(kind,q=query)=>new Request(origin+(kind==='flight'?'/api/flights?'+new URLSearchParams(q):'/api/hotels/search'),{method:kind==='flight'?'GET':'POST',headers:{Origin:origin,Authorization:'Bearer fixture'}});
function setup(t,fetcher,verify=async()=>Response.json({ownerVerified:true})){
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'sorttrip-gate-c-live-test-'));t.after(()=>fs.rmSync(dir,{recursive:true,force:true}));
 const opts={directory:dir,bindings:{TRAVELPAYOUTS_API_TOKEN:'fixture-flight',LITEAPI_API_KEY:'fixture-hotel'},fetcher,verify};return {dir,opts,live:createGateCLive({},opts)};
}
test('fixed flight/hotel requests, sourced full-stay result, cache repeat, auto close',async t=>{
 let calls=0;const {live,opts}=setup(t,async(u,i)=>{
  calls++;if(u.includes('travelpayouts')){const p=new URL(u).searchParams;assert.equal(p.get('departure_at'),'2026-11-10');assert.equal(p.get('return_at'),'2026-11-12');return Response.json({success:true,currency:'idr',data:[{origin:'CGK',destination:'KUL',price:1234567,departure_at:'2026-11-10T07:00:00+07:00',return_at:'2026-11-12T18:00:00+08:00',link:'/search/CGK1011KUL12111?marker=fixture-public'}]});}
  const b=JSON.parse(i.body);assert.deepEqual(b.hotelIds,['lp65706cc6']);assert.equal(b.currency,'IDR');assert.deepEqual(b.occupancies,[{adults:1,children:[]}]);
  return Response.json({data:[{hotelId:'lp65706cc6',roomTypes:[{rateType:'standard',rates:[{occupancyNumber:1,adultCount:1,childCount:0,name:'Fixture room',retailRate:{total:[{amount:400000,currency:'IDR'}],suggestedSellingPrice:[{amount:420000,currency:'IDR'}],taxesAndFees:[{included:true}]},cancellationPolicies:{refundableTag:'NRFN'}}]}]}]});
 });
 const flight=await live.handle(request('flight'),'',connection);assert.equal(flight.status,200);const fd=await flight.json();assert.equal(fd.flights[0].price,1234567);assert.equal(fd.indicative,true);assert.match(fd.flights[0].bookingUrl,/marker=fixture-public/);
 const r=await live.handle(request('hotel'),JSON.stringify(hotel),connection);assert.equal(r.status,200);const data=await r.json();assert.equal(data.hotels[0].amountIDR,420000);assert.equal(data.hotels[0].basis,'stay_total');assert.equal(data.hotels[0].checkout,'2026-11-12');assert.equal(calls,2);assert.equal(live.enabled(),false);
 const fresh=createGateCLive({},opts);assert.equal(fresh.enabled(),false);assert.equal((await (await fresh.handle(request('flight'),'',connection)).json()).qaStoredLiveResult,true);assert.equal(calls,2);
});
test('owner, loopback, methods, other route, wrong dates/pax fail before supplier',async t=>{
 let calls=0;const {live}=setup(t,async()=>{calls++;assert.fail();});
 assert.equal((await live.handle(request('flight'),'',{...connection,remoteAddress:'192.168.1.4'})).status,403);
 assert.equal((await live.handle(request('flight',{...query,departure_at:'2026-11-10',outFrom:'2026-11-11'}),'',connection)).status,400);
 assert.equal((await live.handle(request('hotel'),JSON.stringify({...hotel,people:2}),connection)).status,400);
 assert.equal((await live.handle(new Request(origin+'/api/itinerary'),'',connection)).status,404);
 const denied=setup(t,async()=>{calls++;},async()=>Response.json({code:'OWNER_REQUIRED'},{status:403}));assert.equal((await denied.live.handle(request('flight'),'',connection)).status,403);assert.equal(calls,0);
});
test('failed provider call recorded once; empty hotel not converted to zero or fixture',async t=>{
 let calls=0;const {live}=setup(t,async()=>{calls++;return new Response('private error',{status:401});});
 assert.equal((await live.handle(request('flight'),'',connection)).status,502);assert.equal((await live.handle(request('flight'),'',connection)).status,502);assert.equal(calls,1);
 const empty=setup(t,async()=>Response.json({data:[]}));const data=await (await empty.live.handle(request('hotel'),JSON.stringify(hotel),connection)).json();assert.deepEqual(data.hotels,[]);assert.equal('amountIDR' in data,false);
});
test('malformed/sandbox rates envelope rejected and sandbox key cannot consume rates slot',async t=>{
 for(const body of [{data:null},{sandbox:true,data:[]}]){const {live}=setup(t,async()=>Response.json(body));assert.equal((await live.handle(request('hotel'),JSON.stringify(hotel),connection)).status,502);}
 const {opts}=setup(t,async()=>assert.fail('No network'));opts.bindings.LITEAPI_API_KEY='sand_fixture-key';const live=createGateCLive({},opts);assert.equal((await live.handle(request('hotel'),JSON.stringify(hotel),connection)).status,503);assert.equal(fs.existsSync(path.join(opts.directory,'hotel.claimed')),false);
});
