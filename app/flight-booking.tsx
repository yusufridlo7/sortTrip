import {bookingRequest} from './booking-evidence';
import {bookingItemKey} from '../worker/booking-identity.mjs';
import {tr,label as localize,locale} from './i18n';
import {flightAffiliateUrl} from './flight-affiliate';
import type {Item,Trip} from './travel-data';
import InfoNote from './info-note';
import {useState} from 'react';
import {fetchFlights} from './api-flights';
import {addDays,destinations,money,type SearchCriteria} from './travel-data';
export default function FlightBooking({item,trip,onChangeFlight}:{item:Item;trip:Trip;onChangeFlight?:()=>void}){
 const [tracked,setTracked]=useState<{key:string;url:string}|null>(null),[trackingError,setTrackingError]=useState('');
 const [offer,setOffer]=useState<{key:string;url:string;price:number}|null>(null),[busy,setBusy]=useState(false),[error,setError]=useState('');
 const from=item.fromCode||trip.flight?.originCode||trip.origin,to=item.toCode||trip.flight?.destinationCode||trip.destinationMeta?.code||destinations.find(d=>d.id===trip.destination)?.code;
 const date=item.travelDate||trip.start,end=addDays(trip.start,trip.days-1),oneWay=item.returnLeg||trip.journey==='oneway';const key=[from,to,date,end,oneWay].join('|');
 const url=flightAffiliateUrl(item,trip)||(offer?.key===key?offer.url:null);
 const trackingKey=JSON.stringify([trip.id,item.id,bookingItemKey(trip,item)]);
 async function prepare(){if(!trip.id||!url||busy)return;setBusy(true);setTrackingError('');try{const result=await bookingRequest('flight-link',{tripId:trip.id,itemId:item.id,matchKey:bookingItemKey(trip,item)});setTracked({key:trackingKey,url:result.url});}catch(e){setTrackingError(e instanceof Error?e.message:'booking_tracking_unavailable');}finally{setBusy(false);}}
 async function find(){
  if(!from||!to||busy)return;setBusy(true);setError('');
  const query:SearchCriteria={origin:from,destination:to,journey:oneWay?'oneway':'return',outFrom:date,outTo:date,backFrom:oneWay?date:end,backTo:oneWay?date:end,minDays:oneWay?1:trip.days,maxDays:oneWay?1:trip.days,people:trip.people,budget:trip.budget,scope:'all'};
  try{const result=await fetchFlights(query,new AbortController().signal);const found=result.flights.find(f=>flightAffiliateUrl({...item,bookingUrl:f.bookingUrl},{...trip,flight:undefined}));if(!found)throw Error(tr('ui_0240'));setOffer({key,url:found.bookingUrl,price:found.price});}catch{setError(tr('ui_0241'));}finally{setBusy(false);}
 }
 return <div className="flight-booking-action">{url?<><>{trip.id&&!trackingError&&tracked?.key!==trackingKey?<button type="button" className="item-booking" disabled={busy} onClick={()=>void prepare()}>{tr(busy?'booking_link_loading':'booking_link_prepare')}</button>:<a className="item-booking" href={tracked?.key===trackingKey?tracked.url:url} target="_blank" rel="noopener noreferrer sponsored">{tr('ui_0242')}</a>}{trackingError&&<small role="status">{tr(trackingError)===trackingError?tr('booking_tracking_unavailable'):tr(trackingError)}</small>}{!trip.id&&<small>{tr('booking_save_first')}</small>}</>{offer?.key===key&&<small>{tr('ui_0243')+' '}{money(offer.price)}{' '+tr('unit_4')+' '}</small>}<InfoNote label={tr('ui_0244')}><p>{tr('ui_0245')}</p></InfoNote></>:<button type="button" className="item-booking" disabled={busy||!from||!to} onClick={find}>{busy?tr('ui_0246'):tr('ui_0247')}</button>}{error&&<p role="alert">{localize(error)}</p>}</div>;
}
