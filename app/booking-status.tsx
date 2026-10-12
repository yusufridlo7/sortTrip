import {tr,label as localize,locale} from './i18n';
import {CheckCircle2,Circle} from 'lucide-react';
import type {Item} from './travel-data';
export default function BookingStatus({item,onChange}:{item:Item;onChange?:(paid:boolean)=>void}){
 if(!onChange&&!item.paid)return null;
 const content=<><CheckCircle2 size={16}/>{item.paid?tr('ui_0080'):tr('ui_0081')}</>;
 return onChange?<button type="button" className={'booking-status '+(item.paid?'is-paid':'')} aria-pressed={item.paid} aria-label={(item.paid?tr('ui_0082'):tr('ui_0083'))+item.title} title={tr('ui_0084')} onClick={()=>onChange(!item.paid)}>{item.paid?content:<><Circle size={16}/>{tr('ui_0081')}</>}</button>:<span className="booking-status is-paid">{content}</span>;
}
