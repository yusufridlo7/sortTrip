import {tr,label as localize,locale} from './i18n';
'use client';
import {useState} from 'react';
import {Trip,money,flightBookingUrl} from './travel-data';
import {providerOffers,selectProvider} from './provider-data';
import {Choice} from './flight-search';
export default function ProviderCompare({trip,onChange,allowItinerary=true}:{trip:Trip;onChange:(t:Trip)=>void;allowItinerary?:boolean}){
 const [sort,setSort]=useState('price');const item=trip.items.find(x=>x.category==='Pesawat');if(!item||!trip.flight)return null;
 const validRows=providerOffers(trip);const cheapest=validRows[0].total;if(sort==='name')validRows.sort((a,b)=>a.name.localeCompare(b.name));
 return <section className="city-planner"><div className="city-planner-heading"><div><h2>{tr('ui_0508')}</h2><p>{tr('ui_0509')+' '}{trip.journey==='oneway'?tr('ui_0335'):tr('ui_0336')}{' '+tr('unit_7')+' '}</p></div><Choice label={tr('ui_0510')} value={sort} onChange={setSort} options={[["price",tr('ui_0511')],["name",tr('ui_0512')]]}/></div><div className="provider-list">{validRows.map(r=><div className="provider-row" key={r.name}><div><strong>{r.name}</strong>{r.price+r.fee===cheapest&&<small>{tr('ui_0513')}</small>}<small>{tr('ui_0334')+' '}{money(r.price)}{' '+tr('ui_0514')+' '}{money(r.fee)}</small></div><strong>{money(r.price+r.fee)}</strong>{allowItinerary&&<button className="secondary" disabled={item.paid} onClick={()=>onChange(selectProvider(trip,r))}>{tr('ui_0017')}</button>}<span className="inline-note">{tr('ui_0226')}</span></div>)}</div><p className="inline-note">{tr('ui_0515')}</p></section>
}
