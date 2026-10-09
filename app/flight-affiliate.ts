import type {Item,Trip} from './travel-data';
export function flightAffiliateUrl(item:Item,trip:Trip){
 if(item.category!=='Pesawat')return null;
 const candidates=[item.bookingUrl,...(item.id==='flight'&&!item.returnLeg&&trip.flight?.source==='aviasales'?[trip.flight.bookingUrl]:[])];
 for(const value of candidates){try{if(!value)continue;const u=new URL(value);if(u.origin==='https://www.aviasales.com'&&u.pathname.startsWith('/search/')&&!u.username&&!u.password)return u.href;}catch{}}
 return null;
}
