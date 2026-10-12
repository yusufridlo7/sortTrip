// Fixed public search; never sends AI requests or modifies customer trips/quota.
const response=await fetch('http://127.0.0.1:8794/v1/hotel-prices',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({people:1,targets:[{id:'qa-public',category:'Penginapan',title:'Sleeping Lion Suites',sourceUrl:'https://id.trip.com/hotels/kuala-lumpur-hotel-detail-104384927/sleeping-lion-suites/',checkin:'2026-10-19',checkout:'2026-10-20',rooms:1}]})});
if(!response.ok){console.info('HOTEL_SMOKE_UNAVAILABLE');process.exitCode=1;}
else{
 const result=await response.json();
 const {checkedHotelQuote}=await import('../../worker/trip-hotel-browser.js');
 const target={id:'qa-public',title:'Sleeping Lion Suites',sourceUrl:'https://id.trip.com/hotels/kuala-lumpur-hotel-detail-104384927/sleeping-lion-suites/',checkin:'2026-10-19',checkout:'2026-10-20',rooms:1};
 const quotes=result.observations.map(x=>checkedHotelQuote(target,1,x.observation)).filter(Boolean);
 console.info(JSON.stringify({accepted:quotes.length,accessRequired:result.accessRequired===true,status:result.status,quotes:quotes.map(q=>({amountIDR:q.amountIDR,checkin:q.checkin,checkout:q.checkout,adults:q.adults,rooms:q.rooms,taxesIncluded:q.taxesIncluded}))}));
}
