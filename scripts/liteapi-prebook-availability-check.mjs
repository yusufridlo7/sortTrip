// Sandbox availability diagnosis only. No SDK session, guest data, Book,
// payment, or database changes. Never emit provider bodies/identifiers.
import {checkoutMode} from '../worker/hotel-checkout.js';
if(checkoutMode(process.env)!=='sandbox')throw Error('SANDBOX_REQUIRED');
const key=process.env.LITEAPI_API_KEY;
async function request(host,path,body){
 const response=await fetch(`https://${host}.liteapi.travel/v3.0/${path}`,{method:'POST',redirect:'manual',headers:{'X-API-Key':key,'Content-Type':'application/json'},body:JSON.stringify(body),signal:AbortSignal.timeout(120000)});
 let data;try{data=await response.json();}catch{}
 return {status:response.status,data};
}
try{
 const rates=await request('api','hotels/rates',{hotelIds:['lp18e557'],checkin:'2026-11-10',checkout:'2026-11-12',currency:'IDR',guestNationality:'ID',occupancies:[{adults:2,children:[]}],timeout:12,maxRatesPerHotel:2});
 const offer=rates.data?.data?.[0]?.roomTypes?.[0]?.offerId;
 console.info(JSON.stringify({phase:'fresh_rates',httpStatus:rates.status,offerAvailable:typeof offer==='string'}));
 if(typeof offer==='string'){
  const result=await request('book','rates/prebook',{offerId:offer,usePaymentSdk:false});
  const code=result.data?.error?.code??result.data?.code;
  const safeCodes=new Set(['400','401','403','408','429','1001','1002','1003','2001','2002','2003','2004','INVALID_OFFER_ID','OUTDATED_OFFER_ID','UNAUTHORIZED']);
  console.info(JSON.stringify({phase:'availability_only',httpStatus:result.status,providerCode:safeCodes.has(String(code))?String(code):null,sdkRequested:false,paymentStarted:false,bookingPerformed:false,recordsChanged:false}));
 }
}catch{console.info('AVAILABILITY_NETWORK_UNAVAILABLE');process.exitCode=1;}
