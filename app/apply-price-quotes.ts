import {type Trip,type PriceQuote,addDays,dayDiff} from './travel-data';
export function buildPriceTargets(trip:Trip,city:string){
 const names:Record<string,string>={kl:'Kuala Lumpur',sin:'Singapura',bkk:'Bangkok',melaka:'Melaka',penang:'Penang',ayutthaya:'Ayutthaya',putrajaya:'Putrajaya'};
 return trip.items.filter(x=>!x.paid&&!x.bookingHold&&!x.aiLocked&&['Penginapan','Transportasi'].includes(x.category)).flatMap(x=>{
  const base={id:x.id,title:x.title,category:x.category,day:x.day,hotelId:x.hotelId,sourceUrl:x.sourceUrl,mode:x.mode,city:x.locationCity||city,from:x.fromPlace||names[x.fromCity||''],to:x.toPlace||names[x.toCity||''],checkin:x.checkin,checkout:x.checkout,rooms:Math.ceil(trip.people/2)};
  const legs=x.routeOptions?.[x.selectedRoute||0]?.legs;
  return x.category==='Transportasi'&&legs?legs.flatMap((leg,i)=>/bus|bis|coach|kereta|train|rail|ferry|feri|shuttle/i.test(leg.mode)?[{...base,id:x.id+'::'+i,title:(leg.mode+' '+leg.fromPlace+' → '+leg.toPlace).slice(0,160),from:leg.fromPlace,to:leg.toPlace,mode:leg.mode,sourceUrl:leg.sourceUrl}]:[]):[base];
 }).slice(0,30);
}
export function applyPriceQuotes(trip:Trip,quotes:PriceQuote[]):Trip {
 const byId=new Map(quotes.map(x=>[x.id,x]));
 return {...trip,priceCheckedAt:quotes.map(x=>x.checkedAt).sort().at(-1)||trip.priceCheckedAt,items:trip.items.map(item=>{
  if(item.paid||item.bookingHold||item.aiLocked)return item;
  const legs=item.routeOptions?.[item.selectedRoute||0]?.legs;
  if(item.category==='Transportasi'&&legs){
   const routePriceQuotes=legs.flatMap((_,i)=>{const quote=byId.get(item.id+'::'+i)||item.routePriceQuotes?.find(x=>x.id===item.id+'::'+i);return quote&&quote.basis==='person'&&Number.isFinite(quote.amountIDR)&&quote.amountIDR>0&&quote.amountIDR<=1e9?[quote]:[]});
   if(routePriceQuotes.length){const price=routePriceQuotes.reduce((sum,q)=>sum+q.amountIDR,0);if(price>1e9)return item;return {...item,routePriceQuotes,priceQuote:undefined,price,shared:false,priceUnknown:legs.some((leg,i)=>!/jalan kaki|walking/i.test(leg.mode)&&!routePriceQuotes.some(q=>q.id===item.id+'::'+i))};}
  }
  const quote=byId.get(item.id);if(!quote||!Number.isFinite(quote.amountIDR)||quote.amountIDR<=0||quote.amountIDR>1e9)return item;
  if(item.category==='Penginapan'&&quote.basis==='stay_total'){
   const checkin=item.checkin||addDays(trip.start,item.day-1),checkout=item.checkout||addDays(trip.start,item.day);
   if(quote.scope!=='dated'||!['Trip.com','LiteAPI'].includes(quote.provider)||quote.checkin!==checkin||quote.checkout!==checkout||quote.adults!==trip.people||quote.rooms!==(quote.provider==='LiteAPI'?Math.ceil(trip.people/2):1)||quote.taxesIncluded!==true||!quote.roomType)return item;
   if(quote.provider==='LiteAPI'&&(!quote.hotelId||item.hotelId&&item.hotelId!==quote.hotelId||quote.hotelName!==item.title))return item;
   return {...item,price:quote.amountIDR,shared:true,priceUnknown:false,priceQuote:quote,...(quote.provider==='LiteAPI'?{provider:'LiteAPI',hotelId:quote.hotelId,bookingUrl:quote.bookingUrl||undefined,hotelArea:quote.hotelArea,geo:quote.geo||item.geo}: {})};
  }
  if(item.category==='Penginapan'&&quote.basis==='room_night'){
   const nights=Math.max(1,dayDiff(item.checkin||addDays(trip.start,item.day-1),item.checkout||addDays(trip.start,item.day)));
   const price=quote.amountIDR*nights*Math.ceil(trip.people/2);if(!Number.isFinite(price)||price>1e9)return item;
   return {...item,price,shared:true,priceUnknown:false,priceQuote:quote};
  }
  if(item.category==='Transportasi'&&quote.basis==='person')return {...item,price:quote.amountIDR,shared:false,priceUnknown:false,priceQuote:quote};
  return item;
 })};
}
