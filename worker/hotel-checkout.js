import {bookingItemKey} from './booking-identity.mjs';
import {checkedLiteOffer} from './lite-hotel.js';
import {assertLiteApiFreeEndpoint} from './liteapi-cost-policy.js';
const reply=(body,status=200)=>Response.json(body,{status,headers:{'Cache-Control':'no-store','X-Content-Type-Options':'nosniff','Referrer-Policy':'no-referrer'}});
const uuid=v=>typeof v==='string'&&/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(v);
const identifier=v=>typeof v==='string'&&/^[A-Za-z0-9_-]{1,100}$/.test(v);
const day=v=>typeof v==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(v)&&Number.isFinite(Date.parse(v))&&new Date(v).toISOString().slice(0,10)===v;
export function checkoutMode(env){
 const key=env.LITEAPI_API_KEY;
 if(env.LITEAPI_CHECKOUT_ENABLED!=='true'||typeof key!=='string'||key.length<9)return null;
 if(env.LITEAPI_CHECKOUT_MODE==='sandbox'&&/^(sand_|sandbox_)/.test(key)&&uuid(env.OWNER_USER_ID))return 'sandbox';
 // Production intentionally gated separately; preparation is not approval to charge.
 if(env.LITEAPI_CHECKOUT_MODE==='live'&&env.LITEAPI_BOOKING_LIVE_APPROVED==='true'&&/^(prod_|live_)/.test(key))return 'live';
 return null;
}
export function checkoutQuery(b){
 if(!identifier(b.hotelId)||!day(b.checkin)||!day(b.checkout)||b.checkin<new Date().toISOString().slice(0,10)||b.checkout<=b.checkin||Date.parse(b.checkout)-Date.parse(b.checkin)>31*86400000||!Number.isInteger(b.people)||b.people<1||b.people>8)throw Error('hotel_checkout_invalid');
 if((b.tripId||b.itemId)&&(!uuid(b.tripId)||typeof b.itemId!=='string'||!b.itemId.length||b.itemId.length>120))throw Error('hotel_checkout_invalid');
 return {...(b.tripId?{tripId:b.tripId,itemId:b.itemId}:{}),hotelId:b.hotelId,checkin:b.checkin,checkout:b.checkout,adults:b.people,rooms:Math.ceil(b.people/2)};
}
export function checkoutGuests(b,rooms){
 const name=v=>typeof v==='string'&&v.trim().length>=1&&v.length<=80&&!/[\x00-\x1f<>]/.test(v);
 const email=v=>typeof v==='string'&&v.length<=254&&/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
 if(!name(b.holder?.firstName)||!name(b.holder?.lastName)||!email(b.holder?.email)||!Array.isArray(b.guests)||b.guests.length!==rooms)throw Error('hotel_checkout_guests');
 const guests=b.guests.map((g,i)=>{if(!name(g.firstName)||!name(g.lastName))throw Error('hotel_checkout_guests');return {occupancyNumber:i+1,firstName:g.firstName.trim(),lastName:g.lastName.trim(),email:b.holder.email.trim()};});
 return {holder:{firstName:b.holder.firstName.trim(),lastName:b.holder.lastName.trim(),email:b.holder.email.trim()},guests};
}
export function checkoutPayable(data,amountIDR){
 const fail=reason=>{const e=Error('hotel_checkout_prebook_failed');e.validationReason=reason;throw e;};
 const payable=data.price??(data.retailRate?.total?.length===1&&data.retailRate.total[0].currency==='IDR'?data.retailRate.total[0].amount:null);
 if(payable===null||!['number','string'].includes(typeof payable)||!String(payable).trim()||!Number.isFinite(Number(payable))||Number(payable)<=0)fail('payable_missing');
 if(Math.abs(Number(payable)-amountIDR)>0.01)fail('payable_mismatch');
 // Supplier documents termsAndConditions as optional. Absence is not a price failure;
 // room cancellation rules and explicit final consent are still mandatory.
 const terms=data.termsAndConditions??'';
 if(typeof terms!=='string'||terms.length>20000)fail('terms_invalid');
 return {terms};
}
// Encrypt supplier identifiers, payment client secret and guest details at rest.
// Derive a purpose-specific AES key from the existing runtime key; never log it.
async function cryptKey(env){return crypto.subtle.importKey('raw',await crypto.subtle.digest('SHA-256',new TextEncoder().encode('sorttrip-hotel-checkout-v1:'+env.LITEAPI_API_KEY)),{name:'AES-GCM'},false,['encrypt','decrypt']);}
export async function sealCheckout(env,data){const iv=crypto.getRandomValues(new Uint8Array(12)),encrypted=new Uint8Array(await crypto.subtle.encrypt({name:'AES-GCM',iv},await cryptKey(env),new TextEncoder().encode(JSON.stringify(data))));return btoa(String.fromCharCode(...iv))+'.'+btoa(String.fromCharCode(...encrypted));}
export async function openCheckout(env,value){const [iv,data]=value.split('.');return JSON.parse(new TextDecoder().decode(await crypto.subtle.decrypt({name:'AES-GCM',iv:Uint8Array.from(atob(iv),c=>c.charCodeAt(0))},await cryptKey(env),Uint8Array.from(atob(data),c=>c.charCodeAt(0)))));}
const publicCheckout=r=>({id:r.id,state:r.state,environment:r.environment,summary:r.summary,expiresAt:r.expires_at,...(r.state==='confirmed'?{bookingId:r.booking_id,confirmationCode:r.confirmation_code}:{} )});
const cancellation=rates=>rates.map(r=>({refundableTag:r.cancellationPolicies.refundableTag,cancelPolicyInfos:(r.cancellationPolicies.cancelPolicyInfos||[]).slice(0,8).map(p=>({cancelTime:typeof p.cancelTime==='string'?p.cancelTime.slice(0,40):'',amount:Number.isFinite(Number(p.amount))?Number(p.amount):null,currency:/^[A-Z]{3}$/.test(p.currency||'')?p.currency:null}))}));
export function verifiedBooking(data,row){
 if(!identifier(data?.bookingId)||data.clientReference!==row.id||data.hotel?.hotelId!==row.summary.hotelId||data.checkin!==row.summary.checkin||data.checkout!==row.summary.checkout||!['CONFIRMED','CANCELLED','CANCELED','CANCELLED_WITH_CHARGES'].includes(data.status))return null;
 return {state:data.status==='CONFIRMED'?'confirmed':'cancelled',booking_id:data.bookingId,confirmation_code:typeof data.hotelConfirmationCode==='string'&&data.hotelConfirmationCode.length<=100?data.hotelConfirmationCode:null};
}
export async function handleHotelCheckout(request,env,fetcher=fetch){
 const path=new URL(request.url).pathname,mode=checkoutMode(env);
 const action=path.slice('/api/hotels/checkout/'.length);
 if(request.headers.get('Origin')&&request.headers.get('Origin')!==new URL(request.url).origin)return reply({error:'hotel_origin_rejected'},403);
 if(!['GET','POST'].includes(request.method))return reply({error:'hotel_post_required'},405);
 if(!['rooms','prebook','payment','book','status','history'].includes(action))return reply({error:'hotel_checkout_invalid'},400);
 if(!mode||!env.SUPABASE_URL||!env.SUPABASE_SERVICE_ROLE_KEY||!env.SUPABASE_PUBLISHABLE_KEY)return reply({error:'hotel_checkout_not_ready'},503);
 const auth=request.headers.get('Authorization')||'';
 if(!/^Bearer [\w.-]+$/.test(auth))return reply({error:'hotel_checkout_login'},401);
 let databaseOrigin;try{const u=new URL(env.SUPABASE_URL);if(u.protocol!=='https:'||u.username||u.password||u.search||u.hash||u.pathname!=='/')throw Error();databaseOrigin=u.origin;}catch{return reply({error:'hotel_checkout_storage'},503);}
 async function db(path,body,method=body?'POST':'GET'){
  try{
  const r=await fetcher(databaseOrigin+'/rest/v1/'+path,{method,redirect:'manual',headers:{apikey:env.SUPABASE_SERVICE_ROLE_KEY,Authorization:'Bearer '+env.SUPABASE_SERVICE_ROLE_KEY,'Content-Type':'application/json',Prefer:'return=representation'},...(body?{body:JSON.stringify(body)}:{}),signal:AbortSignal.timeout(10000)});
  if(!r.ok)throw Error('hotel_checkout_storage');return await r.json();
  }catch{throw Error('hotel_checkout_storage');}
 }
 async function api(path,body,host='book'){
  assertLiteApiFreeEndpoint(path,body?'POST':'GET',host);
  try{
  const r=await fetcher('https://'+(host==='book'?'book':'api')+'.liteapi.travel/v3.0/'+path,{method:body?'POST':'GET',redirect:'manual',headers:{'X-API-Key':env.LITEAPI_API_KEY,Accept:'application/json',...(body?{'Content-Type':'application/json'}:{})},...(body?{body:JSON.stringify(body)}:{}),signal:AbortSignal.timeout(body&&host==='book'?120000:20000)});
  if(!r.ok){const error=Error('hotel_checkout_supplier');error.providerStatus=r.status;throw error;}const raw=await r.text();if(raw.length>2000000||raw.includes(env.LITEAPI_API_KEY))throw Error('hotel_checkout_supplier');const data=JSON.parse(raw);if(mode==='live'&&data.sandbox===true)throw Error('hotel_checkout_supplier');return data;
  }catch(e){const error=Error('hotel_checkout_supplier');if(Number.isInteger(e?.providerStatus)&&e.providerStatus>=300&&e.providerStatus<=599)error.providerStatus=e.providerStatus;throw error;}
 }
 try{
  const ur=await fetcher(databaseOrigin+'/auth/v1/user',{headers:{Authorization:auth,apikey:env.SUPABASE_PUBLISHABLE_KEY},signal:AbortSignal.timeout(10000)});if(!ur.ok)return reply({error:'hotel_checkout_login'},401);
  const user=await ur.json();if(!uuid(user.id)||mode==='sandbox'&&user.id!==env.OWNER_USER_ID)return reply({error:'hotel_checkout_login'},403);
  // Each stage has a separate prefixed counter; normal rooms→prebook→payment
  // progression must not exhaust a shared two-requests/minute allowance.
  if(!env.AI_LIMITER||(await env.AI_LIMITER.limit({key:'hotel-checkout:'+action+':'+user.id})).success!==true)return reply({error:'hotel_search_limit'},429);
  let b={};if(request.method==='POST'){const text=await request.text();if(text.length>12000)return reply({error:'hotel_checkout_invalid'},400);try{b=JSON.parse(text)}catch{return reply({error:'hotel_checkout_invalid'},400);}}
  if(path==='/api/hotels/checkout/history'&&request.method==='GET')return reply({checkouts:(await db('hotel_checkouts?user_id=eq.'+user.id+'&environment=eq.'+mode+'&state=neq.selected&order=created_at.desc&limit=20')).map(publicCheckout)});
  if(path==='/api/hotels/checkout/rooms'&&request.method==='POST'){
   let q;try{q=checkoutQuery(b)}catch{return reply({error:'hotel_checkout_invalid'},400);}
   if(q.tripId){const [saved]=await db('trips?select=id,data&id=eq.'+q.tripId+'&user_id=eq.'+user.id);const item=saved?.data?.items?.find(x=>x.id===q.itemId);if(!item||!bookingItemKey(saved.data,item)||item.category!=='Penginapan'||item.hotelId!==q.hotelId||item.checkin!==q.checkin||item.checkout!==q.checkout||saved.data.people!==q.adults)return reply({error:'booking_changed'},409);}
   // Require storage before a supplier call. No user-controlled offer/price accepted.
   await db('hotel_checkouts?select=id&limit=0');
   const detail=await api('data/hotel?'+new URLSearchParams({hotelId:q.hotelId}),null,'api'),hotel={...detail.data,id:q.hotelId};
   if(detail.data?.id!==q.hotelId)return reply({error:'hotel_checkout_supplier'},502);
   const occupancies=Array.from({length:q.rooms},(_,i)=>({adults:Math.min(2,q.adults-i*2),children:[]}));
   const rates=await api('hotels/rates',{hotelIds:[q.hotelId],checkin:q.checkin,checkout:q.checkout,currency:'IDR',guestNationality:'ID',occupancies,timeout:12,maxRatesPerHotel:12},'api');
   const options=[],rejections={},matching=(rates.data||[]).filter(h=>h.hotelId===q.hotelId);
   const returnedOffers=matching.reduce((n,h)=>n+(Array.isArray(h.roomTypes)?h.roomTypes.length:0),0);
   for(const h of matching)for(const offer of (h.roomTypes||[])){
    const quote=checkedLiteOffer(hotel,offer,{people:q.adults},{...q,id:'checkout'},rejections,{memberCheckout:true});if(!quote||typeof offer.offerId!=='string'||offer.offerId.length>20000||offer.offerId.length<1)continue;
    const id=crypto.randomUUID(),summary={...q,hotelName:quote.hotelName,roomType:quote.roomType,amountIDR:quote.amountIDR,policy:quote.policy,taxesIncluded:true,cancellation:offer.rates.map(r=>r.cancellationPolicies)};
    // Keep provider policy text/objects server-side; sanitize display fields below.
    summary.cancellation=cancellation(offer.rates);
    const row={id,user_id:user.id,environment:mode,state:'selected',summary,sealed_payload:await sealCheckout(env,{offerId:offer.offerId}),expires_at:new Date(Date.now()+15*60000).toISOString()};
    await db('hotel_checkouts',row);options.push(publicCheckout(row));if(options.length>=8)break;
   }
   return reply({options,...(!options.length?{reason:returnedOffers?'hotel_checkout_rates_filtered':'hotel_no_results',rejections}:{})});
  }
  const id=request.method==='GET'?new URL(request.url).searchParams.get('id'):b.id;if(!uuid(id))return reply({error:'hotel_checkout_invalid'},400);
  const [row]=await db('hotel_checkouts?id=eq.'+id+'&user_id=eq.'+user.id+'&environment=eq.'+mode);if(!row)return reply({error:'hotel_checkout_missing'},404);
  const update=async(fields)=>{const [saved]=await db('hotel_checkouts?id=eq.'+id+'&user_id=eq.'+user.id,{...fields,updated_at:new Date().toISOString()},'PATCH');return saved;};
  if(path==='/api/hotels/checkout/status'&&request.method==='GET'){
   if(['booking','unknown'].includes(row.state)){
    const list=await api('bookings?'+new URLSearchParams({clientReference:id,timeout:'4'}));
    const valid=(Array.isArray(list.data)?list.data:[]).map(data=>verifiedBooking(data,row)).find(Boolean);
    if(valid)return reply(publicCheckout(await update({...valid,sealed_payload:await sealCheckout(env,{})})));
   }
   return reply(publicCheckout(row));
  }
  if(path==='/api/hotels/checkout/payment'&&request.method==='POST'){
   if(b.acceptFinalTerms!==true||row.state!=='ready'||Date.parse(row.expires_at)<=Date.now())return reply({error:'hotel_checkout_locked'},409);
   const payload=await openCheckout(env,row.sealed_payload);
   await update({sealed_payload:await sealCheckout(env,{...payload,finalTermsAccepted:true})});
   return reply({...publicCheckout(row),payment:{publicKey:mode,secretKey:payload.secretKey,returnUrl:new URL('/hotel-checkout?checkoutId='+id,new URL(request.url).origin).href}});
  }
  if(path==='/api/hotels/checkout/prebook'&&request.method==='POST'){
   if(row.state==='failed')return reply({error:'hotel_checkout_failed'},409);
   if(row.state==='selected'&&Date.parse(row.expires_at)<=Date.now())return reply({error:'hotel_checkout_expired'},409);
   let guests;try{guests=checkoutGuests(b,row.summary.rooms);if(b.acceptTerms!==true)throw Error();}catch{return reply({error:'hotel_checkout_guests'},400);}
   const [claimed]=await db('rpc/claim_hotel_checkout',{p_id:id,p_user:user.id,p_environment:mode,p_from:'selected',p_to:'prebooking'});if(!claimed)return reply({error:'hotel_checkout_locked'},409);
   let failureStage='selection_decode';
   try{
    const payload=await openCheckout(env,claimed.sealed_payload);
    failureStage='supplier_request';
    const result=await api('rates/prebook',{offerId:payload.offerId,usePaymentSdk:true});const d=result.data;
    failureStage='room_price_validation';
    // Re-run exact public-price/occupancy/tax checks against prebook room rates.
    const quote=checkedLiteOffer({id:row.summary.hotelId,name:row.summary.hotelName},{rateType:'standard',rates:(d?.roomTypes||[]).flatMap(r=>r.rates||[])},{people:row.summary.adults},{...row.summary,id:'checkout'},undefined,{memberCheckout:true});
    // SDK support is established by its session fields, not a top-level
    // paymentTypes field (the documented response puts methods on each rate).
    if(!quote||d.hotelId!==row.summary.hotelId||d.checkin!==row.summary.checkin||d.checkout!==row.summary.checkout||d.currency!=='IDR'||!identifier(d.prebookId)||typeof d.transactionId!=='string'||!d.transactionId.trim()||d.transactionId.length>200||typeof d.secretKey!=='string'||d.secretKey.length>500||!d.secretKey.length)throw Error();
    failureStage='payable_total_validation';
    // LiteAPI returns the payable total as price. Legacy fixture/response
    // retailRate totals remain accepted, with identical price checks.
    const {terms}=checkoutPayable(d,quote.amountIDR);
    const finalRates=d.roomTypes.flatMap(r=>r.rates||[]);
    const boardNames=[...new Set(finalRates.map(r=>typeof r.boardName==='string'?r.boardName.trim().slice(0,160):'').filter(Boolean))];
    if(d.boardChanged===true&&finalRates.some(r=>typeof r.boardName!=='string'||!r.boardName.trim()||r.boardName.length>160))throw Error();
    const finalSummary={...row.summary,amountIDR:quote.amountIDR,roomType:quote.roomType,policy:quote.policy,terms,boardNames,cancellation:cancellation(finalRates)};
    const changed=quote.amountIDR!==row.summary.amountIDR||quote.roomType!==row.summary.roomType||quote.policy!==row.summary.policy||JSON.stringify(finalSummary.cancellation)!==JSON.stringify(row.summary.cancellation)||d.cancellationChanged===true||d.boardChanged===true;
    if(changed)Object.assign(finalSummary,{changed:true,previousAmountIDR:row.summary.amountIDR,previousRoomType:row.summary.roomType});
    // Confirmed supplier changes are reviewable, not an automatic purchase.
    // The separate payment endpoint still requires new explicit final consent.
    const saved=await update({state:'ready',summary:finalSummary,sealed_payload:await sealCheckout(env,{...guests,prebookId:d.prebookId,transactionId:d.transactionId,secretKey:d.secretKey}),expires_at:new Date(Date.now()+15*60000).toISOString()});
    // Review supplier terms before an explicit payment-portal request.
    return reply(publicCheckout(saved));
   }catch(e){
    const supplierStatus=Number.isInteger(e?.providerStatus)?e.providerStatus:null;
    const validationReason=['payable_missing','payable_mismatch','terms_invalid'].includes(e?.validationReason)?e.validationReason:null;
    await update({state:'failed',summary:{...row.summary,prebookFailure:failureStage,...(validationReason?{validationReason}:{}),...(supplierStatus?{supplierStatus}: {})}});
    return reply({error:failureStage==='supplier_request'?'hotel_checkout_session_failed':'hotel_checkout_prebook_failed'},502);
   }
  }
  if(path==='/api/hotels/checkout/book'&&request.method==='POST'){
   if(b.confirmBooking!==true)return reply({error:'hotel_checkout_invalid'},400);
   if(row.state==='confirmed')return reply(publicCheckout(row));
   if(row.state==='ready'&&(await openCheckout(env,row.sealed_payload)).finalTermsAccepted!==true)return reply({error:'hotel_checkout_guests'},400);
   const [claimed]=await db('rpc/claim_hotel_checkout',{p_id:id,p_user:user.id,p_environment:mode,p_from:'ready',p_to:'booking'});if(!claimed)return reply({error:'hotel_checkout_locked'},409);
   try{
    const payload=await openCheckout(env,claimed.sealed_payload);
    const result=await api('rates/book',{prebookId:payload.prebookId,clientReference:id,holder:payload.holder,guests:payload.guests,payment:{method:'TRANSACTION_ID',transactionId:payload.transactionId}});
    const verified=verifiedBooking(result.data,row);
    if(!verified){await update({state:'unknown'});return reply({error:'hotel_checkout_unknown'},202);}
    return reply(publicCheckout(await update({...verified,sealed_payload:await sealCheckout(env,{})})));
   }catch{await update({state:'unknown'});return reply({error:'hotel_checkout_unknown'},202);}
  }
  return reply({error:'hotel_checkout_invalid'},400);
 }catch(e){return reply({error:['hotel_checkout_storage','hotel_checkout_supplier'].includes(e.message)?e.message:'hotel_checkout_unavailable'},502);}
}
