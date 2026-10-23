import {bookingStatisticsQuery,bookingStatisticsRows} from './travelpayouts-bookings.js';
import {bookingItemKey,flightSourceUrl} from './booking-identity.mjs';
import {verifiedBooking} from './hotel-checkout.js';
import {assertLiteApiFreeEndpoint} from './liteapi-cost-policy.js';
const reply=(body,status=200)=>Response.json(body,{status,headers:{'Cache-Control':'no-store','Referrer-Policy':'no-referrer','X-Content-Type-Options':'nosniff'}});
const uuid=v=>typeof v==='string'&&/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i.test(v);
const cache=new Map();
const fieldCache=new Map();
export function hotelReceipt(row,trip,tripId){
 if(row.environment!=='live'||!['confirmed','cancelled','booking','unknown'].includes(row.state)||row.summary?.tripId!==tripId||(['confirmed','cancelled'].includes(row.state)&&!row.booking_id))return null;
 const item=trip.items.find(i=>i.id===row.summary.itemId);const matchKey=bookingItemKey(trip,item);
 if(!item||!matchKey||item.category!=='Penginapan'||item.hotelId!==row.summary.hotelId||item.checkin!==row.summary.checkin||item.checkout!==row.summary.checkout||trip.people!==row.summary.adults)return null;
 return {tripId,itemId:item.id,matchKey,provider:'LiteAPI',state:['booking','unknown'].includes(row.state)?'pending':row.state,checkedAt:row.updated_at,checkoutId:row.id,...(row.booking_id?{reference:row.booking_id}:{})};
}
export async function flightTrackingId(userId,tripId,matchKey,key){
 const hmac=await crypto.subtle.importKey('raw',new TextEncoder().encode(key),{name:'HMAC',hash:'SHA-256'},false,['sign']);
 const bytes=new Uint8Array(await crypto.subtle.sign('HMAC',hmac,new TextEncoder().encode(JSON.stringify(['sorttrip-flight-v1',userId,tripId,matchKey]))));
 return 'stf_'+Array.from(bytes.slice(0,16),b=>b.toString(16).padStart(2,'0')).join('');
}
export function trackedFlightUrl(source,subId,configuredMarker){
 try{const u=new URL(source),marker=String(configuredMarker||u.searchParams.get('marker')||'').split('.')[0];if(u.origin!=='https://www.aviasales.com'||!u.pathname.startsWith('/search/')||!/^\d{1,20}$/.test(marker)||!/^stf_[a-f0-9]{32}$/.test(subId))return null;u.searchParams.set('marker',marker+'.'+subId);return u.href;}catch{return null;}
}
export function affiliateReceipt(rows,subId,itemId,matchKey,tripId){
 const matched=rows.filter(r=>r&&[subId,'.'+subId].includes(r.sub_id)&&r.action_type==='booking'&&typeof r.action_id==='string'&&['paid','processing','canceled','cancelled'].includes(r.state)).sort((a,b)=>String(b.updated_at||b.date||'').localeCompare(String(a.updated_at||a.date||'')));
 if(!matched.length)return null;
 // Multiple unrelated orders under one click cannot identify the intended ticket.
 if(new Set(matched.map(r=>r.action_id)).size!==1)return null;
 const row=matched[0];return {tripId,itemId,matchKey,provider:'Travelpayouts',state:row.state==='paid'?'reported':row.state==='processing'?'pending':'cancelled',checkedAt:new Date().toISOString()};
}
export async function handleBookingEvidence(request,env,fetcher=fetch){
 if(request.method!=='POST')return reply({error:'booking_method'},405);
 const u=new URL(request.url);if(request.headers.get('Origin')&&request.headers.get('Origin')!==u.origin)return reply({error:'booking_origin'},403);
 if(!env.SUPABASE_URL||!env.SUPABASE_SERVICE_ROLE_KEY||!env.SUPABASE_PUBLISHABLE_KEY)return reply({error:'booking_unavailable'},503);
 const auth=request.headers.get('Authorization')||'';if(!/^Bearer [\w.-]+$/.test(auth))return reply({error:'booking_login'},401);
 try{
  const raw=await request.text();if(raw.length>5000)return reply({error:'booking_invalid'},400);const b=JSON.parse(raw);if(!uuid(b.tripId))return reply({error:'booking_save_first'},400);
  const base=new URL(env.SUPABASE_URL);if(base.protocol!=='https:'||base.username||base.password||base.pathname!=='/'||base.search||base.hash)return reply({error:'booking_unavailable'},503);
  const userResponse=await fetcher(base.origin+'/auth/v1/user',{headers:{Authorization:auth,apikey:env.SUPABASE_PUBLISHABLE_KEY},signal:AbortSignal.timeout(10000),redirect:'manual'});if(!userResponse.ok)return reply({error:'booking_login'},401);const user=await userResponse.json();if(!uuid(user.id))return reply({error:'booking_login'},401);
  if(!env.AI_LIMITER||(await env.AI_LIMITER.limit({key:'booking-evidence:'+u.pathname.split('/').at(-1)+':'+user.id})).success!==true)return reply({error:'booking_limit'},429);
  const db=async(path,body)=>{const r=await fetcher(base.origin+'/rest/v1/'+path,{method:body?'PATCH':'GET',headers:{Authorization:'Bearer '+env.SUPABASE_SERVICE_ROLE_KEY,apikey:env.SUPABASE_SERVICE_ROLE_KEY,'Content-Type':'application/json',Prefer:'return=representation'},...(body?{body:JSON.stringify(body)}:{}),redirect:'manual',signal:AbortSignal.timeout(10000)});if(!r.ok){const error=Error('storage');error.status=r.status;throw error;}return r.json();};
  const [stored]=await db('trips?select=id,data,updated_at&id=eq.'+b.tripId+'&user_id=eq.'+user.id);if(!stored||!Array.isArray(stored.data?.items))return reply({error:'booking_missing'},404);const trip=stored.data;
  if(u.pathname==='/api/bookings/flight-link'){
   const item=trip.items.find(i=>i.id===b.itemId&&i.category==='Pesawat'),matchKey=bookingItemKey(trip,item);
   if(!item||!matchKey||matchKey!==b.matchKey)return reply({error:'booking_changed'},409);
   if(!env.TRAVELPAYOUTS_API_TOKEN)return reply({error:'booking_tracking_unavailable'},503);
   const subId=await flightTrackingId(user.id,b.tripId,matchKey,env.TRAVELPAYOUTS_API_TOKEN),url=trackedFlightUrl(flightSourceUrl(trip,item),subId,env.TRAVELPAYOUTS_MARKER);
   return url?reply({url}):reply({error:'booking_marker_required'},503);
  }
  if(u.pathname!=='/api/bookings/status')return reply({error:'booking_invalid'},404);
  const receipts=[],availability={hotels:'available',flights:'not_configured'};
  try{
   const rows=await db('hotel_checkouts?select=id,state,environment,summary,booking_id,updated_at&user_id=eq.'+user.id+'&environment=eq.live&state=in.(confirmed,cancelled,booking,unknown)&summary->>tripId=eq.'+b.tripId+'&order=updated_at.desc&limit=30');
   for(const row of rows){
    if(b.refresh===true&&['confirmed','booking','unknown'].includes(row.state)&&env.LITEAPI_ENABLED==='true'&&/^(prod_|live_)/.test(env.LITEAPI_API_KEY||'')&&rows.indexOf(row)<3){
     try{assertLiteApiFreeEndpoint('bookings','GET','book');const r=await fetcher('https://book.liteapi.travel/v3.0/bookings?'+new URLSearchParams({clientReference:row.id,timeout:'4'}),{headers:{'X-API-Key':env.LITEAPI_API_KEY,Accept:'application/json'},redirect:'manual',signal:AbortSignal.timeout(10000)});if(!r.ok)throw Error();const data=await r.json();if(data.sandbox===true)throw Error();const verified=(data.data||[]).map(d=>verifiedBooking(d,row)).find(Boolean);if(verified){const [updated]=await db('hotel_checkouts?id=eq.'+row.id+'&user_id=eq.'+user.id,{...verified,updated_at:new Date().toISOString()});Object.assign(row,updated);}}catch{availability.hotels='partial';}
    }
    const receipt=hotelReceipt(row,trip,b.tripId);if(receipt&&!receipts.some(r=>r.itemId===receipt.itemId))receipts.push(receipt);
   }
  }catch(error){availability.hotels='unavailable';if(Number.isInteger(error?.status))availability.hotelHttpStatus=String(error.status);}
  if(env.TRAVELPAYOUTS_API_TOKEN){
   const flights=trip.items.filter(i=>i.category==='Pesawat'&&bookingItemKey(trip,i)).slice(0,2);availability.flights=flights.length?'marker_required':'not_applicable';
   for(const item of flights){const matchKey=bookingItemKey(trip,item),subId=await flightTrackingId(user.id,b.tripId,matchKey,env.TRAVELPAYOUTS_API_TOKEN);if(!trackedFlightUrl(flightSourceUrl(trip,item),subId,env.TRAVELPAYOUTS_MARKER))continue;
    const cacheKey=user.id+'|'+subId,existing=cache.get(cacheKey);let data;
    if(existing&&existing.until>Date.now()){data=existing.data;availability.flights='available';}else try{
     const wanted=['action_id','type','campaign_id','sub_type','action_type','sub_id','state','date','updated_at'];
     let fields=fieldCache.get(user.id);
     if(!fields||fields.until<Date.now()){
      const capabilities=await fetcher('https://api.travelpayouts.com/statistics/v1/get_fields_list?campaign_id=100',{headers:{'X-Access-Token':env.TRAVELPAYOUTS_API_TOKEN,Accept:'application/json'},redirect:'manual',signal:AbortSignal.timeout(10000)});
      availability.flightFieldsHttp=String(capabilities.status);
      if(capabilities.ok){const description=await capabilities.json();const values=Array.isArray(description.fields)?description.fields:[];fields={until:Date.now()+600000,values:values.filter(f=>f&&wanted.includes(f.name)).map(f=>({name:f.name,filters:Array.isArray(f.available_filters)?f.available_filters:[],...(['type','state','action_type','sub_type'].includes(f.name)&&Array.isArray(f.available_values)?{values:f.available_values.filter(v=>typeof v==='string'&&/^[a-z_]{1,40}$/.test(v))}:{})}))};if(fieldCache.size>=200)fieldCache.delete(fieldCache.keys().next().value);fieldCache.set(user.id,fields);}
     }
     const known=fields?.values||[];availability.flightFields=known.map(f=>f.name).join(',');availability.flightSchema=JSON.stringify(known.filter(f=>['type','state','action_type','sub_type','sub_id'].includes(f.name)));
     let query;try{query=bookingStatisticsQuery(known,subId);}catch{availability.flightQueryIssue='REQUIRED_FIELDS_UNAVAILABLE';throw Error('schema');}
     const r=await fetcher('https://api.travelpayouts.com/statistics/v1/execute_query',{method:'POST',headers:{'X-Access-Token':env.TRAVELPAYOUTS_API_TOKEN,'Content-Type':'application/json'},body:JSON.stringify(query),redirect:'manual',signal:AbortSignal.timeout(12000)});availability.flightHttpStatus=String(r.status);if(!r.ok){const error=Error('stats');error.kind=[401,403].includes(r.status)?'access_required':r.status===429?'rate_limited':'unavailable';if(r.status===400){const failure=await r.text();availability.flightQueryIssue=/action_type/i.test(failure)?'ACTION_TYPE_REJECTED':/sub_id/i.test(failure)?'SUB_ID_REJECTED':/sort/i.test(failure)?'SORT_REJECTED':/date|period|range/i.test(failure)?'DATE_REJECTED':/filter/i.test(failure)?'FILTER_REJECTED':/field|column/i.test(failure)?'FIELD_REJECTED':'REQUEST_REJECTED';}throw error;}const raw=await r.text();if(raw.length>200000)throw Error();data={results:bookingStatisticsRows(JSON.parse(raw),query)};if(cache.size>=200)cache.delete(cache.keys().next().value);cache.set(cacheKey,{until:Date.now()+60000,data});availability.flights='available';
    }catch(error){availability.flights=['access_required','rate_limited'].includes(error?.kind)?error.kind:'unavailable';continue;}
    const receipt=affiliateReceipt(data.results,subId,item.id,matchKey,b.tripId);if(receipt)receipts.push(receipt);
   }
  }
  // Atomically preserve concurrent itinerary edits. Provider evidence itself
  // remains in private checkout records; client JSON never grants verification.
  let saved=false;
  const items=trip.items.map(item=>{const receipt=receipts.find(r=>r.provider==='LiteAPI'&&r.itemId===item.id&&r.matchKey===bookingItemKey(trip,item));if(!receipt)return item;if(receipt.state==='cancelled')return item.bookingHold?{...item,bookingHold:false}:item;return {...item,bookingHold:receipt.state==='pending',...(receipt.state==='confirmed'?{paid:true}:{}),manualPaid:item.manualPaid??(item.purchaseSource==='provider'?false:item.paid),purchaseSource:'provider',purchaseMatchKey:receipt.matchKey,purchaseTripId:b.tripId};});
  if(typeof stored.updated_at==='string'&&JSON.stringify(items)!==JSON.stringify(trip.items))try{const changed=await db('trips?id=eq.'+b.tripId+'&user_id=eq.'+user.id+'&updated_at=eq.'+encodeURIComponent(stored.updated_at),{data:{...trip,items}});saved=changed.length===1;}catch{}
  return reply({receipts,availability,saved,checkedAt:new Date().toISOString()});
 }catch{return reply({error:'booking_unavailable'},502);}
}
