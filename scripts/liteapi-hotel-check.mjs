import {checkedLiteOffer} from '../worker/lite-hotel.js';
import {checkoutMode} from '../worker/hotel-checkout.js';
import {hotelCheckoutUrl} from '../app/hotel-checkout-link.mjs';
// Bounded, read-only catalogue and dated rate checks. No prebook, booking or payment.
const key=process.env.LITEAPI_API_KEY?.trim();
if(process.argv.includes('--checkout')&&checkoutMode(process.env)!=='sandbox'){console.info('HOTEL_CHECKOUT_SANDBOX_REQUIRED');process.exit(1);}
if(!key){console.info('LITEAPI_KEY_NOT_CONFIGURED');process.exit(1);}
const environment=key.startsWith('sand_')?'sandbox':'unverified_key_type';
const cities=[['MY','Kuala Lumpur'],['SG','Singapore'],['TH','Bangkok'],['ID','Denpasar'],['ID','Jakarta']];
const knownKeys=o=>Object.keys(o||{}).filter(k=>/^[a-zA-Z][a-zA-Z0-9_]{0,40}$/.test(k)&&!/key|token|session|secret|authorization|cookie|hash|id$/i.test(k));
async function request(path,body){
 try{
  const response=await fetch('https://api.liteapi.travel/v3.0/'+path,{method:body?'POST':'GET',headers:{'X-API-Key':key,Accept:'application/json',...(body?{'Content-Type':'application/json'}:{})},...(body?{body:JSON.stringify(body)}:{}),redirect:'error',signal:AbortSignal.timeout(30000)});
  if(response.status===204)return {status:204,data:[]};
  if(!response.ok)return {status:response.status,failed:true};
  return {status:response.status,payload:await response.json()};
 }catch{return {failed:true,code:'NETWORK_OR_RESPONSE_UNAVAILABLE'};}
}
let hotels=[];
for(const [countryCode,cityName] of (process.argv.includes('--workflow')||process.argv.includes('--checkout')?cities.slice(0,1):cities)){
 const result=await request('data/hotels?'+new URLSearchParams({countryCode,cityName,limit:'5'}));
 const data=Array.isArray(result.payload?.data)?result.payload.data:[];
 console.info(JSON.stringify({phase:'catalogue',environment,city:cityName,httpStatus:result.status??null,returnedHotels:data.length,...(result.failed?{code:result.code||'PROVIDER_REJECTED'}:{}),sampleNames:data.slice(0,2).map(h=>h.name).filter(n=>typeof n==='string').map(n=>n.slice(0,160))}));
 if(cityName==='Kuala Lumpur')hotels=data;
 if(result.status===401||result.status===403||result.status===429||result.code)process.exit(1);
}
const hotelIds=hotels.map(h=>h.id||h.hotelId).filter(id=>typeof id==='string').slice(0,5);
if(!hotelIds.length){console.info('LITEAPI_NO_TEST_HOTELS');process.exit(1);}
const checkin='2026-11-10',checkout='2026-11-12';
const result=await request('hotels/rates',{hotelIds,checkin,checkout,currency:'IDR',guestNationality:'ID',occupancies:[{adults:2,children:[]}],timeout:12,maxRatesPerHotel:process.argv.includes('--checkout')?12:1,includeHotelData:true});
const data=Array.isArray(result.payload?.data)?result.payload.data:[];
const parsed=data.flatMap(h=>{const hotel=hotels.find(v=>(v.id||v.hotelId)===h.hotelId);return hotel?(h.roomTypes||[]).map(offer=>checkedLiteOffer(hotel,offer,{people:2},{id:'qa',checkin,checkout,rooms:1})).filter(Boolean):[];});
const samples=data.slice(0,3).map(h=>{
 const room=h.roomTypes?.[0],rate=room?.rates?.[0],total=room?.offerRetailRate?.amount??rate?.retailRate?.total?.[0]?.amount;
 const currency=room?.offerRetailRate?.currency??rate?.retailRate?.total?.[0]?.currency;
 return {hotelName:h.hotelData?.name||hotels.find(x=>(x.id||x.hotelId)===h.hotelId)?.name||null,roomTypes:Array.isArray(h.roomTypes)?h.roomTypes.length:0,roomName:typeof rate?.name==='string'?rate.name.slice(0,160):null,returnedTotal:Number.isFinite(Number(total))&&total!=null?Number(total):null,currency:typeof currency==='string'&&/^[A-Z]{3}$/.test(currency)?currency:null,publicRateType:room?.rateType,adultCount:rate?.adultCount,childCount:rate?.childCount,taxBreakdownPresent:Array.isArray(rate?.retailRate?.taxesAndFees),allTaxesIncluded:Array.isArray(rate?.retailRate?.taxesAndFees)&&rate.retailRate.taxesAndFees.every(x=>x.included===true),publicPricePresent:Array.isArray(rate?.retailRate?.suggestedSellingPrice),validatedPublicTotal:parsed.find(x=>x.hotelId===h.hotelId)?.amountIDR??null,hotelFields:knownKeys(h),roomFields:knownKeys(room),rateFields:knownKeys(rate)};
});
console.info(JSON.stringify({phase:'rates',environment,city:'Kuala Lumpur',httpStatus:result.status??null,checkin,checkout,nights:2,rooms:1,adults:2,requestedCurrency:'IDR',hotelsWithRates:data.length,validatedOfferCount:parsed.length,...(result.failed?{code:result.code||'PROVIDER_REJECTED'}:{}),samples,bookingPerformed:false,productionRatesVerified:false}));
if(result.failed||!data.length)process.exitCode=1;
if(process.argv.includes('--checkout')){
 const selected=parsed.sort((a,b)=>a.amountIDR-b.amountIDR)[0];
 console.info(JSON.stringify({phase:'checkout_room_validation',environment:'sandbox',validatedOfferCount:parsed.length,hotelName:selected?.hotelName||null,checkoutPath:selected?hotelCheckoutUrl(selected.hotelId,checkin,checkout,2):null,paymentStarted:false,bookingPerformed:false}));
 if(!selected)process.exitCode=1;
}
