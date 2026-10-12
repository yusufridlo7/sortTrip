import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createHotelServer} from '../services/hotel-browser/server.mjs';
import {validateRequest} from '../services/hotel-browser/service.mjs';
import {externalHotelPrices,externalHotelServiceConfigured} from '../worker/external-hotel-browser.js';
import {datedHotelUrl} from '../worker/trip-hotel-browser.js';
const target={id:'qa',category:'Penginapan',title:'Sleeping Lion Suites',sourceUrl:'https://id.trip.com/hotels/kuala-lumpur-hotel-detail-104384927/sleeping-lion-suites/',checkin:'2026-10-19',checkout:'2026-10-20',rooms:1};
const input={people:1,targets:[target]},env={HOTEL_PRICE_SERVICE_ENABLED:'true',HOTEL_PRICE_SERVICE_URL:'https://hotel-service.example/v1/hotel-prices',HOTEL_PRICE_SERVICE_TOKEN:'fixture-only-token-0000000000000000'};
const observation={url:datedHotelUrl(target,1),hotel:target.title,checkinLabel:'Sen, 19 Okt',checkoutLabel:'Sel, 20 Okt',guests:'1 kamar, 1 Dewasa, 0 Anak',nights:1,offers:[{roomType:'Kamar Junior Premier',text:'Tidak dapat di-refund\n2 dewasa\nTotal harga: Rp886.729\nTermasuk pajak & biaya lainnya'}]};
test('external service validates actual evidence again and sends only planning fields',async()=>{
 let sent;
 const quotes=await externalHotelPrices({people:1},[{...target,secret:'must-not-send'}],env,Date.now()+10000,{},async(url,init)=>{sent=JSON.parse(init.body);assert.equal(init.redirect,'error');return Response.json({observations:[{id:'qa',observation},{id:'qa',observation},{id:'other',observation}]});});
 assert.equal(quotes.length,1);assert.equal(quotes[0].amountIDR,886729);assert.equal(sent.targets[0].secret,undefined);
 assert.deepEqual(await externalHotelPrices({people:1},[target],env,Date.now()+10000,{},async()=>Response.json({observations:[{id:'qa',observation:{...observation,hotel:'Other'}}]})),[]);
 const diagnostics={};assert.deepEqual(await externalHotelPrices({people:1},[target],env,Date.now()+10000,diagnostics,async()=>Response.json({accessRequired:true,observations:[]})),[]);assert.equal(diagnostics.hotelAccessRequired,true);
});
test('service configuration and browser input cannot accept arbitrary destinations',()=>{
 assert.equal(externalHotelServiceConfigured(env),true);
 for(const url of ['http://hotel-service.example/v1/hotel-prices','https://127.0.0.1/v1/hotel-prices','https://hotel-service.example/v1/hotel-prices?token=x','https://user:pass@hotel-service.example/v1/hotel-prices'])assert.equal(externalHotelServiceConfigured({...env,HOTEL_PRICE_SERVICE_URL:url}),false);
 for(const t of [{...target,sourceUrl:'https://localhost/hotels/a-hotel-detail-1/b/'},{...target,checkin:'2026-02-30'},{...target,rooms:2}])assert.throws(()=>validateRequest({people:1,targets:[t]}));
 assert.throws(()=>createHotelServer({localOnly:false}));
});
test('local server rejects browser-origin calls and returns bounded validated search results',async()=>{
 let calls=0;
 const server=createHotelServer({collect:async()=>{calls++;return {observations:[{id:'qa',observation}],accessRequired:false};}});
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 const url='http://127.0.0.1:'+server.address().port+'/v1/hotel-prices';
 try{
  const post=(body,headers={})=>fetch(url,{method:'POST',headers:{'Content-Type':'application/json',...headers},body:JSON.stringify(body)});
  assert.equal((await post(input,{Origin:'https://evil.example'})).status,403);
  assert.equal((await post({people:1,targets:[{...target,sourceUrl:'https://evil.example/'}]})).status,400);
  assert.equal((await post(input)).status,200);assert.equal(calls,1);
  assert.equal((await post({x:'a'.repeat(13000)})).status,413);
 }finally{server.closeAllConnections();await new Promise(resolve=>server.close(resolve));}
});
test('server mode authenticates requests before invoking the browser',async()=>{
 let calls=0;
 const server=createHotelServer({localOnly:false,token:env.HOTEL_PRICE_SERVICE_TOKEN,collect:async()=>{calls++;return {observations:[]};}});
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 const url='http://127.0.0.1:'+server.address().port+'/v1/hotel-prices';
 try{
  const post=authorization=>fetch(url,{method:'POST',headers:{'Content-Type':'application/json',...(authorization?{Authorization:authorization}:{})},body:JSON.stringify(input)});
  assert.equal((await post()).status,401);assert.equal(calls,0);
  assert.equal((await post('Bearer wrong')).status,401);assert.equal(calls,0);
  assert.equal((await post('Bearer '+env.HOTEL_PRICE_SERVICE_TOKEN)).status,200);assert.equal(calls,1);
 }finally{server.closeAllConnections();await new Promise(resolve=>server.close(resolve));}
});
