import {receiptFor} from './booking-receipts';
import {useBookingEvidence} from './booking-evidence';
import {tr} from './i18n';
import {CheckCircle2,Circle} from 'lucide-react';
import type {Item,Trip} from './travel-data';
import {useNarrative} from './i18n/narratives';
export default function BookingStatus({item,trip,onChange}:{item:Item;trip:Trip;onChange?:(paid:boolean)=>void}){
 const narrative=useNarrative(),{receipts}=useBookingEvidence();
 const receipt=receiptFor(trip,item,receipts);
 if(receipt?.state==='confirmed'&&receipt.provider==='LiteAPI')return <span className="booking-status is-paid" title={tr('booking_confirmed_help')}><CheckCircle2 size={16}/>{tr('booking_confirmed')}</span>;
 const status=receipt?.state==='reported'?'booking_reported':receipt?.state==='pending'?'booking_pending':receipt?.state==='cancelled'?'booking_cancelled':null;
 if(!status&&!onChange&&!item.paid)return null;
 const label=item.paid?tr(item.purchaseSource==='provider'?'booking_verification_unknown':'booking_manual'):tr('ui_0081');
 return <div className="booking-status-group">{status&&<span className={'booking-status '+(receipt?.state==='cancelled'?'is-cancelled':'')} title={tr(status+'_help')}>{tr(status)}</span>}{onChange?<button type="button" className={'booking-status '+(item.paid?'is-paid':'')} aria-pressed={item.paid} aria-label={(item.paid?tr('ui_0082'):tr('ui_0083'))+' '+narrative(item.title)} title={tr('ui_0084')} onClick={()=>onChange(!item.paid)}>{item.paid?<CheckCircle2 size={16}/>:<Circle size={16}/>} {label}</button>:item.paid?<span className="booking-status is-paid">{label}</span>:null}</div>;
}
