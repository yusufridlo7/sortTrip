import {tr,label as localize,locale} from './i18n';
import {useState} from 'react';
import {transportLink,transportAffiliateHome} from './transport-affiliate.mjs';
export default function TransportBooking({from,to,date,people}:{from:string;to:string;date:string;people:number}){
 const [open,setOpen]=useState(false);
 const url=transportLink(from,to,date,people);
 return <div className="transport-booking"><button type="button" className="secondary" aria-expanded={open} onClick={()=>setOpen(!open)}>{open?tr('ui_0541'):tr('ui_0542')}</button>{open&&<div className="transport-booking-details"><strong>{tr('ui_0543')}</strong><p>{url?tr('ui_0544',{v0:(date),v1:(people)}):tr('ui_0545')}</p><a className="primary" href={url||transportAffiliateHome} target="_blank" rel="noopener noreferrer sponsored">{url?tr('ui_0546'):tr('ui_0547')} ↗</a><p className="inline-note">{tr('ui_0548')}</p></div>}</div>;
}
