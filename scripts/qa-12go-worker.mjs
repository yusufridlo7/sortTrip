// Fixed read-only QA cases. Never installed in the production Worker router.
import {browserTransportPrices} from '../worker/transport-browser.js';
export default {async fetch(request,env){
 const diagnostics={};
 const target={id:'qa-12go-kl-melaka',category:'Transportasi',title:'Bus Kuala Lumpur to Melaka',from:'Kuala Lumpur',to:'Melaka',mode:'bus',travelDate:'2026-11-06',sourceUrl:'https://12go.asia/en/travel/kuala-lumpur/malacca'};
 const started=Date.now();
 const quotes=await browserTransportPrices({people:1},[target],{HOTEL_BROWSER_ENABLED:'true',HOTEL_BROWSER:env.HOTEL_BROWSER},Date.now()+40000,diagnostics);
 return Response.json({route:{from:target.from,to:target.to,date:target.travelDate,adults:1,mode:'bus'},elapsedMs:Date.now()-started,accepted:quotes.length,diagnostics,quotes:quotes.map(q=>({provider:q.provider,amountIDR:q.amountIDR,basis:q.basis,scope:q.scope,travelDate:q.travelDate,adults:q.adults,taxesIncluded:q.taxesIncluded,checkedAt:q.checkedAt,sourceUrl:q.sourceUrl}))});
}};
