import {useEffect,useRef,useState} from 'react';
import {Dialog,DialogContent,DialogTitle,DialogDescription} from '@/components/ui/dialog';
import {tr,locale} from './i18n';
import {money,addDays,type Item,type Trip} from './travel-data';
import {cityAt,cityById} from './cities';
import {activityContextKey,safeActivityOffer,type ActivityOffer} from './activity-selection';
import {boundedFetch} from './bounded-fetch';
import './activity-tickets.css';
export default function ActivityTickets({item,trip,onLink}:{item:Item;trip:Trip;onLink?:(offer:ActivityOffer,context:string,usePrice:boolean)=>void}){
 const context=activityContextKey(trip,item);
 const city=item.locationCity||cityById(item.cityId||'')?.name||cityAt(trip,item.day)?.name||trip.destinationMeta?.city||trip.destination;
 const initial=(item.place||item.title).slice(0,200);
 const [searchCity,setSearchCity]=useState(city);
 const [open,setOpen]=useState(false),[query,setQuery]=useState(initial),[results,setResults]=useState<ActivityOffer[]|null>(null),[busy,setBusy]=useState(false),[error,setError]=useState(''),[usePrice,setUsePrice]=useState(false);
 const request=useRef<AbortController|null>(null);
 useEffect(()=>{request.current?.abort();setOpen(false);setResults(null);setError('');setQuery(initial);setSearchCity(city);setUsePrice(false);setBusy(false);return()=>request.current?.abort();},[context]);
 function close(value:boolean){setOpen(value);if(!value){request.current?.abort();setBusy(false);}}
 async function search(){
  request.current?.abort();const controller=new AbortController();request.current=controller;setBusy(true);setError('');setResults(null);
  try{const response=await boundedFetch('/api/activities?'+new URLSearchParams({search:query.trim(),city:searchCity.trim(),count:'6'}),{signal:controller.signal});const b=await response.json();
   if(b.code==='VIATOR_DESTINATION_REQUIRED')throw Error('activity_city_error');
   if(!response.ok||b.environment!=='production'||!Array.isArray(b.products))throw Error(response.status===429?'activity_rate_limit':'activity_search_error');
   if(!controller.signal.aborted)setResults(b.products.map((p:unknown)=>({...p as object,checkedAt:b.fetchedAt})).filter(safeActivityOffer));
  }catch(e){if(!controller.signal.aborted)setError(e instanceof Error&&['activity_rate_limit','activity_city_error'].includes(e.message)?e.message:'activity_search_error');}finally{if(!controller.signal.aborted)setBusy(false);}
 }
 const selected=item.activityOffer?.contextKey===context&&safeActivityOffer(item.activityOffer)?item.activityOffer:null;
 return <div className="activity-tickets">
  {selected&&<div className="activity-ticket-linked"><span className="activity-ticket-provider">Viator</span><strong>{selected.title}</strong><span>{tr('activity_from',{price:money(selected.fromPrice)})}</span><small>{tr('activity_checked',{date:new Date(selected.checkedAt).toLocaleDateString(locale())})}</small><a className="item-booking" href={selected.bookingUrl} target="_blank" rel="noopener noreferrer sponsored">{tr('activity_book')}</a><small>{tr('activity_price_note')}</small></div>}
  {!item.paid&&onLink&&<button type="button" className="secondary" onClick={()=>{setQuery(initial);setOpen(true)}}>{tr(selected?'activity_change':'activity_find')}</button>}
  <Dialog open={open} onOpenChange={close}><DialogContent className="activity-ticket-dialog"><DialogTitle>{tr('activity_title')}</DialogTitle><DialogDescription>{tr('activity_description',{name:item.title,date:addDays(trip.start,item.day-1)})}</DialogDescription>
   <form className="activity-ticket-search" onSubmit={e=>{e.preventDefault();void search();}}><label>{tr('activity_query')}<input required minLength={2} maxLength={200} value={query} onChange={e=>setQuery(e.target.value)}/></label><label>{tr('activity_city')}<input required minLength={2} maxLength={100} value={searchCity} onChange={e=>setSearchCity(e.target.value)}/></label><button type="submit" className="primary" disabled={busy||query.trim().length<2}>{tr(busy?'activity_loading':'activity_search')}</button></form>
   <p className="inline-note">{tr('activity_price_note')}</p>
   <label className="activity-ticket-estimate"><input type="checkbox" checked={usePrice} onChange={e=>setUsePrice(e.target.checked)}/><span>{tr('activity_use_estimate')}</span></label>
   {busy&&<p role="status">{tr('activity_loading')}</p>}{error&&<p role="alert">{tr(error)}</p>}
   {results?.length===0&&<p role="status">{tr('activity_empty')}</p>}
   <div className="activity-ticket-results">{results?.map(offer=><article key={offer.productCode}><div><span className="activity-ticket-provider">Viator</span><h3>{offer.title}</h3><p>{offer.description.slice(0,400)}</p></div><div className="activity-ticket-actions"><strong>{tr('activity_from',{price:money(offer.fromPrice)})}</strong><a href={offer.bookingUrl} target="_blank" rel="noopener noreferrer sponsored">{tr('activity_details')}</a><button type="button" className="primary" onClick={()=>{onLink?.(offer,context,usePrice);close(false);}}>{tr('activity_link')}</button></div></article>)}</div>
  </DialogContent></Dialog>
 </div>;
}
