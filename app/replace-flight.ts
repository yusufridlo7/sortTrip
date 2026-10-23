import {destinations,makeTrip,type Trip} from './travel-data';

/** Rebuild only after confirmation; the original itinerary is never mutated. */
export function replaceFlight(original:Trip,selected:Trip):Trip {
 if(original.items.some(item=>item.paid||item.bookingHold))throw Error('Ada booking yang sudah dibayar. Penggantian otomatis diblokir agar booking tetap aman.');
 if(selected.flight?.source!=='aviasales'||!selected.items.some(x=>x.category==='Pesawat'))throw Error('Pilih penerbangan dari hasil pencarian terlebih dahulu.');
 if(selected.people!==original.people)throw Error('Jumlah pelancong harus sama dengan itinerary saat ini. Sesuaikan pencarian penerbangan.');
 const destination=destinations.find(x=>x.id===selected.destination);
 const base=destination&&!selected.estimateIncomplete?makeTrip(destination,selected.origin,selected.start,selected.days,original.people,original.budget,selected.flight):selected;
 const flightItems=selected.items.filter(x=>x.category==='Pesawat');
 return {...base,id:original.id,people:original.people,budget:original.budget,flight:{...selected.flight},destinationMeta:selected.destinationMeta,estimateIncomplete:selected.estimateIncomplete,
 items:[...flightItems.map(x=>({...x})),...base.items.filter(x=>x.category!=='Pesawat').map(x=>({...x}))],
 aiPrompt:selected.aiPrompt??original.aiPrompt,aiPace:original.aiPace,aiTransportPreference:original.aiTransportPreference,
 aiPlan:undefined,aiConversation:undefined,dayPlans:undefined,localTransportDays:undefined,cityDays:undefined};
}
