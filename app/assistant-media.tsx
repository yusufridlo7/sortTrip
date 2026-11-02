import {useEffect,useRef,useState,type ReactNode} from 'react';
import {Camera} from 'lucide-react';
import {language,useLanguage} from './i18n';
import {prepareAssistantFiles} from './assistant-media-client.mjs';
import {validateAssistantMedia} from '../worker/assistant-media.mjs';
import './assistant-media.css';
export type AssistantAttachment={kind:string;mime:string;data:string;name:string};
export default function AssistantMedia({children,value,onChange,consent,onConsent,busy,onPreparing,onReady}:{children:ReactNode;value:AssistantAttachment[];onChange:(v:AssistantAttachment[])=>void;consent:boolean;onConsent:(v:boolean)=>void;busy:boolean;onPreparing:(v:boolean)=>void;onReady:(v:boolean)=>void}){
 useLanguage();const en=language()==='en',[error,setError]=useState(''),[preparing,setPreparing]=useState(false),[ready,setReady]=useState(false);const mounted=useRef(true);
 const picker=useRef<HTMLInputElement>(null);
 useEffect(()=>{mounted.current=true;return()=>{mounted.current=false}},[]);
 useEffect(()=>{const abort=new AbortController();void fetch('/api/ai/capabilities',{signal:abort.signal}).then(r=>r.ok?r.json():null).then(v=>{if(!abort.signal.aborted){const ok=v?.mediaEnabled===true;setReady(ok);onReady(ok);}}).catch(()=>{});return()=>abort.abort();},[onReady]);
 async function add(files:FileList|null){if(!files?.length)return;setError('');setPreparing(true);onPreparing(true);
  try{const items=await prepareAssistantFiles(Array.from(files));const next=[...value,...items];validateAssistantMedia(next,true);if(mounted.current){onChange(next);onConsent(false);}}
  catch{if(mounted.current)setError(en?'Unsupported file, too large, too long, or too many attachments.':'File tidak didukung, terlalu besar/panjang, atau lampiran terlalu banyak.');}
  finally{if(mounted.current){setPreparing(false);onPreparing(false);}}
 }
 return <div className="assistant-composer assistant-media">
  <div className="assistant-prompt-shell">{children}<button type="button" className="assistant-camera" aria-label={en?'Upload images or video':'Unggah foto atau video'} title={en?'Upload images or video':'Unggah foto atau video'} disabled={busy||preparing} onClick={()=>picker.current?.click()}><Camera size={23} aria-hidden="true"/>{value.length>0&&<span className="assistant-media-count" aria-hidden="true">{value.length}</span>}</button><input ref={picker} hidden aria-label={en?'Attach images or video':'Lampirkan gambar atau video'} type="file" accept="image/jpeg,image/png,image/webp,video/mp4" multiple disabled={busy||preparing} onChange={e=>{void add(e.target.files);e.target.value='';}}/></div>
  <details className="assistant-media-info"><summary>{en?'Attachment requirements':'Ketentuan lampiran'}</summary>
  <p className="inline-note">{en?'Up to 3 images (JPEG/PNG/WebP, normalized to JPEG ≤1280px) and 1 MP4 video (4 MB, 60 seconds). Files stay in this draft until you submit. Audio is not guaranteed to be transcribed.':'Maksimal 3 gambar (JPEG/PNG/WebP, dinormalisasi ke JPEG ≤1280px) dan 1 video MP4 (4 MB, 60 detik). File tetap di draft ini sampai Anda mengirim. Transkripsi audio tidak dijamin.'}</p>
  {!ready&&<p className="inline-note">{en?'Muse is not active on this server. You can prepare attachments, but generation with media remains disabled. Remove attachments to use the existing text flow.':'Muse belum aktif di server ini. Lampiran bisa disiapkan; generasi dengan media tetap nonaktif. Hapus lampiran untuk memakai alur teks existing.'}</p>}
  <p className="inline-note">{en?'Attachments are used only when generating an itinerary, not when refreshing prices. Social links alone do not mean the video was read.':'Lampiran hanya dipakai saat menyusun itinerary, bukan memperbarui harga. Tautan sosial saja tidak berarti isi videonya sudah dibaca.'}</p>
  </details>
  {preparing&&<p role="status">{en?'Preparing media locally…':'Menyiapkan media secara lokal…'}</p>}
  <div className="assistant-media-previews">{value.map((m,i)=><div key={i}>{m.kind==='image'?<img src={'data:'+m.mime+';base64,'+m.data} alt={en?'Attachment preview':'Pratinjau lampiran'}/>:<span aria-label="MP4">MP4</span>}<span>{m.name}</span><button type="button" disabled={busy||preparing} className="text-action" aria-label={(en?'Remove attachment ':'Hapus lampiran ')+(i+1)} onClick={()=>{onChange(value.filter((_,n)=>n!==i));onConsent(false);}}>{en?'Remove':'Hapus'}</button></div>)}</div>
  {value.length>0&&<label className="assistant-media-consent"><input type="checkbox" checked={consent} disabled={busy} onChange={e=>onConsent(e.target.checked)}/><span>{en?'I own or have permission to use this content and agree to send these attachments and my travel request to Meta for analysis when I generate. Do not include IDs, cards, passwords or private customer data. Attachments are not saved in the itinerary.':'Saya memiliki atau berizin menggunakan konten ini dan setuju mengirim lampiran serta permintaan perjalanan ke Meta untuk analisis saat menyusun itinerary. Jangan sertakan identitas, kartu, password, atau data pribadi pelanggan. Lampiran tidak disimpan dalam itinerary.'}</span></label>}
  {error&&<p role="alert" className="city-warning">{error}</p>}
  {value.length>0&&!ready&&<p role="status" className="inline-note">{en?'Muse is not active. Remove attachments to continue with text.':'Muse belum aktif. Hapus lampiran untuk melanjutkan dengan teks.'}</p>}
 </div>;
}
