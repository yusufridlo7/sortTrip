import {type Trip,type Item,addDays} from './travel-data';
import {cityAt,cityById} from './cities';
export type ItineraryConnection={from:string;to:string;targetId:string;day:number;returnToStay:boolean};
export function itineraryConnections(trip:Trip,day:number):ItineraryConnection[]{
 const date=addDays(trip.start,day-1);
 const stayAt=(date:string)=>trip.items.find(x=>x.category==='Penginapan'&&(x.checkin||addDays(trip.start,x.day-1))<=date&&(x.checkout||addDays(trip.start,x.day))>date);
 const city=(item:Item)=>item.locationCity||cityById(item.cityId||'')?.name||cityAt(trip,day)?.name||trip.destinationMeta?.city||trip.destination;
 // A supplied address/location may already name an excursion city. Do not
 // append the overnight base (e.g. "Genting Highlands, Kuala Lumpur").
 const name=(item:Item)=>{const place=item.place||item.title;return place.includes(',')?place:place+', '+city(item);};
 const start=stayAt(day===1?date:addDays(date,-1)),end=stayAt(date);
 const visits=trip.items.filter(x=>x.day===day&&x.category==='Wisata').sort((a,b)=>a.time.localeCompare(b.time));
 const stops=[...(start?[start]:[]),...visits,...(end&&visits.length?[end]:[])];
 return stops.slice(1).flatMap((item,i)=>{const from=name(stops[i]),to=name(item);return from.toLowerCase()===to.toLowerCase()?[]:[{from,to,targetId:item.id,day,returnToStay:item===end&&i===stops.length-2}];});
}
