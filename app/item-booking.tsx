import {tr,label as localize,locale} from './i18n';
import BookingStatus from './booking-status';
import FlightBooking from './flight-booking';
import {transportLegLink,transportAffiliateHome} from './transport-affiliate.mjs';
import {hotelAffiliateLink,partnerTripKey,type PartnerContext} from './partner-selection';
import {cityAt,cityById} from './cities';
import {type Item,type Trip,mapLink,addDays} from './travel-data';
import InfoNote from './info-note';
function BookingActions({item,trip,onSearch,onChangeFlight}:{item:Item;trip:Trip;onChangeFlight?:()=>void;onSearch?:(kind:'hotels'|'transport',context:PartnerContext)=>void}){
 const city=item.locationCity||cityById(item.cityId||'')?.name||cityAt(trip,item.day)?.name||trip.destinationMeta?.city||trip.destination;
 const date=item.travelDate||addDays(trip.start,item.day-1);
 if(item.category==='Pesawat')return <FlightBooking item={item} trip={trip} onChangeFlight={onChangeFlight}/>;
 if(item.category==='Penginapan')return <div className="partner-booking-options"><a className="item-booking" href={hotelAffiliateLink(item).url} target="_blank" rel="noopener noreferrer sponsored">{hotelAffiliateLink(item).specific?tr('ui_0430'):tr('ui_0431')}</a>{onSearch&&<button type="button" className="secondary" onClick={()=>onSearch('hotels',{name:item.title,to:city,date:item.checkin||date,checkOut:item.checkout||addDays(trip.start,trip.days-1),replaceId:item.id,tripKey:partnerTripKey(trip)})}>{tr('ui_0432')}</button>}<InfoNote label={tr('ui_0433')}><p>{tr('ui_0434')+' '}{item.title}. {hotelAffiliateLink(item).specific?tr('ui_0435'):tr('ui_0436')}{' '+tr('ui_0437')}</p></InfoNote></div>;
 if(item.category==='Transportasi'){
  const selected=item.routeOptions?.[item.selectedRoute||0];
  const canReplaceWholeRoute=!selected||selected.legs.length===1;
  const legs=selected?selected.legs.filter(l=>/bus|bis|coach|kereta|train|rail|ferry|feri|shuttle/i.test(l.mode)):[{fromPlace:cityById(item.fromCity||'')?.name||item.fromPlace||'',toPlace:cityById(item.toCity||'')?.name||item.toPlace||'',mode:item.mode||''}].filter(l=>l.fromPlace&&l.toPlace);
  if(!legs.length)return onSearch?<button type="button" className="secondary" onClick={()=>onSearch('transport',{name:item.title,date,from:item.fromPlace,to:item.toPlace,replaceId:item.id,tripKey:partnerTripKey(trip)})}>{tr('ui_0438')}</button>:null;
  return <div className="partner-booking-options">{legs.map((leg,i)=>{const url=transportLegLink(leg,date,trip.people);return <div key={i}><small>{leg.fromPlace} → {leg.toPlace}</small>{url&&<a className="item-booking" href={url} target="_blank" rel="noopener noreferrer sponsored">{tr('ui_0439')}</a>}{onSearch&&<button type="button" className="secondary" onClick={()=>onSearch('transport',{name:leg.mode||item.title,date,from:leg.fromPlace,to:leg.toPlace,replaceId:canReplaceWholeRoute?item.id:undefined,tripKey:partnerTripKey(trip)})}>{tr('ui_0438')}</button>}{!url&&!onSearch&&<a className="item-booking" href={transportAffiliateHome} target="_blank" rel="noopener noreferrer sponsored">{tr('ui_0440')}</a>}</div>})}<InfoNote label={tr('ui_0441')}><p>{tr('ui_0442')}</p></InfoNote></div>;
 }
 return item.category==='Wisata'?<a className="item-booking subtle" href={mapLink(item.place||item.title,city)} target="_blank" rel="noopener noreferrer">{tr('ui_0443')}</a>:null;
}

export default function ItemBooking({item,trip,onSearch,onPaidChange,onChangeFlight}:{item:Item;trip:Trip;onChangeFlight?:()=>void;onSearch?:(kind:'hotels'|'transport',context:PartnerContext)=>void;onPaidChange?:(paid:boolean)=>void}){
 return <div className="item-booking-group"><BookingStatus item={item} onChange={onPaidChange}/>{item.priceQuote&&<div className="price-reference"><span>{item.priceQuote.scope==='dated'?tr('ui_0444'):tr('ui_0445')} {item.priceQuote.provider} · {new Date(item.priceQuote.checkedAt).toLocaleDateString(locale())}</span><a href={item.priceQuote.sourceUrl} target="_blank" rel="noopener noreferrer">{tr('ui_0446')}</a><small>{item.priceQuote.scope==='dated'?tr('ui_0447',{v0:(item.priceQuote.checkin),v1:(item.priceQuote.checkout),v2:(item.priceQuote.adults),v3:(item.priceQuote.roomType),v4:(item.priceQuote.policy)}):tr('ui_0448',{v0:(item.category==='Penginapan'?` Asumsi ${Math.ceil(trip.people/2)} kamar, maksimal 2 orang/kamar.`:'')})}</small></div>}{item.routePriceQuotes?.map(q=><div className="price-reference" key={q.id}><span>{tr('ui_0449')+' '}{new Date(q.checkedAt).toLocaleDateString(locale())}</span><a href={q.sourceUrl} target="_blank" rel="noopener noreferrer">{tr('ui_0450')}</a><small>{q.quote}{' '+tr('ui_0451')}</small></div>)}<BookingActions item={item} trip={trip} onSearch={onSearch} onChangeFlight={onChangeFlight}/></div>;
}
