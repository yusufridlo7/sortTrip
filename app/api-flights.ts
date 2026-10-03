import {addDays,makeTrip,type SearchCriteria,type Trip,destinations,type Flight} from './travel-data';
export type ApiFlight={city?:string;country?:string;countryCode?:string;cityCode?:string;destinationZone?:string|null;id:string;destinationId:string;origin:string;destination:string;start:string;end:string;days:number;price:number;airline:string;flightNumber:string;departureAt:string;returnAt:string|null;durationTo:number|null;durationBack:number|null;transfers:number|null;bookingUrl:string};
export type FlightResponse={flights:ApiFlight[];fetchedAt:string;partial:boolean;limited:boolean;nextPage?:number|null};
export async function fetchFlights(q:SearchCriteria,signal:AbortSignal,page=1):Promise<FlightResponse>{
 const p=new URLSearchParams();for(const k of ['origin','destination','outFrom','outTo','backFrom','backTo','minDays','maxDays'] as const)p.set(k,String(q[k]));p.set('journey',q.journey||'return');
 p.set('page',String(page));p.set('scope',q.scope||'international');
 const r=await fetch('/api/flights?'+p,{signal:AbortSignal.any([signal,AbortSignal.timeout(20000)])});
 if(!r.headers.get('Content-Type')?.includes('application/json'))throw Error('Server API belum berjalan. Gunakan versi Cloudflare terbaru atau jalankan Worker lokal sesuai panduan.');
 const result=await r.json();if(!r.ok)throw Error(result.error||'Pencarian gagal.');if(!Array.isArray(result.flights))throw Error('Respons API tidak valid.');return result;
}
export function apiTime(value:string,zone:string){return new Intl.DateTimeFormat('id-ID',{timeZone:zone,hour:'2-digit',minute:'2-digit',hourCycle:'h23'}).format(new Date(value)).replace('.',':');}
function arrival(value:string,duration:number|null,zone:string){return duration?apiTime(new Date(Date.parse(value)+duration*60000).toISOString(),zone):'--:--';}
function arrivalOffset(value:string,duration:number|null,zone:string,start:string){
 if(!duration)return 0;
 const date=new Intl.DateTimeFormat('en-CA',{timeZone:zone,year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date(Date.parse(value)+duration*60000));
 return Math.round((Date.parse(date)-Date.parse(start))/86400000);
}
export function apiTrip(f:ApiFlight,q:SearchCriteria):Trip {
 const d=destinations.find(d=>d.id===f.destinationId);
 const oz=f.origin==='DPS'?'Asia/Makassar':'Asia/Jakarta',dz=f.destinationZone||(f.destinationId==='bkk'?'Asia/Bangkok':d?'Asia/Singapore':'UTC');
 const flight:Flight={id:f.id,source:'aviasales',bookingUrl:f.bookingUrl,originCode:f.origin,destinationCode:f.destination,departureAt:f.departureAt,returnAt:f.returnAt||undefined,oneWay:!f.returnAt,airline:f.airline,price:f.price,depart:apiTime(f.departureAt,oz),arrive:f.destinationZone||d?arrival(f.departureAt,f.durationTo,dz):'--:--',returnDepart:f.returnAt?apiTime(f.returnAt,dz):'--:--',returnArrive:f.returnAt?arrival(f.returnAt,f.durationBack,oz):'--:--',duration:f.durationTo||0,returnDuration:f.durationBack||0,stops:f.transfers??-1,arrivalDay:arrivalOffset(f.departureAt,f.durationTo,dz,f.start),returnArrivalDay:f.returnAt?arrivalOffset(f.returnAt,f.durationBack,oz,f.end):0};
 const trip:Trip=d?makeTrip(d,q.origin,f.start,f.returnAt?f.days:q.minDays,q.people,q.budget,flight):{destination:f.destinationId,destinationMeta:{city:f.city||f.destination,country:f.country||'Negara belum diketahui',code:f.destination},estimateIncomplete:true,origin:q.origin,start:f.start,days:f.returnAt?f.days:q.minDays,people:q.people,budget:q.budget,journey:f.returnAt?'return':'oneway',flight,version:2,items:[{id:'flight',category:'Pesawat',title:'Penerbangan',price:f.price,paid:false,day:1,time:flight.depart,note:''}]};
 return {...trip,items:trip.items.map(item=>item.id==='flight'?{...item,title:`${f.origin} → ${f.destination} · ${f.returnAt?'pulang-pergi':'sekali jalan'}`,provider:'Aviasales',bookingUrl:f.bookingUrl,note:'Harga indikatif dari Aviasales Data API per dewasa; bukan harga terkunci. Tautan untuk 1 dewasa. Cek penumpang, bagasi, jadwal, dan harga akhir di penyedia.'}:item)};
}
