import {LockKeyhole,LockKeyholeOpen} from 'lucide-react';
import {tr} from './i18n';
import type {Item} from './travel-data';

export default function ItemAILock({item,disabled=false,onChange}:{item:Item;disabled?:boolean;onChange:(locked:boolean)=>void}){
 const protectedBooking=item.paid||item.bookingHold;
 const locked=!!(protectedBooking||item.aiLocked);
 return <button type="button" className="item-ai-lock" aria-pressed={locked} aria-label={protectedBooking?tr('ai_item_booking_protected')+': '+item.title:tr(locked?'ai_item_unlock_label':'ai_item_lock_label',{name:item.title})} disabled={disabled||!!protectedBooking} title={tr(protectedBooking?'ai_item_booking_protected':'ai_item_lock_help')} onClick={()=>onChange(!item.aiLocked)}>{locked?<LockKeyhole size={14}/>:<LockKeyholeOpen size={14}/>}<span>{tr(protectedBooking?'ai_item_booking_protected':locked?'ai_item_locked':'ai_item_lock')}</span></button>;
}
