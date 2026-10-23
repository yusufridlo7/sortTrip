// Shared public identity only. Never use a client-supplied status as evidence.
export function bookingItemKey(trip,item){
 if(!item||!trip||!Number.isInteger(trip.people))return null;
 if(item.category==='Penginapan'&&item.provider==='LiteAPI'&&item.hotelId&&item.checkin&&item.checkout)return JSON.stringify(['hotel',item.id,item.hotelId,item.checkin,item.checkout,trip.people]);
 if(item.category==='Pesawat'){
  const url=flightSourceUrl(trip,item);if(!url)return null;
  return JSON.stringify(['flight',item.id,item.title,item.time,item.id==='flight'?trip.flight?.id:null,url,item.fromCode||trip.flight?.originCode||trip.origin,item.toCode||trip.flight?.destinationCode||trip.destinationMeta?.code||trip.destination,item.travelDate||trip.start,item.returnLeg||trip.journey==='oneway'?'':trip.flight?.returnAt||trip.days,trip.people]);
 }
 return null;
}
export function flightSourceUrl(trip,item){
 for(const value of [item?.bookingUrl,...(item?.id==='flight'&&!item.returnLeg?[trip?.flight?.bookingUrl]:[])])try{const u=new URL(value);if(u.origin==='https://www.aviasales.com'&&u.pathname.startsWith('/search/')&&!u.username&&!u.password)return u.href;}catch{}
 return null;
}
