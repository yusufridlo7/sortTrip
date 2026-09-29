import {addDays,makeTrip,type SearchCriteria,type Trip,destinations,type Flight} from './travel-data';
export type ApiFlight={id:string;destinationId:string;origin:string;destination:string;start:string;end:string;days:number;price:number;airline:string;flightNumber:string;departureAt:string;returnAt:string|null;durationTo:number|null;durationBack:number|null;transfers:number|null;bookingUrl:string};
export type FlightResponse={flights:ApiFlight[];fetchedAt:string;partial:boolean;limited:boolean};
export async function fetchFlights(q:SearchCriteria,signal:AbortSignal):Promise<FlightResponse>{
 const p=new URLSearchParams();for(const k of ['origin','destination','outFrom','outTo','backFrom','backTo','minDays','maxDays'] as const)p.set(k,String(q[k]));p.set('journey',q.journey||'return');
 const r=await fetch('/api/flights?'+p,{signal});
 if(!r.headers.get('Content-Type')?.includes('application/json'))throw Error('Server API belum berjalan. Gunakan versi Cloudflare terbaru atau jalankan Worker lokal sesuai panduan.');
 const result=await r.json();if(!r.ok)throw Error(result.error||'Pencarian gagal.');if(!Array.isArray(result.flights))throw Error('Respons API tidak valid.');return result;
}
export function apiTime(value:string,zone:string){return new Intl.DateTimeFormat('id-ID',{timeZone:zone,hour:'2-digit',minute:'2-digit',hourCycle:'h23'}).format(new Date(value)).replace('.',':');}
function arrival(value:string,duration:number|null,zone:string){return duration?apiTime(new Date(Date.parse(value)+duration*60000).toISOString(),zone):'--:--';}
export function apiTrip(f:ApiFlight,q:SearchCriteria):Trip {
 const d=destinations.find(d=>d.id===f.destinationId)!;
 const oz=f.origin==='DPS'?'Asia/Makassar':'Asia/Jakarta',dz=f.destinationId==='bkk'?'Asia/Bangkok':'Asia/Singapore';
 const flight:Flight={id:f.id,source:'aviasales',bookingUrl:f.bookingUrl,originCode:f.origin,destinationCode:f.destination,departureAt:f.departureAt,returnAt:f.returnAt||undefined,oneWay:!f.returnAt,airline:f.airline,price:f.price,depart:apiTime(f.departureAt,oz),arrive:arrival(f.departureAt,f.durationTo,dz),returnDepart:f.returnAt?apiTime(f.returnAt,dz):'--:--',returnArrive:f.returnAt?arrival(f.returnAt,f.durationBack,oz):'--:--',duration:f.durationTo||0,returnDuration:f.durationBack||0,stops:f.transfers??-1,arrivalDay:0,returnArrivalDay:0};
 const trip=makeTrip(d,q.origin,f.start,f.returnAt?f.days:q.minDays,q.people,q.budget,flight);
 return {...trip,items:trip.items.map(item=>item.id==='flight'?{...item,title:`${f.origin} → ${f.destination} · ${f.returnAt?'pulang-pergi':'sekali jalan'}`,provider:'Aviasales',bookingUrl:f.bookingUrl,note:'Harga indikatif dari Aviasales Data API per dewasa; bukan harga terkunci. Tautan untuk 1 dewasa. Cek penumpang, bagasi, jadwal, dan harga akhir di penyedia.'}:item)};
}
