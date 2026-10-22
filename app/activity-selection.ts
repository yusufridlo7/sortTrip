import type {Item,Trip} from './travel-data';
export type ActivityOffer={productCode:string;title:string;description:string;fromPrice:number;currency:'IDR';bookingUrl:string;checkedAt:string;contextKey?:string;usedForEstimate?:boolean};
export function safeActivityOffer(value:unknown):value is ActivityOffer {
 const v=value as ActivityOffer;
 if(!v||typeof v.productCode!=='string'||!v.productCode||v.productCode.length>80||typeof v.title!=='string'||!v.title||v.title.length>250||typeof v.description!=='string'||v.description.length>1500||v.currency!=='IDR'||!Number.isFinite(v.fromPrice)||v.fromPrice<=0||v.fromPrice>1e9||typeof v.checkedAt!=='string'||!Number.isFinite(Date.parse(v.checkedAt)))return false;
 try{const u=new URL(v.bookingUrl);return u.protocol==='https:'&&u.hostname==='www.viator.com'&&!u.port&&!u.username&&!u.password&&u.pathname.startsWith('/tours/');}catch{return false;}
}
export function activityContextKey(trip:Trip,item:Item){return JSON.stringify([trip.destination,trip.start,item.id,item.day,item.title,item.place||'',item.locationCity||'',item.cityId||'']);}
export function applyActivityOffer(trip:Trip,id:string,offer:ActivityOffer,expectedContext:string,useStartingPrice=false):Trip {
 const item=trip.items.find(x=>x.id===id);
 if(!item||item.category!=='Wisata'||item.paid||activityContextKey(trip,item)!==expectedContext||!safeActivityOffer(offer))throw Error('activity_selection_changed');
 return {...trip,items:trip.items.map(x=>x.id===id?{...x,activityOffer:{...offer,contextKey:expectedContext,usedForEstimate:useStartingPrice},userEdited:true,
  ...(useStartingPrice?{price:Math.round(offer.fromPrice),shared:false,priceUnknown:false,priceQuote:undefined}:{}),
 }:x)};
}
