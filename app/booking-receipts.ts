import {bookingItemKey} from '../worker/booking-identity.mjs';
import type {Trip,Item} from './travel-data';
export type BookingReceipt={tripId:string;itemId:string;matchKey:string;provider:'LiteAPI'|'Travelpayouts';state:'confirmed'|'reported'|'pending'|'cancelled';checkedAt:string;checkoutId?:string;reference?:string};
export function receiptFor(trip:Trip,item:Item,receipts:BookingReceipt[]){return receipts.find(r=>r.tripId===trip.id&&r.itemId===item.id&&r.matchKey===bookingItemKey(trip,item));}
export function manualBookingMark(item:Item,paid:boolean){return {...item,paid,manualPaid:paid,purchaseSource:undefined,purchaseMatchKey:undefined,purchaseTripId:undefined,userEdited:true};}
export function applyBookingReceipts(trip:Trip,receipts:BookingReceipt[]):Trip{
 return {...trip,items:trip.items.map(item=>{
  const key=bookingItemKey(trip,item),receipt=receiptFor(trip,item,receipts);
  const manualPaid=item.manualPaid??(item.purchaseSource==='provider'?false:item.paid);
  if(receipt?.state==='pending'&&receipt.provider==='LiteAPI')return {...item,bookingHold:true,manualPaid,purchaseSource:'provider' as const,purchaseMatchKey:key!,purchaseTripId:trip.id};
  if(receipt?.state==='confirmed'&&receipt.provider==='LiteAPI')return {...item,bookingHold:false,paid:true,manualPaid,purchaseSource:'provider' as const,purchaseMatchKey:key!,purchaseTripId:trip.id};
  // Cancellation is not proof of a refund. Keep an existing paid record until
  // the owner explicitly edits it; display cancellation separately from payment.
  if(item.purchaseSource==='provider'&&(item.purchaseMatchKey!==key||item.purchaseTripId!==trip.id))return {...item,bookingHold:false,paid:manualPaid,purchaseSource:undefined,purchaseMatchKey:undefined,purchaseTripId:undefined};
  if(receipt?.state==='cancelled'&&item.bookingHold)return {...item,bookingHold:false};
  return item;
 })};
}
