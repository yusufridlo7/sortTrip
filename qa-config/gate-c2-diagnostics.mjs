import {boundedBytes} from '../lib/video-itinerary.mjs';
const type=v=>Array.isArray(v)?'array':v===null?'null':typeof v;
// Only categories/counts/flags; no raw body, error message, IDs, room names or tokens.
export async function supplierJSON(response,kind,diagnostic){
 diagnostic.http=response.status;diagnostic.contentType=(response.headers.get('Content-Type')||'').split(';')[0].slice(0,80);
 if(!response.ok){await response.body?.cancel();diagnostic.failure='HTTP_ERROR';throw Error('HTTP_ERROR');}
 let raw;
 try{raw=JSON.parse(new TextDecoder().decode(await boundedBytes(response.body,6000000,AbortSignal.timeout(19000))));}catch{diagnostic.failure='JSON_OR_STREAM_ERROR';throw Error('JSON_OR_STREAM_ERROR');}
 diagnostic.envelopeType=type(raw);diagnostic.dataType=type(raw?.data);diagnostic.dataCount=Array.isArray(raw?.data)?raw.data.length:null;
 diagnostic.errorPresent=raw?.error!=null;diagnostic.sandbox=[true,1,'true','1'].includes(raw?.sandbox);
 const categories={2001:'NO_AVAILABILITY',4000:'INVALID_REQUEST',4002:'INVALID_FIELD',40020:'FEED_UNAVAILABLE',401:'UNAUTHORIZED',40302:'ACCOUNT_SUSPENDED',4290:'RATE_LIMIT',4291:'RATE_LIMIT_SYSTEM',4011:'SUPPLIER_COMMUNICATION'};
 if(kind==='hotel'&&diagnostic.errorPresent)diagnostic.apiErrorCategory=categories[raw.error?.code]||'UNRECOGNIZED_API_ERROR';
 if(kind==='hotel'){
  const hotels=Array.isArray(raw?.data)?raw.data:[];const offers=hotels.flatMap(h=>Array.isArray(h?.roomTypes)?h.roomTypes:[]);const rates=offers.flatMap(o=>Array.isArray(o?.rates)?o.rates:[]);
  diagnostic.offersCount=offers.length;diagnostic.ratesCount=rates.length;diagnostic.standardOffers=offers.filter(o=>o?.rateType==='standard').length;
  diagnostic.nullTaxBreakdowns=rates.filter(r=>r?.retailRate?.taxesAndFees===null).length;diagnostic.arrayTaxBreakdowns=rates.filter(r=>Array.isArray(r?.retailRate?.taxesAndFees)).length;diagnostic.excludedFeeCount=rates.flatMap(r=>Array.isArray(r?.retailRate?.taxesAndFees)?r.retailRate.taxesAndFees:[]).filter(t=>t?.included===false).length;
  diagnostic.idrSuggestedPriceRates=rates.filter(r=>Array.isArray(r?.retailRate?.suggestedSellingPrice)&&r.retailRate.suggestedSellingPrice.some(p=>p?.currency==='IDR')).length;
  diagnostic.hasIDRTotal=rates.some(r=>r?.retailRate?.total?.some?.(p=>p?.currency==='IDR'));diagnostic.currencyIDR=diagnostic.hasIDRTotal;
  diagnostic.dataObjectHasHotels=raw?.data!==null&&typeof raw?.data==='object'&&!Array.isArray(raw.data)&&Array.isArray(raw.data.hotels);
 }else{diagnostic.success=raw?.success===true;diagnostic.currencyIDR=String(raw?.currency).toLowerCase()==='idr';}
 return raw;
}
