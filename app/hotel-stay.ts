import {tr} from './i18n';
import {type Item,type Trip,addDays,dayDiff,shortDate,validDate} from './travel-data';

// Each hotel's amount covers its own stay, including single-night AI suggestions.
export function hotelStay(item:Item,trip:Trip){
 if(item.category!=='Penginapan')return null;
 if(!item.checkin&&(!validDate(trip.start)||!Number.isInteger(item.day)||item.day<1))return null;
 const checkin=item.checkin||addDays(trip.start,item.day-1);
 if(!validDate(checkin))return null;
 const checkout=item.checkout||addDays(checkin,1);
 if(!validDate(checkin)||!validDate(checkout))return null;
 const nights=dayDiff(checkin,checkout);
 if(nights<=0)return null;
 return {nights,checkin,checkout,label:tr('hotel_stay',{count:nights,checkin:shortDate(checkin),checkout:shortDate(checkout)})};
}
