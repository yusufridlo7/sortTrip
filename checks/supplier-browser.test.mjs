import {test} from 'node:test';
import assert from 'node:assert/strict';
import {openSupplierBrowser} from '../worker/supplier-browser.js';
import {browserHotelPrices,datedHotelUrl} from '../worker/trip-hotel-browser.js';
import {checkedTransportQuote,datedTransportUrl,transportRouteUrl,browserTransportPrices} from '../worker/transport-browser.js';
import {priceTargets,resolveTransportPages,researchPrices} from '../worker/price-research.js';

const route={id:'bus',category:'Transportasi',title:'Bus Johor Bahru → Melaka',mode:'bus',day:1,from:'Johor Bahru',to:'Melaka',travelDate:'2027-01-30',sourceUrl:'https://12go.asia/en/travel/johor-bahru/melaka'};
const fare='IDR 125,000\nTaxes included | passenger\nBook now';
const observation={url:datedTransportUrl(route,1),from:route.from,to:route.to,date:'Jan 30, 2027',travelers:'1 Traveler',currency:'IDR',offers:[{text:'Johor Bahru\n4h | Operator | Bus\nMelaka\n'+fare,fare}]};

test('each supplier operation gets an independent context and cleans up even when context fails',async()=>{
 const contexts=[],closed=[];let launches=0;
 const launch=async()=>{const id=++launches;return {newContext:async options=>{assert.deepEqual(options,{locale:'en-US'});const ctx={id,close:async()=>closed.push('context'+id)};contexts.push(ctx);return ctx;},close:async()=>closed.push('browser'+id)};};
 const a=await openSupplierBrowser({},launch),b=await openSupplierBrowser({},launch);
 assert.notEqual(a.context,b.context);await a.close();await b.close();assert.deepEqual(closed,['context1','browser1','context2','browser2']);
 let browserClosed=false;await assert.rejects(openSupplierBrowser({},async()=>({newContext:async()=>{throw Error('fixture');},close:async()=>{browserClosed=true;}})));assert.equal(browserClosed,true);
});
test('dated transport accepts only exact visible search context and ticket basis, rejecting taxi or stale dates',()=>{
 const quote=checkedTransportQuote(route,1,observation);assert.equal(quote.amountIDR,125000);assert.equal(quote.scope,'dated');assert.equal(quote.travelDate,route.travelDate);
 assert.equal(checkedTransportQuote(route,1,{...observation,to:'Malacca'}).amountIDR,125000);
 assert.equal(checkedTransportQuote({...route,from:'Larkin Sentral'},1,observation),null);
 for(const invalid of [{...observation,date:'Feb 5, 2027'},{...observation,to:'Singapore'},{...observation,travelers:'2 Travelers'},{...observation,currency:'USD'},{...observation,url:datedTransportUrl({...route,travelDate:'2027-01-31'},1)},{...observation,offers:[{text:'Taxi '+fare,fare}]},{...observation,offers:[{text:'Bus '+fare,fare:fare.replace('passenger','vehicle, all incl.')}]},{...observation,offers:[{text:'Bus '+fare,fare:fare.replace('Taxes included','Taxes extra')}]},{...observation,offers:[{text:'Bus starting from IDR 125,000',fare:'From IDR 125,000'}]}])assert.equal(checkedTransportQuote(route,1,invalid),null);
 assert.equal(datedTransportUrl(route,2),null);assert.equal(datedTransportUrl({...route,mode:'taxi',title:'Taxi'},1),null);
 assert.equal(transportRouteUrl('https://12go.asia/en/login'),null);assert.equal(transportRouteUrl('https://12go.asia.evil.test/en/travel/a/b'),null);
 assert.equal(priceTargets([route],3)[0].sourceUrl,route.sourceUrl);
});
test('12Go route resolution requires a cited public route URL, not a model-only guess',async()=>{
 const target={...route,sourceUrl:null};
 const response=sources=>async()=>Response.json({status:'completed',output:[{action:{sources},content:[{type:'output_text',text:JSON.stringify({routes:[{id:route.id,url:route.sourceUrl}]})}]}]});
 assert.equal((await resolveTransportPages([target],{},response([{url:route.sourceUrl}])))[0].sourceUrl,route.sourceUrl);
 assert.equal((await resolveTransportPages([target],{},response([])))[0].sourceUrl,null);
});

function fixtureLaunch(observed,fail=false){
 const events=[];const locator={waitFor:async()=>{if(fail)throw Error('not rendered');},first(){return this;},getByText(){return this;},filter(){return this;},click:async()=>{}};
 const page={setDefaultTimeout(){},route:async()=>{},goto:async()=>({status:()=>200}),mainFrame:()=>({}),getByRole:()=>locator,getByText:()=>locator,locator:()=>locator,evaluate:async fn=>String(fn).startsWith("()=>/captcha")?false:observed,close:async()=>events.push('page closed')};
 const launch=async()=>({newContext:async()=>({newPage:async()=>page,close:async()=>events.push('context closed')}),close:async()=>events.push('browser closed')});
 return {launch,events};
}
test('browser adapters return only validated prices and clean up unavailable searches',async()=>{
 const env={HOTEL_BROWSER_ENABLED:'true',HOTEL_BROWSER:{}},transport=fixtureLaunch(observation);
 assert.equal((await browserTransportPrices({people:1},[route],env,Date.now()+30000,{},transport.launch))[0].amountIDR,125000);
 assert.deepEqual(transport.events,['page closed','context closed','browser closed']);
 const hotel={id:'hotel',title:'Hotel Name',category:'Penginapan',checkin:'2027-01-30',checkout:'2027-02-01',rooms:1,sourceUrl:'https://www.trip.com/hotels/singapore-hotel-detail-1729952/cube-boutique-capsule-hotel-kampong-glam/'};
 const failing=fixtureLaunch({},true);assert.deepEqual(await browserHotelPrices({people:1},[hotel],env,Date.now()+30000,{},failing.launch),[]);assert.deepEqual(failing.events,['page closed','context closed','browser closed']);
 const valid=fixtureLaunch({url:datedHotelUrl(hotel,1),hotel:'Hotel Name',guests:'1 room, 1 adult, 0 children',nights:2,offers:[{roomType:'Room',text:'1 adult\nNon-refundable\nTotal (incl. taxes & fees): IDR 600,000'}]});
 assert.equal((await browserHotelPrices({people:1},[hotel],env,Date.now()+30000,{},valid.launch))[0].amountIDR,600000);
});
test('browser mode does not replace unavailable tickets with indexed starting prices',async()=>{
 let providerCalls=0;const failing=fixtureLaunch({},true);
 const result=await researchPrices({people:1,start:'2027-01-30'},[route],{HOTEL_BROWSER_ENABLED:'true',HOTEL_BROWSER:{}},async()=>{providerCalls++;throw Error('must not research reference prices');},Date.now()+30000,{},failing.launch);
 assert.deepEqual(result,[]);assert.equal(providerCalls,0);
});
