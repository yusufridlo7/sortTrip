import {tr,label as localize,locale,language} from './i18n';
import {useEffect,useRef,useState} from 'react';
import PriceWatch from './price-watch';
import {supabase} from './supabase';
import {boundedFetch} from './bounded-fetch';
import {destinations,money,type Trip} from './travel-data';
type Status={checkoutAmount?:number|null;checkoutUrl?:string|null;mode:string;ownerTest:boolean;checkoutEnabled:boolean;checkoutReason?:string;refreshDeferred?:boolean;verificationError?:{code:string;httpStatus?:number}|null;status:string;pass:null|{expiresAt:string;remaining:number;requestLimit?:number;test:boolean}};
export default function TripPass({trip,onLogin,onAccessChange}:{trip:Trip;onLogin:()=>void;onAccessChange?:(active:boolean)=>void}){
 const [status,setStatus]=useState<Status|null>(null),[busy,setBusy]=useState(false),[actionName,setActionName]=useState(''),[loading,setLoading]=useState(false),[message,setMessage]=useState(''),[details,setDetails]=useState(false),[checkoutUrl,setCheckoutUrl]=useState('');
 const generation=useRef(0),actionInFlight=useRef(false);
 const city=trip.destinationMeta?.city||destinations.find(d=>d.id===trip.destination)?.city||trip.destination;
 useEffect(()=>{onAccessChange?.(!!status?.pass&&status.pass.remaining>0);},[status?.pass,onAccessChange]);
 function verificationMessage(b:Status){return b.verificationError?.code==='CHECKOUT_NOT_STARTED'?'Status transaksi belum tersedia di Midtrans. Gunakan tombol Beli Trip Pass untuk melanjutkan order yang sudah ada.':b.verificationError?.code==='MIDTRANS_REJECTED'?'Pemeriksaan status Midtrans gagal (HTTP '+b.verificationError.httpStatus+'). Jangan membuat pembayaran baru; periksa konfigurasi atau order yang sudah ada.':b.verificationError?'Verifikasi pembayaran belum berhasil ('+({PAYMENT_DATABASE_ERROR:'database pembayaran',PAYMENT_MISMATCH:'data order tidak cocok',PAYMENT_TIMEOUT:'batas waktu',PAYMENT_NETWORK_ERROR:'koneksi jaringan',PAYMENT_STATUS_UNAVAILABLE:'layanan status'}[b.verificationError.code as 'PAYMENT_DATABASE_ERROR']||'layanan status')+'). Jangan bayar ulang; pengelola perlu memeriksa layanan pembayaran.':'';}
 function restoreCheckout(b:Status){if(!b.checkoutUrl)return;try{const u=new URL(b.checkoutUrl);if(u.protocol==='https:'&&u.hostname===(b.mode==='production'?'app.midtrans.com':'app.sandbox.midtrans.com')&&!u.username&&!u.password)setCheckoutUrl(u.href);}catch{}}
 async function call(action:string,refresh=false,signal?:AbortSignal){
  if(!supabase)throw Error(tr('ui_0690'));
  const {data}=await supabase.auth.getSession();
  if(!data.session){onLogin();return null;}
  const r=await boundedFetch('/api/payments/'+action,{method:'POST',signal,headers:{Authorization:`Bearer ${data.session.access_token}`,'Content-Type':'application/json','X-SortTrip-Language':language()},body:JSON.stringify({tripId:trip.id,city,start:trip.start,refresh})});
  const b=await r.json();if(!r.ok)throw Error(b.error||'Permintaan gagal.');return b;
 }
 useEffect(()=>{
  const id=++generation.current,controller=new AbortController();let checking=false,lastCheck=0;
  setStatus(null);setMessage('');setDetails(false);setBusy(false);setCheckoutUrl('');actionInFlight.current=false;
  async function refresh(){
   if(!supabase||checking||actionInFlight.current||document.visibilityState==='hidden'||Date.now()-lastCheck<65000)return;
   checking=true;lastCheck=Date.now();setLoading(true);
   try{
    const {data}=await supabase.auth.getSession();if(!data.session)return;
    const accessResponse=await boundedFetch('/api/payments/access',{method:'POST',signal:controller.signal,headers:{Authorization:`Bearer ${data.session.access_token}`,'Content-Type':'application/json','X-SortTrip-Language':language()},body:JSON.stringify({city,start:trip.start})});
    const access=await accessResponse.json();if(!accessResponse.ok)throw Error(tr('ui_0011'));
    if(!trip.id){if(generation.current===id)setStatus({...access,mode:'',ownerTest:false,checkoutEnabled:false,status:'none'});return;}
    const r=await boundedFetch('/api/payments/status',{method:'POST',signal:controller.signal,headers:{Authorization:`Bearer ${data.session.access_token}`,'Content-Type':'application/json','X-SortTrip-Language':language()},body:JSON.stringify({tripId:trip.id,city,start:trip.start,refresh:true})});
    const b=await r.json();if(!r.ok){if(b.code==='TRIP_IDENTITY_CHANGED'&&access.pass){if(generation.current===id)setStatus({...access,mode:'',ownerTest:false,checkoutEnabled:false,status:'none'});return;}throw Error(b.error||'Status Trip Pass belum dapat dimuat.');}
    if(generation.current===id){setStatus(b);restoreCheckout(b);if(b.verificationError)setMessage(verificationMessage(b));if(b.pass&&b.pass.remaining>0){setMessage('');setCheckoutUrl('');}}
   }catch(e){if(generation.current===id&&!controller.signal.aborted)setMessage(previous=>previous||(e instanceof Error?e.message:'Status Trip Pass belum dapat dimuat.'));}
   finally{checking=false;if(generation.current===id)setLoading(false);}
  }
  void refresh();window.addEventListener('focus',refresh);document.addEventListener('visibilitychange',refresh);
  return()=>{generation.current++;controller.abort();window.removeEventListener('focus',refresh);document.removeEventListener('visibilitychange',refresh);};
 },[trip.id,trip.start,trip.destination,city]);
 async function act(action:string){
  if(actionInFlight.current)return;actionInFlight.current=true;const id=generation.current;setBusy(true);setActionName(action);setMessage('');
  try{
   const b=await call(action,true);if(!b||generation.current!==id)return;
   if(action==='checkout'){
    const u=new URL(b.checkoutUrl),host=b.mode==='production'?'app.midtrans.com':'app.sandbox.midtrans.com';
    if(u.protocol!=='https:'||u.hostname!==host||u.username||u.password)throw Error(tr('ui_0691'));
    setCheckoutUrl(u.href);setMessage(tr('ui_0692'));window.location.assign(u.href);return;
   }
   if(action==='status'){setStatus(b);restoreCheckout(b);setMessage(b.pass?'Trip Pass siap digunakan.':b.verificationError?verificationMessage(b):b.refreshDeferred?'Status tersimpan ditampilkan. Verifikasi ulang ke Midtrans belum berhasil atau perlu menunggu; jangan bayar ulang.':b.status==='paid'?'Pembayaran berhasil. Akses perjalanan sedang diperiksa.':b.status==='pending'?'Pembayaran masih menunggu penyelesaian.':'Belum ada Trip Pass aktif untuk perjalanan ini.');}
   else{const s=await call('status');if(generation.current===id){setMessage(b.message);if(s)setStatus(s);}}
  }catch(e){if(generation.current===id)setMessage(e instanceof Error?e.message:'Permintaan gagal.');}
  finally{if(generation.current===id){actionInFlight.current=false;setBusy(false);}}
 }
 const pass=status?.pass;
 return <div className={'trip-pass'+(pass&&pass.remaining>0?' trip-pass-active':'')}>
  <div className="trip-pass-heading"><strong>{tr('ui_0693')}{!pass?tr('ui_0694'):''}</strong><button type="button" className="trip-pass-info" aria-label={tr('ui_0695')} aria-expanded={details} onClick={()=>setDetails(!details)}>!</button>{pass&&<span>{pass.remaining===0?tr('ui_0696'):pass.test?tr('ui_0697'):tr('ui_0698')} · {pass.remaining}{' '+tr('ui_0699')}</span>}</div>
  {(!pass||pass.remaining===0||details)&&<><p>{tr('ui_0700')+' '}{pass?.requestLimit??10}{' '+tr('ui_0701')}</p><p className="inline-note">{tr('ui_0702')}</p></>}
  {pass?.remaining===0&&<p className="pass-exhausted">{tr('ui_0703')}</p>}{pass&&details&&<p>{tr('ui_0704')+' '}{pass.requestLimit??20}{' '+tr('ui_0705')+' '}{new Date(pass.expiresAt).toLocaleDateString(locale())}. {pass.test?tr('ui_0706'):tr('ui_0707')}</p>}
  {(!pass||pass.remaining===0)&&<>
   {!trip.id?<p>{tr('ui_0708')}</p>:loading?<p role="status">{tr('ui_0709')}</p>:status?.checkoutEnabled?<p>{status.mode==='sandbox'?tr('ui_0710'):tr('ui_0711')}</p>:<p>{localize(status?.checkoutReason||tr('msg_0244'))}</p>}
   <div className="ai-controls">{checkoutUrl?<a className="primary" href={checkoutUrl} target="_blank" rel="noopener noreferrer">{status?.checkoutAmount?tr('pass_continue_payment_amount',{amount:money(status.checkoutAmount)}):tr('pass_continue_payment')}</a>:<button className="primary" type="button" disabled={busy||(!status&&loading)||!trip.id||!status?.checkoutEnabled} onClick={()=>act('checkout')}>{busy&&actionName==='checkout'?tr('ui_0713'):pass?.remaining===0?tr('ui_0714'):tr('ui_0712')}</button>}</div>
   <p className="inline-note">{tr('ui_0715')}</p>
  </>}
  {trip.id&&details&&<button className="secondary" disabled={busy||loading} onClick={()=>act('status')}>{busy&&actionName==='status'?tr('ui_0716'):tr('ui_0717')}</button>}
  {message&&<p role="status">{localize(message)}</p>}
  {pass&&details&&<PriceWatch trip={trip}/>}
 </div>;
}
