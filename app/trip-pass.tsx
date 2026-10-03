import {useEffect,useRef,useState} from 'react';
import PriceWatch from './price-watch';
import {supabase} from './supabase';
import {boundedFetch} from './bounded-fetch';
import type {Trip} from './travel-data';
type Status={checkoutUrl?:string|null;mode:string;ownerTest:boolean;checkoutEnabled:boolean;checkoutReason?:string;refreshDeferred?:boolean;verificationError?:{code:string;httpStatus?:number}|null;status:string;pass:null|{expiresAt:string;remaining:number;test:boolean}};
export default function TripPass({trip,onLogin,onAccessChange}:{trip:Trip;onLogin:()=>void;onAccessChange?:(active:boolean)=>void}){
 const [status,setStatus]=useState<Status|null>(null),[busy,setBusy]=useState(false),[actionName,setActionName]=useState(''),[loading,setLoading]=useState(false),[message,setMessage]=useState(''),[details,setDetails]=useState(false),[checkoutUrl,setCheckoutUrl]=useState('');
 const generation=useRef(0),actionInFlight=useRef(false);
 useEffect(()=>{onAccessChange?.(!!status?.pass);},[status?.pass,onAccessChange]);
 function verificationMessage(b:Status){return b.verificationError?.code==='CHECKOUT_NOT_STARTED'?'Status transaksi belum tersedia di Midtrans. Gunakan tombol Beli Trip Pass untuk melanjutkan order yang sudah ada.':b.verificationError?.code==='MIDTRANS_REJECTED'?'Pemeriksaan status Midtrans gagal (HTTP '+b.verificationError.httpStatus+'). Jangan membuat pembayaran baru; periksa konfigurasi atau order yang sudah ada.':b.verificationError?'Verifikasi pembayaran belum berhasil ('+({PAYMENT_DATABASE_ERROR:'database pembayaran',PAYMENT_MISMATCH:'data order tidak cocok',PAYMENT_TIMEOUT:'batas waktu',PAYMENT_NETWORK_ERROR:'koneksi jaringan',PAYMENT_STATUS_UNAVAILABLE:'layanan status'}[b.verificationError.code as 'PAYMENT_DATABASE_ERROR']||'layanan status')+'). Jangan bayar ulang; pengelola perlu memeriksa layanan pembayaran.':'';}
 function restoreCheckout(b:Status){if(!b.checkoutUrl)return;try{const u=new URL(b.checkoutUrl);if(u.protocol==='https:'&&u.hostname===(b.mode==='production'?'app.midtrans.com':'app.sandbox.midtrans.com')&&!u.username&&!u.password)setCheckoutUrl(u.href);}catch{}}
 async function call(action:string,refresh=false,signal?:AbortSignal){
  if(!supabase)throw Error('Koneksi akun belum tersedia.');
  const {data}=await supabase.auth.getSession();
  if(!data.session){onLogin();return null;}
  const r=await boundedFetch('/api/payments/'+action,{method:'POST',signal,headers:{Authorization:`Bearer ${data.session.access_token}`,'Content-Type':'application/json'},body:JSON.stringify({tripId:trip.id,refresh})});
  const b=await r.json();if(!r.ok)throw Error(b.error||'Permintaan gagal.');return b;
 }
 useEffect(()=>{
  const id=++generation.current,controller=new AbortController();let checking=false,lastCheck=0;
  setStatus(null);setMessage('');setDetails(false);setBusy(false);setCheckoutUrl('');actionInFlight.current=false;
  async function refresh(){
   if(!trip.id||!supabase||checking||actionInFlight.current||document.visibilityState==='hidden'||Date.now()-lastCheck<65000)return;
   checking=true;lastCheck=Date.now();setLoading(true);
   try{
    const {data}=await supabase.auth.getSession();if(!data.session)return;
    const r=await boundedFetch('/api/payments/status',{method:'POST',signal:controller.signal,headers:{Authorization:`Bearer ${data.session.access_token}`,'Content-Type':'application/json'},body:JSON.stringify({tripId:trip.id,refresh:true})});
    const b=await r.json();if(!r.ok)throw Error(b.error||'Status Trip Pass belum dapat dimuat.');
    if(generation.current===id){setStatus(b);restoreCheckout(b);if(b.verificationError)setMessage(verificationMessage(b));if(b.pass){setMessage('');setCheckoutUrl('');}}
   }catch(e){if(generation.current===id&&!controller.signal.aborted)setMessage(previous=>previous||(e instanceof Error?e.message:'Status Trip Pass belum dapat dimuat.'));}
   finally{checking=false;if(generation.current===id)setLoading(false);}
  }
  void refresh();window.addEventListener('focus',refresh);document.addEventListener('visibilitychange',refresh);
  return()=>{generation.current++;controller.abort();window.removeEventListener('focus',refresh);document.removeEventListener('visibilitychange',refresh);};
 },[trip.id,trip.start,trip.destination]);
 async function act(action:string){
  if(actionInFlight.current)return;actionInFlight.current=true;const id=generation.current;setBusy(true);setActionName(action);setMessage('');
  try{
   const b=await call(action,true);if(!b||generation.current!==id)return;
   if(action==='checkout'){
    const u=new URL(b.checkoutUrl),host=b.mode==='production'?'app.midtrans.com':'app.sandbox.midtrans.com';
    if(u.protocol!=='https:'||u.hostname!==host||u.username||u.password)throw Error('Tautan pembayaran tidak valid.');
    setCheckoutUrl(u.href);setMessage('Halaman pembayaran siap. Jika belum terbuka, klik kembali Beli Trip Pass untuk melanjutkan order yang sama.');window.location.assign(u.href);return;
   }
   if(action==='status'){setStatus(b);restoreCheckout(b);setMessage(b.pass?'Trip Pass siap digunakan.':b.verificationError?verificationMessage(b):b.refreshDeferred?'Status tersimpan ditampilkan. Verifikasi ulang ke Midtrans belum berhasil atau perlu menunggu; jangan bayar ulang.':b.status==='paid'?'Pembayaran berhasil. Akses perjalanan sedang diperiksa.':b.status==='pending'?'Pembayaran masih menunggu penyelesaian.':'Belum ada Trip Pass aktif untuk perjalanan ini.');}
   else{const s=await call('status');if(generation.current===id){setMessage(b.message);if(s)setStatus(s);}}
  }catch(e){if(generation.current===id)setMessage(e instanceof Error?e.message:'Permintaan gagal.');}
  finally{if(generation.current===id){actionInFlight.current=false;setBusy(false);}}
 }
 const pass=status?.pass;
 return <div className={'trip-pass'+(pass?' trip-pass-active':'')}>
  <div className="trip-pass-heading"><strong>Trip Pass{!pass?' · Rp15.000 / perjalanan':''}</strong><button type="button" className="trip-pass-info" aria-label="Informasi Trip Pass" aria-expanded={details} onClick={()=>setDetails(!details)}>!</button>{pass&&<span>{pass.test?'Uji aktif':'Aktif'} · {pass.remaining} permintaan AI tersisa</span>}</div>
  {(!pass||details)&&<><p>30 hari · 20 permintaan AI · revisi itinerary · Price Watch harian dan notifikasi akun. Tanpa perpanjangan otomatis. Email mengikuti ketersediaan layanan.</p><p className="inline-note">Trip Pass adalah akses perencanaan, bukan tiket atau booking hotel. Kota awal atau tanggal berangkat berbeda memerlukan akses perjalanan berbeda.</p></>}
  {pass&&details&&<p>Berlaku sampai {new Date(pass.expiresAt).toLocaleDateString('id-ID')}. {pass.test?'Akses uji, bukan pembayaran sungguhan.':'Pembayaran telah diverifikasi server.'}</p>}
  {!pass&&<>
   {!trip.id?<p>Simpan itinerary terlebih dahulu untuk membeli Trip Pass.</p>:loading?<p role="status">Memeriksa akses Trip Pass…</p>:status?.checkoutEnabled?<p>{status.mode==='sandbox'?'Midtrans sandbox · pembayaran uji khusus pemilik.':'Pembayaran aman melalui Midtrans.'}</p>:<p>{status?.checkoutReason||'Pembayaran belum tersedia. Periksa status untuk melihat kendalanya.'}</p>}
   <div className="ai-controls">{checkoutUrl?<a className="primary" href={checkoutUrl} target="_blank" rel="noopener noreferrer">Beli Trip Pass · Rp15.000</a>:<button className="primary" type="button" disabled={busy||(!status&&loading)||!trip.id||!status?.checkoutEnabled} onClick={()=>act('checkout')}>{busy&&actionName==='checkout'?'Menyiapkan checkout…':'Beli Trip Pass · Rp15.000'}</button>}</div>
   <p className="inline-note">Setelah pembayaran, kembali ke perjalanan ini. Status diperiksa otomatis; jika masih menunggu, buka detail (!) untuk memeriksa status. Jangan bayar ulang.</p>
  </>}
  {trip.id&&details&&<button className="secondary" disabled={busy||loading} onClick={()=>act('status')}>{busy&&actionName==='status'?'Memeriksa status…':'Periksa status Trip Pass'}</button>}
  {message&&<p role="status">{message}</p>}
  {pass&&details&&<PriceWatch trip={trip}/>}
 </div>;
}
