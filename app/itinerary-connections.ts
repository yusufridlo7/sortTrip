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
 const airportCode=trip.flight?.destinationCode;
 const arrival=trip.flight&&airportCode&&(trip.flight.arrivalDay||0)===day-1;
 const departure=trip.flight&&airportCode&&trip.journey!=='oneway'&&trip.flight.returnAt?.slice(0,10)===date;
 const airport:Item|undefined=airportCode?{id:'airport-'+day,category:'Transportasi',title:airportCode,place:airportCode,price:0,paid:false,day,time:'',note:''}:undefined;
 const start=arrival?airport:stayAt(day===1?date:addDays(date,-1)),end=departure?airport:stayAt(date);
 const visits=trip.items.filter(x=>x.day===day&&x.category==='Wisata').sort((a,b)=>a.time.localeCompare(b.time));
 const stops=[...(start?[start]:[]),...visits,...(end&&(visits.length||start&&start.id!==end.id)?[end]:[])];
 return stops.slice(1).flatMap((item,i)=>{const from=name(stops[i]),to=name(item);return from.toLowerCase()===to.toLowerCase()?[]:[{from,to,targetId:item.id,day,returnToStay:item===end&&item.category==='Penginapan'&&i===stops.length-2}];});
}
