import {applyAIPlan,aiTripContext} from './apply-ai-plan';
import TripPass from './trip-pass';
import InfoNote from './info-note';
import {useEffect,useRef,useState} from 'react';
import {Sparkles} from 'lucide-react';
import {supabase} from './supabase';
import {type Trip,destinations} from './travel-data';
export default function AIPlanner({trip,onChange,onResult,onLogin,onOpenSaved}:{trip:Trip;onChange:(t:Trip)=>void;onResult:(t:Trip)=>Promise<boolean>;onLogin:()=>void;onOpenSaved?:()=>void}){
 const [transportPreference,setTransportPreference]=useState<'hemat'|'cepat'|'seimbang'>(trip.aiTransportPreference||'seimbang'),[pace,setPace]=useState(trip.aiPace||'seimbang'),[interests,setInterests]=useState(trip.aiPrompt||''),[busy,setBusy]=useState(false),[error,setError]=useState(''),[status,setStatus]=useState(''),[paywall,setPaywall]=useState(false);
 const current=useRef(trip);current.current=trip;const controller=useRef<AbortController|null>(null);
 const [access,setAccess]=useState<{pass:null|{remaining:number;expiresAt:string};otherTrips:{city:string;start:string}[]}|null>(null);
 const [accessError,setAccessError]=useState('');
 useEffect(()=>()=>controller.current?.abort(),[]);
 const city=trip.destinationMeta?.city||destinations.find(d=>d.id===trip.destination)?.city||trip.destination;
 const country=trip.destinationMeta?.country||destinations.find(d=>d.id===trip.destination)?.country||'';
 const plan=trip.aiPlan;
 useEffect(()=>{const abort=new AbortController();async function check(){
  if(!supabase)return;const {data}=await supabase.auth.getSession();if(!data.session)return;
  try{const r=await fetch('/api/payments/access',{method:'POST',signal:AbortSignal.any([abort.signal,AbortSignal.timeout(15000)]),headers:{'Content-Type':'application/json',Authorization:'Bearer '+data.session.access_token},body:JSON.stringify({city,start:trip.start})});if(!r.ok)throw Error('access');const result=await r.json();if(!abort.signal.aborted){setAccess(result);setAccessError('');}}
  catch{if(!abort.signal.aborted)setAccessError('Status Trip Pass belum dapat diverifikasi. Jangan bayar ulang.');}
 }void check();return()=>abort.abort();},[city,trip.start,plan?.createdAt]);
 const legacy=!!plan&&!trip.items.some(x=>x.aiGenerated);
 async function applyPrevious(){if(!plan)return;setBusy(true);try{const saved=await onResult(applyAIPlan(trip,plan));setStatus(saved?'Hasil sebelumnya masuk ke itinerary dan tersimpan di akunmu.':'Hasil sebelumnya masuk ke draft. Klik Simpan itinerary untuk mencoba menyimpan ke akun.');setError('');}catch(e){setError(e instanceof Error?e.message:'Hasil AI belum dapat dimasukkan.');}finally{setBusy(false)}}
 async function generate(){
  if(!supabase){setError('Koneksi akun belum dikonfigurasi.');return;}
  const {data}=await supabase.auth.getSession();if(!data.session){onLogin();return;}
  const snapshot=trip;setBusy(true);setError('');setStatus('');controller.current=new AbortController();
  try{
   const r=await fetch('/api/itinerary',{method:'POST',signal:AbortSignal.any([controller.current.signal,AbortSignal.timeout(185000)]),headers:{'Content-Type':'application/json',Authorization:'Bearer '+data.session.access_token},body:JSON.stringify({city,country,start:trip.start,days:trip.days,people:trip.people,budget:trip.budget,transportPreference,pace,interests,conversation:trip.aiConversation?.slice(-6),arrival:trip.flight?.arrive,arrivalDay:trip.flight?.arrivalDay,returnAt:trip.flight?.returnAt,oneWay:trip.journey==='oneway',...aiTripContext(trip,city,country)})});
   let body;try{body=await r.json()}catch{throw Error('Server penyusunan belum merespons dengan benar (HTTP '+r.status+'). Draft tetap tersedia; coba lagi setelah server stabil.')}if(body.code==='TRIP_PASS_REQUIRED'){
    if(current.current!==snapshot)return;
    setAccess(null);setAccessError('');
    try{
     const a=await fetch('/api/payments/access',{method:'POST',signal:AbortSignal.any([controller.current.signal,AbortSignal.timeout(15000)]),headers:{'Content-Type':'application/json',Authorization:'Bearer '+data.session.access_token},body:JSON.stringify({city,start:snapshot.start})});
     if(!a.ok)throw Error('access');const result=await a.json();if(current.current!==snapshot)return;setAccess(result);
    }catch{if(current.current!==snapshot||controller.current.signal.aborted)return;setAccessError('Status Trip Pass belum dapat diverifikasi. Jangan bayar ulang; coba periksa status pada perjalanan yang sudah dibeli.');}
    setPaywall(true);return;
   }if(!r.ok)throw Error(body.error||'Gagal membuat rekomendasi.');if(current.current!==snapshot)throw Error('Perjalanan berubah saat AI bekerja. Coba lagi agar hasil mengikuti itinerary terbaru.');
   const next=applyAIPlan(snapshot,body.plan);const saved=await onResult({...next,aiConversation:[...(snapshot.aiConversation||[]),{role:"user" as const,text:interests.trim()||`Susun perjalanan ${city} dengan transportasi ${transportPreference}`},{role:"assistant" as const,text:body.plan.summary}].slice(-20)});setPaywall(false);setStatus(saved?'Itinerary dan percakapan otomatis tersimpan di akunmu. Buka melalui Perjalanan saya.':'Hasil AI sudah masuk ke draft, tetapi belum tersimpan ke akun. Klik Simpan itinerary tanpa mengulang AI.');
  }catch(e){if(e instanceof Error&&e.name!=='AbortError')setError(e.name==='TimeoutError'?'Penyusunan melewati batas waktu. Itinerary tidak diubah.':e.message);}finally{setBusy(false);}
 }
 return <section className="ai-planner"><div className="eyebrow"><Sparkles size={16}/> SORTTRIP ASSISTANT</div><InfoNote heading={<h2>Susun itinerary {city}</h2>} label="Cara kerja SortTrip Assistant"><p>Wisata, rekomendasi hotel, dan transportasi disusun sesuai lokasi lalu langsung dimasukkan ke itinerary harian. Booking yang sudah dibayar dan pilihan manual tetap dipertahankan.</p><p>Memerlukan login. Rekomendasi hotel belum merupakan booking; harga, ketersediaan, jam dan rute perlu diperiksa.</p></InfoNote>
 {access?.pass&&!paywall&&<InfoNote heading={<p className="pass-quota-status">Trip Pass · {access.pass.remaining} hasil AI tersisa</p>} label="Informasi kuota Trip Pass"><p>Kuota dibagi untuk seluruh perjalanan dalam akun ini, termasuk perjalanan baru. Aktif sampai {new Date(access.pass.expiresAt).toLocaleDateString('id-ID')}. Permintaan gagal tidak dihitung.</p></InfoNote>}
 {paywall&&<div className="ai-plan-access" role="region" aria-label="Status akses AI"><strong>{access?.pass?'Trip Pass ditemukan untuk akun ini.':'Akses AI untuk akun ini perlu diperiksa.'}</strong>
  <p>{access?.pass?(access.pass.remaining>0?'Trip Pass masih memiliki kuota, tetapi permintaan AI ditolak server. Jangan bayar ulang; pengelola perlu memeriksa pencatatan kuota.':'Kuota AI Trip Pass perjalanan ini sudah habis. Itinerary tetap dapat diedit manual.'):access?.otherTrips.length?'Anda memiliki Trip Pass untuk perjalanan lain. Buka perjalanan yang sudah dibeli melalui Perjalanan saya.':'Trip Pass berlaku lintas perjalanan pada akun ini: 20 hasil AI berhasil selama 30 hari. Jika sudah membayar, periksa status sebelum membeli lagi.'}</p>
  {access?.otherTrips.map(t=><p key={t.city+t.start}>Trip Pass tersedia: {t.city} · {t.start}</p>)}
  {accessError&&<p role="alert">{accessError}</p>}
  {onOpenSaved&&<button className="secondary" onClick={onOpenSaved}>Buka Perjalanan saya</button>}
  {!accessError&&!access?.otherTrips.length&&<TripPass trip={trip} onLogin={onLogin} onAccessChange={active=>{if(active&&!access?.pass)setPaywall(false);}}/>}
  <button className="secondary" onClick={()=>setPaywall(false)}>Lanjut edit manual</button></div>}
 {trip.aiConversation?.length?<div className="assistant-conversation" aria-label="Percakapan SortTrip Assistant">{trip.aiConversation.map((message,i)=><div className={"assistant-message "+message.role} key={i}><strong>{message.role==='user'?'Anda':'SortTrip Assistant'}</strong><p>{message.text}</p></div>)}</div>:null}<div className="ai-controls"><label>Budget total / orang (Rp)<input disabled={busy} type="number" min="0" max="1000000000" value={trip.budget} onChange={e=>{const n=Number(e.target.value);if(Number.isFinite(n)&&n>=0&&n<=1e9)onChange({...trip,budget:n});}}/></label><label>Ritme perjalanan<select disabled={busy} value={pace} onChange={e=>{setPace(e.target.value);onChange({...trip,aiPace:e.target.value})}}><option value="santai">Santai</option><option value="seimbang">Seimbang</option><option value="padat">Banyak eksplorasi</option></select></label><label>Prioritas transportasi<select disabled={busy} value={transportPreference} onChange={e=>{const value=e.target.value as "hemat"|"cepat"|"seimbang";setTransportPreference(value);onChange({...trip,aiTransportPreference:value});}}><option value="hemat">Hemat · transit boleh</option><option value="cepat">Cepat · minim waktu tempuh</option><option value="seimbang">Seimbang · biaya & kepraktisan</option></select></label><label className="assistant-composer">Sesuaikan perjalananmu<textarea rows={4} disabled={busy} maxLength={1000} value={interests} onChange={e=>{setInterests(e.target.value);onChange({...trip,aiPrompt:e.target.value})}} placeholder="Ceritakan perjalananmu: wisata yang ingin dikunjungi, transit yang nyaman, hemat atau cepat…"/></label></div>
 <button className="primary" disabled={busy} onClick={generate}>{busy?'Menyiapkan perjalanan…':plan?'Perbarui itinerary dengan AI':'Susun itinerary dengan AI'}</button>{busy&&<p className="assistant-working" role="status" aria-live="polite">SortTrip Assistant sedang menyiapkan perjalanan: mencari wisata, hotel, dan transportasi yang sesuai.</p>}{busy&&<button className="text-action" onClick={()=>controller.current?.abort()}>Batalkan</button>}
 {error&&<p role="alert" className="city-warning">{error}</p>}{status&&<p role="status">{status}</p>}
 {plan&&<div className="ai-result">{!trip.aiConversation?.length&&<p>{plan.summary}</p>}{legacy&&<><p>Hasil AI sebelumnya belum dimasukkan ke daftar utama.</p><button className="secondary" disabled={busy} onClick={applyPrevious}>Masukkan hasil sebelumnya ke itinerary</button></>}<InfoNote label="Informasi mengedit itinerary"><p>Edit wisata, hotel, transportasi dan biayanya langsung pada itinerary harian di bawah. Harga yang belum diketahui tidak dihitung sebagai harga lengkap.</p></InfoNote><details><summary>Referensi penyusunan</summary>{plan.sources.map(s=><p key={s.url}><a href={s.url} target="_blank" rel="noopener noreferrer">{s.title}</a></p>)}</details></div>}
 </section>;
}
