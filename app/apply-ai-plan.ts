import {type Trip,type AIPlan,type Item,type PriceQuote,destinations,geoData,addDays} from './travel-data';
import {applyPriceQuotes} from './apply-price-quotes';
import {itineraryIntent} from '../worker/itinerary-intent.mjs';
const isTime=(s:string)=>/^([01]\d|2[0-3]):[0-5]\d$/.test(s);
const minutes=(time:string)=>Number(time.slice(0,2))*60+Number(time.slice(3,5));
export function isTemplateItem(trip:Trip,item:Item):boolean{
 if(item.paid||item.bookingHold||item.userEdited||item.hotelId)return false;
 if(item.generated&&!item.aiGenerated&&(item.category==='Transportasi'||item.dayPlan))return true;
 if(item.template||item.generated&&!item.aiGenerated&&!item.routeKey&&!item.dayPlan)return true;
 const d=destinations.find(d=>d.id===trip.destination);
 if(!d)return false;
 if(item.id==='hotel')return item.title===geoData[d.id].hotel.name&&item.note.includes('anggaran contoh');
 if(/^visit-\d+$/.test(item.id))return d.places.includes(item.title)&&item.note.includes('Biaya adalah anggaran contoh');
 return ['transport-airport','transport-local'].includes(item.id)&&/cadangan|Cadangan|estimasi/i.test(item.note);
}
export function aiRetainedItems(trip:Trip,replaceIds:string[]=[] ){return trip.items.filter(x=>x.category!=='Pesawat'&&(!replaceIds.includes(x.id)||x.paid||x.bookingHold)&&!isTemplateItem(trip,x)&&(!x.aiGenerated||x.paid||x.bookingHold||x.userEdited||x.category==='Penginapan'));}
export function aiTripContext(trip:Trip,city:string,country:string,message=''){
 const intent=itineraryIntent(message);
 const replaceItemIds=trip.items.filter(x=>!x.paid&&!x.bookingHold&&(intent.replaceHotels&&x.category==='Penginapan'||intent.replaceAttractions&&x.category==='Wisata'&&(!intent.attractionDays.length||intent.attractionDays.includes(x.day)))).map(x=>x.id);
 const preserveItemIds=intent.replaceAttractions&&intent.attractionDays.length?trip.items.filter(x=>x.category==='Wisata'&&!intent.attractionDays.includes(x.day)).map(x=>x.id):[];
 const selected=trip.items.filter(x=>!replaceItemIds.includes(x.id));
 const names:Record<string,string>={kl:'Kuala Lumpur',bkk:'Bangkok',sin:'Singapura',melaka:'Melaka',penang:'George Town · Penang',ayutthaya:'Ayutthaya',putrajaya:'Putrajaya'};
 return {replaceItemIds,preserveItemIds,hotelBudget:intent.maxNightIDR?{maxNightIDR:intent.maxNightIDR,exclusive:intent.exclusive===true}:undefined,routingTargets:selected.filter(x=>['Wisata','Penginapan'].includes(x.category)).slice(0,70).map(x=>({day:x.day,city:names[x.cityId||'']||x.locationCity||city,place:x.place||x.title,category:x.category})),requestedStops:selected.filter(x=>x.category==='Wisata'&&(!x.aiGenerated||x.userEdited||x.paid||preserveItemIds.includes(x.id))).slice(0,70).map(x=>({day:x.day,city:names[x.cityId||'']||x.locationCity||city,title:x.title,protected:!!x.paid||!!x.userEdited})),dailyCities:Array.from({length:Math.min(trip.days,70)},(_,i)=>({day:i+1,city:names[trip.cityDays?.[i]||'']||city,country:trip.cityDays?.[i]==='bkk'||trip.cityDays?.[i]==='ayutthaya'?'Thailand':trip.cityDays?.[i]==='sin'?'Singapura':trip.cityDays?.[i]==='kl'||trip.cityDays?.[i]==='melaka'||trip.cityDays?.[i]==='penang'||trip.cityDays?.[i]==='putrajaya'?'Malaysia':country})),routeRequests:trip.items.filter(x=>x.category==='Transportasi'&&(x.fromCity&&x.toCity||x.fromPlace&&x.toPlace)).slice(0,70).map(x=>({day:x.day,from:names[x.fromCity||'']||x.fromPlace||x.fromCity,to:names[x.toCity||'']||x.toPlace||x.toCity,mode:x.mode||'',protected:!!x.paid||!!x.userEdited})),retained:[...new Set([...aiRetainedItems(trip,replaceItemIds),...trip.items.filter(x=>preserveItemIds.includes(x.id))])].slice(0,100).map(x=>({day:x.day,category:x.category,title:x.title,time:x.time,checkin:x.checkin,checkout:x.checkout})),locked:trip.items.filter(x=>x.paid&&x.category!=='Penginapan').map(x=>({day:x.day,time:x.time,title:x.title}))};
}
export function applyAIPlan(trip:Trip,plan:AIPlan,quotes:PriceQuote[]=[]):Trip{
 const city=trip.destinationMeta?.city||destinations.find(d=>d.id===trip.destination)?.city||trip.destination;
 if(plan.context.city!==city||plan.context.start!==trip.start||plan.context.days!==trip.days||plan.context.people!==trip.people||plan.context.budget!==trip.budget)throw Error('Perjalanan berubah. Buat ulang rancangan AI.');
 if(plan.context.dailyCities){const current=aiTripContext(trip,city,'').dailyCities;if(plan.context.dailyCities.some(x=>current.find(c=>c.day===x.day)?.city!==x.city))throw Error('Kota harian berubah. Buat ulang rancangan AI.');}
 // Only replace a selected hotel after a supplier quote covers its entire stay.
 const requested=plan.context.replaceItemIds||[];
 const nightsCovered=(item:Item,day:number)=>{const date=addDays(trip.start,day-1);return item.category==='Penginapan'&&(item.checkin||addDays(trip.start,item.day-1))<=date&&(item.checkout||addDays(trip.start,item.day))>date;};
 const activities=plan.activities.filter(a=>['Wisata','Transfer','Penginapan','Area menginap'].includes(a.category));
 const draftItems:Item[]=activities.map(a=>{
  if(!Number.isInteger(a.day)||a.day<1||a.day>trip.days||!isTime(a.time)||!a.title.trim())throw Error('Hari atau jam rancangan tidak valid.');
  const lodging=a.category==='Penginapan'||a.category==='Area menginap';
  if(lodging&&a.day>=trip.days)throw Error('Penginapan harus berada pada malam dalam perjalanan.');
  const scheduled=(a.day-1)*1440+minutes(a.time);
  if(trip.flight&&/^([01]\d|2[0-3]):[0-5]\d$/.test(trip.flight.arrive)&&scheduled<(trip.flight.arrivalDay||0)*1440+minutes(trip.flight.arrive)+120)throw Error('Aktivitas terlalu dekat waktu kedatangan. Sesuaikan jamnya.');
  if(trip.journey!=='oneway'&&trip.flight?.returnAt){const returnAt=trip.flight.returnAt;const day=Math.round((Date.parse(returnAt.slice(0,10))-Date.parse(trip.start))/86400000);if(scheduled>day*1440+minutes(returnAt.slice(11,16))-240)throw Error('Aktivitas terlalu dekat penerbangan pulang. Sesuaikan jamnya.');}
  const url=new URL(a.sourceUrl);if(url.protocol!=='https:'||!plan.sources.some(s=>s.url===a.sourceUrl))throw Error('Referensi rancangan tidak valid.');
  if(trip.items.some(x=>x.paid&&x.category!=='Penginapan'&&x.day===a.day&&isTime(x.time)&&Math.abs(minutes(x.time)-minutes(a.time))<90))throw Error('Rancangan berbenturan dengan booking yang sudah dibayar. Sesuaikan jamnya.');
  const category=lodging?'Penginapan':a.category==='Transfer'?'Transportasi':'Wisata';
  return {id:'ai-plan-'+a.id,aiGenerated:true,priceUnknown:true,sourceUrl:a.sourceUrl,title:a.title,place:a.location||a.title,locationCity:a.city||city,category,price:0,paid:false,day:a.day,time:a.time,...(a.geo?{geo:a.geo}:{}),...(a.admission?{admission:a.admission}:{}),...(lodging?{checkin:a.checkin||addDays(trip.start,a.day-1),checkout:a.checkout||addDays(trip.start,a.day),...(a.hotelId?{hotelId:a.hotelId}:{}),...(a.provider?{provider:a.provider}:{}),...(a.hotelArea?{hotelArea:a.hotelArea}:{}),...(a.geo?{geo:a.geo}:{}),shared:false}:{}),...(a.category==='Transfer'?{fromPlace:a.fromPlace,toPlace:a.toPlace,mode:a.mode,...(a.routeOptions?{routeOptions:a.routeOptions,selectedRoute:a.selectedRoute??0}:{})}:{}),note:a.note+(lodging?' · Rekomendasi penginapan, belum dipesan; harga dan ketersediaan belum diverifikasi.':' · Usulan AI bersumber; jam/rute perlu diverifikasi. Harga belum diisi.')};
 });
 // Price validation precedes replacement: an area or an unpriced hotel ID is
 // not a replacement for an existing stay.
 const priced=applyPriceQuotes({...trip,items:draftItems},quotes);
 const overlaps=(a:Item,b:Item)=>Array.from({length:Math.max(0,trip.days-1)},(_,i)=>i+1).some(day=>nightsCovered(a,day)&&nightsCovered(b,day));
 const budget=plan.context.hotelBudget;
 let candidates=priced.items.filter(a=>a.category==='Penginapan'&&a.provider==='LiteAPI'&&a.hotelId&&a.priceQuote?.basis==='stay_total'&&!a.priceUnknown).filter(a=>{
  if(!budget)return true;
  const nights=(Date.parse(a.checkout!)-Date.parse(a.checkin!))/86400000,perNight=a.price/nights/Math.ceil(trip.people/2);
  return Number.isFinite(perNight)&&(budget.exclusive?perNight<budget.maxNightIDR:perNight<=budget.maxNightIDR);
 });
 const replaceable=(pool:Item[])=>requested.filter(id=>{
  const old=trip.items.find(x=>x.id===id);if(!old||old.paid||old.bookingHold)return false;
  if(old.category==='Wisata')return draftItems.some(a=>a.category==='Wisata'&&a.day===old.day);
  if(old.category!=='Penginapan')return false;
  const nights=Array.from({length:Math.max(0,trip.days-1)},(_,i)=>i+1).filter(day=>nightsCovered(old,day));
  return nights.length>0&&nights.every(day=>pool.some(a=>nightsCovered(a,day)));
 });
 let replacements=replaceable(candidates);
 // Removing a conflicting candidate can invalidate another stay's coverage.
 // Iterate to a stable set before deleting any original accommodation.
 for(let n=0;n<=requested.length;n++){
  const protectedHotels=trip.items.filter(x=>x.category==='Penginapan'&&!isTemplateItem(trip,x)&&!replacements.includes(x.id));
  candidates=candidates.filter(a=>!protectedHotels.some(old=>overlaps(old,a)));
  const next=replaceable(candidates);if(JSON.stringify(next)===JSON.stringify(replacements))break;replacements=next;
 }
 const retained=[...new Set([...aiRetainedItems(trip,replacements),...trip.items.filter(x=>requested.includes(x.id)&&!replacements.includes(x.id)||(plan.context.preserveItemIds||[]).includes(x.id))])];
 const items=priced.items.filter(a=>(a.category!=='Penginapan'||!a.hotelId||candidates.includes(a))&&!(a.category==='Penginapan'&&retained.some(x=>x.category==='Penginapan'&&overlaps(x,a)))&&!retained.some(x=>x.category===a.category&&x.day===a.day&&x.title.toLowerCase()===a.title.toLowerCase()));
 const coveredDays=new Set(activities.map(a=>a.day));const lodgingDays=new Set(items.filter(x=>x.category==='Penginapan').flatMap(x=>Array.from({length:trip.days-1},(_,i)=>i+1).filter(day=>nightsCovered(x,day))));
 const existing=trip.items.flatMap(x=>{
  if(retained.includes(x)||x.category==='Pesawat')return [x];
  if(x.aiGenerated)return coveredDays.has(x.day)?[]:[x];
  if(replacements.includes(x.id))return [];
  if(!isTemplateItem(trip,x))return [x];
  if(x.category==='Penginapan'){
   const nights=Array.from({length:Math.max(0,trip.days-1)},(_,i)=>i+1).filter(day=>nightsCovered(x,day));
   if(!nights.some(day=>lodgingDays.has(day)))return [x];
   return nights.filter(day=>!lodgingDays.has(day)).map(day=>({...x,id:x.id+'-remaining-'+day,day,price:x.price/Math.max(1,nights.length),checkin:addDays(trip.start,day-1),checkout:addDays(trip.start,day)}));
  }
  return coveredDays.has(x.day)?[]:[x];
 });
 // Model activity IDs restart on each response. Never discard a new hotel
 // because its ID happens to match a retained attraction or another item.
 const used=new Set(existing.map(x=>x.id));
 const additions=items.map(item=>{let id=item.id,n=0;while(used.has(id))id=item.id+'-revision-'+(++n);used.add(id);return id===item.id?item:{...item,id,...(item.priceQuote?{priceQuote:{...item.priceQuote,id}}:{}),...(item.routePriceQuotes?{routePriceQuotes:item.routePriceQuotes.map(q=>({...q,id:id+q.id.slice(item.id.length)}))}:{})};});
 const merged=[...existing,...additions];
 if(merged.length>300)throw Error('Itinerary melebihi kapasitas penyimpanan. Kurangi aktivitas terlebih dahulu.');
 return {...trip,...(additions.some(x=>x.priceQuote||x.routePriceQuotes?.length)?{priceCheckedAt:priced.priceCheckedAt}:{}),aiPlan:plan,items:merged.sort((a,b)=>a.day-b.day||a.time.localeCompare(b.time))};
}
