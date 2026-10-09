import {flightAffiliateUrl} from './flight-affiliate';
import type {Item,Trip} from './travel-data';
import InfoNote from './info-note';
import {useState} from 'react';
import {fetchFlights} from './api-flights';
import {addDays,destinations,money,type SearchCriteria} from './travel-data';
export default function FlightBooking({item,trip}:{item:Item;trip:Trip}){
 const [offer,setOffer]=useState<{key:string;url:string;price:number}|null>(null),[busy,setBusy]=useState(false),[error,setError]=useState('');
 const from=item.fromCode||trip.flight?.originCode||trip.origin,to=item.toCode||trip.flight?.destinationCode||trip.destinationMeta?.code||destinations.find(d=>d.id===trip.destination)?.code;
 const date=item.travelDate||trip.start,end=addDays(trip.start,trip.days-1),oneWay=item.returnLeg||trip.journey==='oneway';const key=[from,to,date,end,oneWay].join('|');
 const url=flightAffiliateUrl(item,trip)||(offer?.key===key?offer.url:null);
 async function find(){
  if(!from||!to||busy)return;setBusy(true);setError('');
  const query:SearchCriteria={origin:from,destination:to,journey:oneWay?'oneway':'return',outFrom:date,outTo:date,backFrom:oneWay?date:end,backTo:oneWay?date:end,minDays:oneWay?1:trip.days,maxDays:oneWay?1:trip.days,people:trip.people,budget:trip.budget,scope:'all'};
  try{const result=await fetchFlights(query,new AbortController().signal);const found=result.flights.find(f=>flightAffiliateUrl({...item,bookingUrl:f.bookingUrl},{...trip,flight:undefined}));if(!found)throw Error('Belum ada harga tersimpan untuk rute/tanggal ini. Coba pencarian di menu Pesawat.');setOffer({key,url:found.bookingUrl,price:found.price});}catch{setError('Tiket belum ditemukan untuk rute/tanggal ini. Coba pencarian di menu Pesawat.');}finally{setBusy(false);}
 }
 return <div className="flight-booking-action">{url?<><a className="item-booking" href={url} target="_blank" rel="noopener noreferrer sponsored">Beli tiket pesawat ↗</a>{offer?.key===key&&<small>Hasil pencarian: {money(offer.price)} / dewasa · indikatif</small>}<InfoNote label="Informasi pembelian pesawat"><p>Tautan hasil penerbangan yang dipilih diteruskan utuh, termasuk rute, tanggal dan parameter penawaran dari penyedia. Data API menggunakan harga cache; pilihan atau harga dapat berubah. Sesuaikan jumlah penumpang dan bagasi. Integrasi ini belum menyediakan checkout langsung. Komisi mengikuti ketentuan affiliate. Harga hasil pencarian tidak mengganti anggaran itinerary otomatis.</p></InfoNote></>:<button type="button" className="item-booking" disabled={busy||!from||!to} onClick={find}>{busy?'Mencari tiket…':'Cari tiket pesawat'}</button>}{error&&<p role="alert">{error}</p>}</div>;
}
