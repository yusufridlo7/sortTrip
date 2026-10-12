import {checkedHotelQuote,datedHotelUrl} from './trip-hotel-browser.js';

export function externalHotelServiceConfigured(env){
 try{const u=new URL(env.HOTEL_PRICE_SERVICE_URL);return env.HOTEL_PRICE_SERVICE_ENABLED==='true'&&u.protocol==='https:'&&!u.port&&!u.username&&!u.password&&!u.search&&!u.hash&&u.pathname==='/v1/hotel-prices'&&!/^(localhost|127\.|0\.|10\.|192\.168\.|169\.254\.|172\.(?:1[6-9]|2\d|3[01])\.|\[|.*\.local$)/i.test(u.hostname)&&typeof env.HOTEL_PRICE_SERVICE_TOKEN==='string'&&env.HOTEL_PRICE_SERVICE_TOKEN.length>=32;}catch{return false;}
}
export async function externalHotelPrices(q,targets,env,deadline,diagnostics={},fetcher=fetch){
 if(!externalHotelServiceConfigured(env))return [];
 const hotels=targets.filter(t=>t.category==='Penginapan'&&datedHotelUrl(t,q.people)).slice(0,3);
 if(!hotels.length||deadline-Date.now()<1000)return [];
 try{
  const response=await fetcher(env.HOTEL_PRICE_SERVICE_URL,{method:'POST',redirect:'error',signal:AbortSignal.timeout(Math.min(50000,deadline-Date.now())),headers:{'Content-Type':'application/json',Authorization:'Bearer '+env.HOTEL_PRICE_SERVICE_TOKEN},body:JSON.stringify({people:q.people,targets:hotels.map(t=>({id:t.id,title:t.title,category:t.category,sourceUrl:t.sourceUrl,checkin:t.checkin,checkout:t.checkout,rooms:t.rooms}))})});
  if(!response.ok)return [];
  const text=await response.text();if(text.length>100000)return [];
  const data=JSON.parse(text);if(data.accessRequired===true)diagnostics.hotelAccessRequired=true;
  const seen=new Set();
  return (Array.isArray(data.observations)?data.observations:[]).slice(0,3).flatMap(value=>{
   const target=hotels.find(t=>t.id===value?.id);if(!target||seen.has(target.id))return [];
   const quote=checkedHotelQuote(target,q.people,value.observation);if(!quote)return [];seen.add(target.id);return [quote];
  });
 }catch{return [];}
}
