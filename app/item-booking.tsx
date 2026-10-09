import FlightBooking from './flight-booking';
import {transportLegLink,transportAffiliateHome} from './transport-affiliate.mjs';
import {hotelAffiliateLink,partnerTripKey,type PartnerContext} from './partner-selection';
import {cityAt,cityById} from './cities';
import {type Item,type Trip,mapLink,addDays} from './travel-data';
import InfoNote from './info-note';
export default function ItemBooking({item,trip,onSearch}:{item:Item;trip:Trip;onSearch?:(kind:'hotels'|'transport',context:PartnerContext)=>void}){
 const city=item.locationCity||cityById(item.cityId||'')?.name||cityAt(trip,item.day)?.name||trip.destinationMeta?.city||trip.destination;
 const date=item.travelDate||addDays(trip.start,item.day-1);
 if(item.category==='Pesawat')return <FlightBooking item={item} trip={trip}/>;
 if(item.category==='Penginapan')return <div className="partner-booking-options"><a className="item-booking" href={hotelAffiliateLink(item).url} target="_blank" rel="noopener noreferrer sponsored">{hotelAffiliateLink(item).specific?'Lihat hotel & pesan di Trip.com ↗':'Cari & pesan di Trip.com ↗'}</a>{onSearch&&<button className="secondary" onClick={()=>onSearch('hotels',{name:item.title,to:city,date:item.checkin||date,checkOut:item.checkout||addDays(date,1),replaceId:item.id,tripKey:partnerTripKey(trip)})}>Cari hotel lain</button>}<InfoNote label="Informasi pemesanan hotel"><p>Rekomendasi: {item.title}. {hotelAffiliateLink(item).specific?'Tautan affiliate membuka halaman hotel ini.':'Tautan affiliate membuka pencarian hotel Trip.com; pilih nama hotel yang direkomendasikan.'} Cocokkan tanggal, tamu dan kamar. Harga/ketersediaan dan checkout hotel ini belum diverifikasi. Form pencarian tidak mengembalikan pilihan otomatis ke SortTrip.</p></InfoNote></div>;
 if(item.category==='Transportasi'){
  const selected=item.routeOptions?.[item.selectedRoute||0];
  const canReplaceWholeRoute=!selected||selected.legs.length===1;
  const legs=selected?selected.legs.filter(l=>/bus|bis|coach|kereta|train|rail|ferry|feri|shuttle/i.test(l.mode)):[{fromPlace:cityById(item.fromCity||'')?.name||item.fromPlace||'',toPlace:cityById(item.toCity||'')?.name||item.toPlace||'',mode:item.mode||''}].filter(l=>l.fromPlace&&l.toPlace);
  if(!legs.length)return onSearch?<button className="secondary" onClick={()=>onSearch('transport',{name:item.title,date,from:item.fromPlace,to:item.toPlace})}>Cari transportasi lainnya</button>:null;
  return <div className="partner-booking-options">{legs.map((leg,i)=>{const url=transportLegLink(leg,date,trip.people);return <div key={i}><small>{leg.fromPlace} → {leg.toPlace}</small>{url&&<a className="item-booking" href={url} target="_blank" rel="noopener noreferrer sponsored">Cari & beli tiket transportasi ↗</a>}{onSearch&&<button className="secondary" onClick={()=>onSearch('transport',{name:leg.mode||item.title,date,from:leg.fromPlace,to:leg.toPlace,replaceId:canReplaceWholeRoute?item.id:undefined,tripKey:partnerTripKey(trip)})}>Cari transportasi lainnya</button>}{!url&&!onSearch&&<a className="item-booking" href={transportAffiliateHome} target="_blank" rel="noopener noreferrer sponsored">Cari tiket transportasi ↗</a>}</div>})}<InfoNote label="Informasi tiket transportasi"><p>Pencarian affiliate 12Go. Rute kota yang didukung membawa tanggal dan penumpang; sambungan/stasiun lain perlu dipilih pada form. Operator, jadwal, tempat naik dan harga akhir harus dicocokkan. Tidak semua layanan lokal tersedia di mitra.</p></InfoNote></div>;
 }
 return item.category==='Wisata'?<a className="item-booking subtle" href={mapLink(item.place||item.title,city)} target="_blank" rel="noopener noreferrer">Lihat tempat ↗</a>:null;
}
