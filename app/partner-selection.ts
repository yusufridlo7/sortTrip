import {type Trip,type Item,addDays,dayDiff,destinations} from './travel-data';
import {transportLink} from './transport-affiliate.mjs';
export const tripHotelAffiliate='https://www.trip.com/hotels/?Allianceid=10936143&SID=332965312&trip_sub1=&trip_sub3=D20158392';
export const tripHotelWidget='https://www.trip.com/partners/ad/S20157986?Allianceid=10936143&SID=332965312&trip_sub1=';
export const tripLabel=(trip:Trip)=>trip.destinationMeta?.city||destinations.find(d=>d.id===trip.destination)?.city||trip.destination;
export const partnerTripKey=(trip:Trip)=>[trip.id||'',trip.destination,trip.start,trip.days].join('|');
export type PartnerContext={name?:string;date?:string;checkOut?:string;from?:string;to?:string;replaceId?:string;tripKey?:string};
export type PartnerSearchProps={trip:Trip|null;trips:Trip[];context?:PartnerContext;onAdd:(trip:Trip,item:Item,replaceId?:string)=>void};
const aliases:Record<string,string>={'kuala lumpur':'kl','bangkok':'bkk','singapura':'sin','singapore':'sin','melaka':'melaka','malacca':'melaka','chiang mai':'chiang-mai',kl:'kl',bkk:'bkk',sin:'sin'};
export function partnerCity(value:string){return aliases[value.trim().toLowerCase()]||value.trim().toLowerCase();}
const dateValid=(s:string)=>/^\d{4}-\d{2}-\d{2}$/.test(s)&&Number.isFinite(Date.parse(s))&&new Date(s).toISOString().slice(0,10)===s;
export function manualPartnerItem(trip:Trip,kind:'hotels'|'transport',input:{name:string;date:string;checkOut:string;from:string;to:string;price:string},id:string):Item{
 const name=input.name.trim(),from=input.from.trim(),to=input.to.trim();
 if(!name||name.length>160||from.length>160||to.length>160)throw Error('Isi nama pilihan, maksimal 160 karakter.');
 if(!dateValid(input.date)||dayDiff(trip.start,input.date)<0||dayDiff(trip.start,input.date)>=trip.days)throw Error('Tanggal pilihan harus berada dalam perjalanan yang dipilih.');
 if(kind==='hotels'&&(!dateValid(input.checkOut)||input.checkOut<=input.date||input.checkOut>addDays(trip.start,trip.days-1)))throw Error('Check-out harus setelah check-in dan tidak melewati tanggal akhir trip.');
 if(kind==='transport'&&(!from||!to||from.toLowerCase()===to.toLowerCase()))throw Error('Isi asal dan tujuan yang berbeda.');
 const price=input.price.trim()===''?null:Number(input.price);
 if(price!==null&&(!Number.isFinite(price)||price<0||price>1e9))throw Error('Harga tidak valid. Masukkan rupiah per orang atau biarkan kosong.');
 return {id,title:kind==='hotels'?name:`${from} → ${to} · ${name}`,place:kind==='hotels'?name:undefined,category:kind==='hotels'?'Penginapan':'Transportasi',day:dayDiff(trip.start,input.date)+1,time:'',price:price??0,priceUnknown:price===null,paid:false,userEdited:true,provider:kind==='hotels'?'Trip.com':'12Go',locationCity:kind==='hotels'?to:undefined,...(kind==='hotels'?{checkin:input.date,checkout:input.checkOut,bookingUrl:tripHotelAffiliate}:{fromPlace:from,toPlace:to,travelDate:input.date,bookingUrl:transportLink(partnerCity(from),partnerCity(to),input.date,trip.people)||undefined}),note:'Pilihan dikonfirmasi manual oleh pengguna. Belum dipesan; tautan membuka pencarian affiliate, bukan checkout terverifikasi. '+(price===null?'Harga belum diisi.':'Anggaran rupiah per orang dari pengguna; periksa harga akhir di mitra.')};
}
export function applyPartnerSelection(trip:Trip,item:Item,replaceId?:string):Trip{
 if(!replaceId)return {...trip,items:[...trip.items,item]};
 const old=trip.items.find(x=>x.id===replaceId);
 if(!old||old.paid||old.category!==item.category)throw Error('Pilihan sebelumnya tidak boleh diganti. Tambahkan sebagai item baru.');
 if(item.category==='Penginapan'&&((old.checkin||addDays(trip.start,old.day-1))!==item.checkin||old.checkout!==item.checkout))throw Error('Penggantian hotel harus mencakup tanggal menginap yang sama. Sesuaikan tanggal atau matikan opsi ganti.');
 return {...trip,items:trip.items.map(x=>x.id===replaceId?item:x)};
}

// Exact links from official Affiliate Link generator,2026-10-09. Never synthesize tracking parameters.
const cubeHotel='https://www.trip.com/hotels/singapore-hotel-detail-1729952/cube-boutique-capsule-hotel-kampong-glam/?Allianceid=10936143&SID=332965312&trip_sub1=&trip_sub3=D20158392';
export function hotelAffiliateLink(item:Pick<Item,'title'|'sourceUrl'|'locationCity'>){
 const name=item.title.toLowerCase().replace(/[^a-z0-9]+/g,' ').trim();
 let property=false;try{const source=new URL(item.sourceUrl||'');property=source.protocol==='https:'&&source.hostname==='www.trip.com'&&/^\/hotels\/(?:v2\/)?singapore-hotel-detail-1729952\//.test(source.pathname);}catch{}
 const named=['cube boutique capsule hotel at kampong glam','cube boutique capsule hotel kampong glam'].includes(name);
 return property||named?{url:cubeHotel,specific:true}:{url:tripHotelAffiliate,specific:false};
}
