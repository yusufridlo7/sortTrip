// Local-only fixed public fixture. This entrypoint is never part of production routes.
import {browserHotelPrices} from '../worker/trip-hotel-browser.js';
export default {async fetch(request,env){
 const diagnostics={};
 const quotes=await browserHotelPrices({people:1},[{id:'qa-public-hotel',title:'Sleeping Lion Suites',category:'Penginapan',sourceUrl:'https://id.trip.com/hotels/kuala-lumpur-hotel-detail-104384927/sleeping-lion-suites/',checkin:'2026-10-19',checkout:'2026-10-20',rooms:1}],{HOTEL_BROWSER_ENABLED:'true',HOTEL_BROWSER:env.HOTEL_BROWSER},Date.now()+45000,diagnostics);
 return Response.json({accepted:quotes.length,accessRequired:!!diagnostics.hotelAccessRequired,quotes:quotes.map(q=>({amountIDR:q.amountIDR,checkin:q.checkin,checkout:q.checkout,rooms:q.rooms,adults:q.adults,taxesIncluded:q.taxesIncluded}))});
}};
