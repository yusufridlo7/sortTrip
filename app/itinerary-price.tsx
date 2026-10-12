import {tr,label as localize,locale} from './i18n';
import {type Item,type Trip,money} from './travel-data';
import {hotelStay} from './hotel-stay';
export default function ItineraryPrice({item,trip}:{item:Item;trip:Trip}){
 const stay=hotelStay(item,trip);
 const known=Number.isFinite(item.price)&&item.price>0;
 const label=item.paid?'Sudah dibayar':item.priceUnknown?tr('msg_0145'):item.priceQuote?.scope==='dated'?'Harga diperiksa':item.priceQuote?'Tarif referensi':'Estimasi';
 return <div className={'itinerary-price'+(item.paid?' is-paid':'')} aria-label={tr('price_item',{name:item.title})}>
  <strong>{known?money(item.price):item.priceUnknown||['Pesawat','Penginapan','Transportasi'].includes(item.category)?tr('ui_0224'):tr('ui_0452')}</strong>
  {known&&<small>{item.shared?tr('ui_0453'):tr('ui_0454')} · {localize(label)}</small>}
  {stay&&<small>{localize(stay.label)}</small>}
 </div>;
}
