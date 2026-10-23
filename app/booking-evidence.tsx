import {createContext,useContext,useEffect,useRef,useState,type ReactNode} from 'react';
import {supabase} from './supabase';
import {tr} from './i18n';
import type {Trip} from './travel-data';
import {bookingItemKey} from '../worker/booking-identity.mjs';
import type {BookingReceipt} from './booking-receipts';
const Context=createContext<{receipts:BookingReceipt[];panel?:ReactNode}>({receipts:[]});
export function BookingSyncPanel(){return <>{useContext(Context).panel}</>;}
export const useBookingEvidence=()=>useContext(Context);
export async function bookingRequest(action:string,body:unknown,signal?:AbortSignal){
 if(!supabase)throw Error('booking_login');const {data}=await supabase.auth.getSession();if(!data.session)throw Error('booking_login');
 const r=await fetch('/api/bookings/'+action,{method:'POST',headers:{Authorization:'Bearer '+data.session.access_token,'Content-Type':'application/json'},body:JSON.stringify(body),signal:signal?AbortSignal.any([signal,AbortSignal.timeout(45000)]):AbortSignal.timeout(45000)});
 const result=await r.json();if(!r.ok)throw Error(result.error||'booking_unavailable');return result;
}
export default function BookingEvidenceProvider({trip,userId,active,onResolved,children}:{trip:Trip|null;userId?:string;active:boolean;onResolved:(receipts:BookingReceipt[])=>void;children:ReactNode}){
 const [receipts,setReceipts]=useState<BookingReceipt[]>([]),[busy,setBusy]=useState(false),[error,setError]=useState(''),[availability,setAvailability]=useState<Record<string,string>>({});
 const latest=useRef(onResolved);latest.current=onResolved;const controller=useRef<AbortController|null>(null),last=useRef(0),inFlight=useRef(false);
 const scope=trip?JSON.stringify([userId,trip.id,trip.items.map(item=>bookingItemKey(trip,item))]):'';
 async function load(refresh=false){if(!trip?.id||!userId||inFlight.current)return;inFlight.current=true;controller.current?.abort();const request=new AbortController();controller.current=request;setBusy(true);setError('');last.current=Date.now();try{const data=await bookingRequest('status',{tripId:trip.id,refresh},request.signal);if(request.signal.aborted)return;const rows=(Array.isArray(data.receipts)?data.receipts:[]).filter((r:BookingReceipt)=>r&&r.tripId===trip.id&&typeof r.matchKey==='string'&&['LiteAPI','Travelpayouts'].includes(r.provider)&&['confirmed','reported','pending','cancelled'].includes(r.state));setReceipts(rows);setAvailability(data.availability||{});latest.current(rows);}catch(e){if(!request.signal.aborted)setError(e instanceof Error?e.message:'booking_unavailable');}finally{if(controller.current===request){inFlight.current=false;if(!request.signal.aborted)setBusy(false);}}}
 useEffect(()=>{inFlight.current=false;setReceipts([]);setError('');setAvailability({});setBusy(false);if(active&&trip?.id&&userId)void load();return()=>{controller.current?.abort();inFlight.current=false;};},[scope,active]);
 useEffect(()=>{const focus=()=>{if(active&&Date.now()-last.current>60000)void load(true);};window.addEventListener('focus',focus);return()=>window.removeEventListener('focus',focus);},[scope,active,busy]);
 const panel=active&&trip&&<section className="booking-sync-panel" data-hotel-status={availability.hotels} data-flight-status={availability.flights} data-hotel-http={availability.hotelHttpStatus} data-flight-http={availability.flightHttpStatus} data-flight-fields={availability.flightFields} data-flight-schema={availability.flightSchema} data-flight-fields-http={availability.flightFieldsHttp} data-flight-query-issue={availability.flightQueryIssue} aria-label={tr('booking_sync_label')}><p>{tr('booking_sync_explanation')}</p>{!trip.id?<small>{tr('booking_save_first')}</small>:userId?<><button type="button" className="secondary" disabled={busy} onClick={()=>void load(true)}>{tr(busy?'booking_sync_loading':'booking_sync_action')}</button>{error&&<p role="status">{tr(error)===error?tr('booking_unavailable'):tr(error)}</p>}{availability.flights==='available'&&<small>{tr(receipts.some(r=>r.provider==='Travelpayouts')?'booking_flight_report_checked':'booking_flight_no_match')}</small>}{['unavailable','access_required','rate_limited'].includes(availability.flights)&&<small>{tr('booking_flight_status_unavailable')}</small>}{Object.values(availability).some(v=>['unavailable','partial','marker_required','not_configured','access_required','rate_limited'].includes(v))&&<small>{tr('booking_sync_partial')}</small>}</>:<small>{tr('booking_login')}</small>}</section>;
 return <Context.Provider value={{receipts,panel}}>{children}</Context.Provider>;
}
