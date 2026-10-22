import HotelDetails from './hotel-details';
import './hotel-checkout.css';
import {useEffect,useRef,useState} from 'react';
import {tr,label as localize,language,useLanguage} from './i18n';
import {supabase} from './supabase';
import AuthPanel from './auth-panel';
import LanguageSwitcher from './i18n/language-switcher';
import BrandLogo from './brand-logo';
import {money} from './travel-data';
import {hotelCheckoutUrl,checkoutStartParams,checkoutResumeId,checkoutReturnUrl} from './hotel-checkout-link.mjs';
type Summary={terms?:string;changed?:boolean;previousAmountIDR?:number;previousRoomType?:string;boardNames?:string[];hotelId:string;hotelName:string;checkin:string;checkout:string;adults:number;rooms:number;roomType:string;amountIDR:number;policy:string;cancellation:{refundableTag:string;cancelPolicyInfos:{cancelTime:string;amount:number|null;currency:string|null}[]}[]};
type Checkout={id:string;state:string;environment:'sandbox'|'live';summary:Summary;expiresAt:string;bookingId?:string;confirmationCode?:string;payment?:{publicKey:string;secretKey:string;returnUrl:string}};
type Guest={firstName:string;lastName:string};
type PaymentConstructor=new(config:Record<string,unknown>)=>{handlePayment:()=>unknown};
declare global{interface Window{LiteAPIPayment?:PaymentConstructor}}
let sdkPromise:Promise<void>|undefined;
function loadSDK(){if(window.LiteAPIPayment)return Promise.resolve();if(sdkPromise)return sdkPromise;sdkPromise=new Promise<void>((resolve,reject)=>{const script=document.createElement('script');script.src='https://payment-wrapper.liteapi.travel/dist/liteAPIPayment.js?v=a1';script.async=true;script.onload=()=>window.LiteAPIPayment?resolve():reject(Error('hotel_checkout_sdk_failed'));script.onerror=()=>{sdkPromise=undefined;script.remove();reject(Error('hotel_checkout_sdk_failed'));};document.head.appendChild(script);});return sdkPromise;}
export default function HotelCheckout({signedIn}:{signedIn:boolean}){
 useLanguage();
 const initial=useRef(new URLSearchParams(window.location.search));
 const [options,setOptions]=useState<Checkout[]>([]),[selected,setSelected]=useState<Checkout|null>(null),[busy,setBusy]=useState(false),[error,setError]=useState(''),[accept,setAccept]=useState(false),[paymentOpen,setPaymentOpen]=useState(false);
 const [holder,setHolder]=useState({firstName:'',lastName:'',email:''}),[guests,setGuests]=useState<Guest[]>([]);
 const [records,setRecords]=useState<Checkout[]>([]),[finalTerms,setFinalTerms]=useState(false);
 const working=useRef(false),mounted=useRef(true);
 useEffect(()=>()=>{mounted.current=false;},[]);
 async function call(action:string,data?:unknown,id?:string){
  const {data:auth}=await supabase!.auth.getSession();if(!auth.session)throw Error('hotel_checkout_login');
  const response=await fetch('/api/hotels/checkout/'+action+(id?'?id='+encodeURIComponent(id):''),{method:data?'POST':'GET',headers:{Authorization:'Bearer '+auth.session.access_token,'X-SortTrip-Language':language(),...(data?{'Content-Type':'application/json'}:{})},...(data?{body:JSON.stringify(data)}:{}),signal:AbortSignal.timeout(145000)});
  let body;try{body=await response.json()}catch{throw Error('hotel_checkout_unavailable')}if(!response.ok||body.error)throw Error(body.error||'hotel_checkout_unavailable');
  // Fixed validation counters only: never log supplier offers, guests or SDK sessions.
  if(action==='rooms'&&body.reason==='hotel_checkout_rates_filtered')console.info('hotel-rate-validation',JSON.stringify(Object.fromEntries(['rate_type','hotel_identity','room_count','occupancy','room_name','total','taxes','public_price','cancellation','occupancy_total'].filter(k=>Number.isInteger(body.rejections?.[k])).map(k=>[k,body.rejections[k]]))));
  if(action==='status'&&body.state==='failed'&&['selection_decode','supplier_request','room_price_validation','payable_total_validation'].includes(body.summary?.prebookFailure))console.info('hotel-prebook-validation',JSON.stringify({stage:body.summary.prebookFailure,...(['payable_missing','payable_mismatch','terms_invalid'].includes(body.summary.validationReason)?{reason:body.summary.validationReason}:{}),...(Number.isInteger(body.summary.supplierStatus)?{supplierStatus:body.summary.supplierStatus}:{})}));
  return body;
 }
 async function run(action:()=>Promise<void>){if(working.current)return;working.current=true;setBusy(true);setError('');try{await action()}catch(e){if(mounted.current)setError(e instanceof Error?e.message:'hotel_checkout_unavailable')}finally{working.current=false;if(mounted.current)setBusy(false)}}
 async function status(){const id=selected?.id||checkoutResumeId(initial.current);if(!id)return;const row=await call('status',undefined,id);if(mounted.current){setSelected(row);if(row.state==='selected')setGuests(previous=>previous.length===row.summary.rooms?previous:Array.from({length:row.summary.rooms},()=>({firstName:'',lastName:''})));}}
 useEffect(()=>{
  if(!signedIn||!checkoutResumeId(initial.current))return;
  // Do not trust payment redirect fields as confirmation or store SDK secrets.
  history.replaceState(null,'','/hotel-checkout?checkoutId='+encodeURIComponent(checkoutResumeId(initial.current)!));
  void run(status);
 },[signedIn]);
 async function showPayment(row:Checkout){
  if(!row.payment)throw Error('hotel_checkout_sdk_failed');
  await loadSDK();setSelected({...row,payment:undefined});setPaymentOpen(true);
  await new Promise<void>(resolve=>requestAnimationFrame(()=>resolve()));
  if(!mounted.current)return;
  const portal=new window.LiteAPIPayment!({publicKey:row.payment.publicKey,secretKey:row.payment.secretKey,targetElement:'#liteapi-payment',returnUrl:checkoutReturnUrl(window.location.origin,row.id),appearance:{theme:'flat'},options:{business:{name:'SortTrip'}}});
  await Promise.resolve(portal.handlePayment());
 }
 function choose(row:Checkout){setSelected(row);setGuests(Array.from({length:row.summary.rooms},()=>({firstName:'',lastName:''})));setAccept(false);setError('');history.replaceState(null,'','/hotel-checkout?checkoutId='+row.id);}
 const policyLinks=<nav className="policy-links"><a href={'/terms.html?lang='+language()} target="_blank" rel="noopener noreferrer">{tr('legal_terms')}</a><a href={'/privacy.html?lang='+language()} target="_blank" rel="noopener noreferrer">{tr('legal_privacy')}</a></nav>;
 const step=selected?.state==='confirmed'?3:selected?.state==='ready'?2:selected?1:0;
 const dateLabel=(value:string)=>new Intl.DateTimeFormat(language(),{day:'numeric',month:'short',year:'numeric',timeZone:'UTC'}).format(new Date(value+'T12:00:00Z'));
 const stay=(summary:Summary)=><div className="checkout-stay"><div><span>{tr('checkout_ui_checkin')}</span><b>{dateLabel(summary.checkin)}</b></div><div><span>{tr('checkout_ui_checkout')}</span><b>{dateLabel(summary.checkout)}</b></div><p>{summary.rooms} {tr('hotel_rooms')} · {summary.adults} {tr('hotel_guests')}</p></div>;
 return <><header className="header checkout-header"><a className="brand" href="/"><BrandLogo/></a><LanguageSwitcher/></header><main className="hotel-checkout checkout-page">
  <div className="checkout-heading"><div><a className="checkout-back" href="/">← {tr('hotel_checkout_back')}</a><h1>{tr('hotel_checkout_title')}</h1><p>{tr('checkout_ui_intro')}</p></div>{signedIn&&<button type="button" className="secondary" disabled={busy} onClick={()=>void run(async()=>setRecords((await call('history')).checkouts))}>{tr('hotel_checkout_history')}</button>}</div>
  <ol className="checkout-steps" aria-label={tr('checkout_ui_steps')}>{['checkout_ui_step_room','checkout_ui_step_guest','checkout_ui_step_payment','checkout_ui_step_confirm'].map((key,i)=><li key={key} className={i===step?'current':i<step?'complete':''} aria-current={i===step?'step':undefined}><span aria-hidden="true">{i<step?'✓':i+1}</span>{tr(key)}</li>)}</ol>
  {!signedIn?<section className="checkout-panel"><h2>{tr('hotel_checkout_login')}</h2><AuthPanel/></section>:<>
   {records.length>0&&<section className="checkout-panel checkout-history"><h2>{tr('hotel_checkout_history')}</h2>{records.map(r=><a key={r.id} href={'/hotel-checkout?checkoutId='+r.id}><b>{r.summary.hotelName}</b><span>{dateLabel(r.summary.checkin)} → {dateLabel(r.summary.checkout)}</span></a>)}</section>}
   {!selected&&!checkoutResumeId(initial.current)&&<><section className="checkout-panel checkout-room-heading"><div><h2>{tr('checkout_ui_choose_room')}</h2><p>{tr('checkout_ui_room_hint')}</p></div>{initial.current.get('hotelId')&&<button type="button" className="primary" disabled={busy} onClick={()=>void run(async()=>{const result=await call('rooms',checkoutStartParams(initial.current));setOptions(result.options);if(!result.options.length)setError(result.reason||'hotel_no_results');})}>{tr(busy?'checkout_ui_loading':'hotel_checkout_rooms')}</button>}</section>
    {options.some(row=>row.environment==='sandbox')&&<p className="city-warning">{tr('hotel_checkout_sandbox')}</p>}
    <div className="checkout-room-list">{options.map(row=><article className="checkout-panel checkout-room-option" key={row.id}><div><span className="eyebrow">{row.summary.hotelName}</span><h2>{row.summary.roomType}</h2>{stay(row.summary)}<p className="checkout-policy-label">{tr(row.summary.policy==='RFN'?'hotel_checkout_refundable':'hotel_checkout_nonrefundable')}</p></div><div className="checkout-room-price"><span>{tr('checkout_ui_stay_total')}</span><strong>{money(row.summary.amountIDR)}</strong><small>{tr('hotel_total_included')}</small><button type="button" className="primary" disabled={busy} onClick={()=>choose(row)}>{tr('hotel_checkout_select')}</button></div></article>)}</div></>}
   {selected&&<div className="checkout-layout"><aside className="checkout-panel checkout-summary"><span className="eyebrow">{tr('checkout_ui_summary')}</span><h2>{selected.summary.hotelName}</h2><p className="checkout-room-name">{selected.summary.roomType}</p>{stay(selected.summary)}{selected.summary.boardNames?.map(name=><span className="checkout-meal" key={name}>{name}</span>)}<div className="checkout-total"><span>{tr(selected.state==='ready'?'hotel_checkout_final_total':'checkout_ui_stay_total')}</span><strong>{money(selected.summary.amountIDR)}</strong><small>{tr('hotel_total_included')}</small></div><HotelDetails hotelId={selected.summary.hotelId}/><p className="checkout-provider">{tr('checkout_ui_provider')}</p>{selected.environment==='sandbox'&&<p className="city-warning">{tr('hotel_checkout_sandbox')}</p>}</aside>
    <div className="checkout-main">
     <section className="checkout-panel checkout-policy"><h2>{tr('checkout_ui_cancellation')}</h2><p>{tr(selected.summary.policy==='RFN'?'hotel_checkout_refundable':'hotel_checkout_nonrefundable')}</p>{selected.summary.cancellation.map((c,i)=><div key={i}>{c.cancelPolicyInfos.map((p,j)=><p className="checkout-policy-row" key={j}><span>{p.cancelTime}</span>{p.amount!==null&&p.currency&&<b>{p.currency==='IDR'?money(p.amount):new Intl.NumberFormat(language(),{style:'currency',currency:p.currency}).format(p.amount)}</b>}</p>)}</div>)}{selected.summary.terms&&<details><summary>{tr('legal_terms')}</summary><p style={{whiteSpace:'pre-wrap'}}>{selected.summary.terms}</p></details>}</section>
     {selected.state==='selected'&&<section className="checkout-panel"><div className="checkout-section-heading"><span>2</span><div><h2>{tr('hotel_checkout_holder')}</h2><p>{tr('checkout_ui_guest_hint')}</p></div></div><form className="checkout-guest-form" onSubmit={e=>{e.preventDefault();void run(async()=>{try{const row=await call('prebook',{id:selected.id,holder,guests,acceptTerms:accept});setSelected(row);setFinalTerms(false);}catch(e){await status().catch(()=>{});throw e;}});}}>
      <div className="form-two"><label>{tr('hotel_checkout_first')}<input required maxLength={80} autoComplete="given-name" value={holder.firstName} onChange={e=>setHolder({...holder,firstName:e.target.value})}/></label><label>{tr('hotel_checkout_last')}<input required maxLength={80} autoComplete="family-name" value={holder.lastName} onChange={e=>setHolder({...holder,lastName:e.target.value})}/></label></div><label>{tr('hotel_checkout_email')}<input required type="email" maxLength={254} autoComplete="email" value={holder.email} onChange={e=>setHolder({...holder,email:e.target.value})}/></label>
      <h3>{tr('hotel_checkout_guests_heading')}</h3>{guests.map((g,i)=><fieldset key={i}><legend>{tr('hotel_checkout_room_number',{count:i+1})}</legend><div className="form-two"><label>{tr('hotel_checkout_first')}<input required maxLength={80} value={g.firstName} onChange={e=>setGuests(guests.map((v,j)=>j===i?{...v,firstName:e.target.value}:v))}/></label><label>{tr('hotel_checkout_last')}<input required maxLength={80} value={g.lastName} onChange={e=>setGuests(guests.map((v,j)=>j===i?{...v,lastName:e.target.value}:v))}/></label></div></fieldset>)}
      <label className="checkout-consent"><input type="checkbox" required checked={accept} onChange={e=>setAccept(e.target.checked)}/><span>{tr('hotel_checkout_accept')}</span></label><button type="submit" className="primary" disabled={busy||!accept}>{tr(busy?'checkout_ui_loading':'hotel_checkout_continue')}</button><p className="checkout-note">{tr('checkout_ui_no_charge')}</p>
     </form></section>}
     {selected.state==='ready'&&<section className="checkout-panel checkout-payment"><div className="checkout-section-heading"><span>3</span><div><h2>{tr('checkout_ui_payment_heading')}</h2><p>{tr('checkout_ui_payment_hint')}</p></div></div>
      {selected.summary.changed&&<div className="checkout-change-note" role="status"><b>{tr('checkout_ui_review_heading')}</b><p>{tr('hotel_checkout_review_changes')}</p>{selected.summary.previousAmountIDR!==selected.summary.amountIDR&&<div className="checkout-price-comparison"><span>{tr('hotel_checkout_previous_total')}<s>{money(selected.summary.previousAmountIDR!)}</s></span><span>{tr('hotel_checkout_final_total')}<b>{money(selected.summary.amountIDR)}</b></span></div>}{selected.summary.previousRoomType!==selected.summary.roomType&&<p>{selected.summary.previousRoomType} → {selected.summary.roomType}</p>}</div>}
      <label className="checkout-consent"><input type="checkbox" checked={finalTerms} onChange={e=>setFinalTerms(e.target.checked)}/><span>{tr('hotel_checkout_accept')}</span></label>
      {!paymentOpen&&<button type="button" className="primary checkout-pay-button" disabled={busy||!finalTerms} onClick={()=>void run(async()=>showPayment(await call('payment',{id:selected.id,acceptFinalTerms:finalTerms})))}>{tr(busy?'checkout_ui_loading':'hotel_checkout_resume')}</button>}
      {paymentOpen&&<div className="checkout-payment-portal"><p className="checkout-payment-provider">{tr('checkout_ui_secure_portal')}</p><div id="liteapi-payment"/></div>}
      <p className="checkout-note">{tr('hotel_checkout_ready')}</p>
      <details className="checkout-recovery" open={initial.current.has('redirect_status')||undefined}><summary>{tr('checkout_ui_already_paid')}</summary><p>{tr('checkout_ui_confirm_hint')}</p><button type="button" className="secondary" disabled={busy||!finalTerms} onClick={()=>void run(async()=>{setPaymentOpen(false);setSelected(await call('book',{id:selected.id,confirmBooking:true}));})}>{tr(busy?'checkout_ui_loading':'hotel_checkout_finalize')}</button></details>
     </section>}
     {['unknown','booking','prebooking'].includes(selected.state)&&<section className="checkout-panel"><p className="city-warning">{tr('hotel_checkout_unknown')}</p><p>{tr('hotel_checkout_booking_ref')}: {selected.id}</p></section>}
     {selected.state==='confirmed'&&<section className="checkout-panel checkout-confirmed" role="status"><span aria-hidden="true">✓</span><h2>{tr('hotel_checkout_confirmed')}</h2><p>{tr('hotel_checkout_booking_ref')}: {selected.bookingId}</p><p>{tr('hotel_checkout_hotel_ref')}: {selected.confirmationCode||tr('hotel_checkout_waiting_ref')}</p></section>}
     {['cancelled','failed'].includes(selected.state)&&<section className="checkout-panel"><p role="status">{tr('hotel_checkout_'+selected.state)}</p>{selected.state==='failed'&&<a className="secondary checkout-search-again" href={hotelCheckoutUrl(selected.summary.hotelId,selected.summary.checkin,selected.summary.checkout,selected.summary.adults)}>{tr('hotel_checkout_search_again')}</a>}</section>}
     <div className="checkout-status-action"><button type="button" className="text-action" disabled={busy} onClick={()=>void run(status)}>{tr('hotel_checkout_status')}</button></div>
    </div>
   </div>}
  </>}
  {busy&&<p className="checkout-progress" role="status" aria-live="polite">{tr('checkout_ui_loading')}</p>}{error&&<p role="alert" className="city-warning">{tr(error)===error?localize(error):tr(error)}</p>}
  <footer className="checkout-footer">{policyLinks}<span>{tr('checkout_ui_footer')}</span></footer>
 </main></>;
}
