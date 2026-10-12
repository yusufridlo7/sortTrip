import {browserHotelPrices,datedHotelUrl,hotelPropertyUrl} from '../../worker/trip-hotel-browser.js';

export function validateRequest(input){
 if(!input||!Number.isInteger(input.people)||input.people<1||input.people>2||!Array.isArray(input.targets)||input.targets.length<1||input.targets.length>3)throw Error('INVALID_REQUEST');
 const ids=new Set();
 const targets=input.targets.map(t=>{
  if(!t||typeof t.id!=='string'||!t.id||t.id.length>120||ids.has(t.id)||typeof t.title!=='string'||!t.title.trim()||t.title.length>160||t.category!=='Penginapan')throw Error('INVALID_REQUEST');
  ids.add(t.id);
  const target={id:t.id,title:t.title.trim(),category:'Penginapan',sourceUrl:hotelPropertyUrl(t.sourceUrl),checkin:t.checkin,checkout:t.checkout,rooms:t.rooms};
  if(!datedHotelUrl(target,input.people)||Date.parse(target.checkout)-Date.parse(target.checkin)>31*86400000)throw Error('INVALID_REQUEST');
  return target;
 });
 return {people:input.people,targets};
}

export async function collectHotelObservations(input,launch){
 const q=validateRequest(input),observations=[],diagnostics={onHotelObservation:(id,observation)=>observations.push({id,observation})};
 // Same validators as Worker; no AI, Supabase, owner sessions or booking operations.
 await browserHotelPrices(q,q.targets,{HOTEL_BROWSER_ENABLED:'true',HOTEL_BROWSER:{}},Date.now()+45000,diagnostics,launch);
 return {observations,accessRequired:!!diagnostics.hotelAccessRequired,status:observations.length?'VERIFIED':diagnostics.hotelAccessRequired?'ACCESS_REQUIRED':diagnostics.hotelUnavailableStage==='HOTEL_BROWSER_PRICE_NOT_RENDERED'?'PRICE_NOT_RENDERED':'UNAVAILABLE'};
}
