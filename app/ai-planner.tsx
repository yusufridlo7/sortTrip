import {useNarrative,NarrativeStatus} from './i18n/narratives';
import {tr,label as localize,locale,language} from './i18n';
import {applyPriceQuotes,buildPriceTargets} from './apply-price-quotes';
import {applyAIPlan,aiTripContext} from './apply-ai-plan';
import TripPass from './trip-pass';
import InfoNote from './info-note';
import {useEffect,useRef,useState} from 'react';
import {Sparkles} from 'lucide-react';
import {supabase} from './supabase';
import {type Trip,destinations} from './travel-data';
export default function AIPlanner({trip,onChange,onResult,onLogin,onOpenSaved,autoRequest,onAutoComplete,onWorkingChange,isSaved=false}:{isSaved?:boolean;onWorkingChange?:(working:boolean)=>void;autoRequest?:string|null;onAutoComplete?:()=>void;trip:Trip;onChange:(t:Trip)=>void;onResult:(t:Trip)=>Promise<boolean>;onLogin:()=>void;onOpenSaved?:()=>void}){
 const narrative=useNarrative();

 const [transportPreference,setTransportPreference]=useState<'hemat'|'cepat'|'seimbang'>(trip.aiTransportPreference||'seimbang'),[pace,setPace]=useState(trip.aiPace||'seimbang'),[interests,setInterests]=useState(trip.aiPrompt||''),[busy,setBusy]=useState(false),[operation,setOperation]=useState<'itinerary'|'prices'>('itinerary'),[error,setError]=useState(''),[status,setStatus]=useState(''),[paywall,setPaywall]=useState(false);
 const current=useRef(trip);current.current=trip;const controller=useRef<AbortController|null>(null);
 const [access,setAccess]=useState<{pass:null|{remaining:number;expiresAt:string};otherTrips:{city:string;start:string}[]}|null>(null);
 const [accessError,setAccessError]=useState('');
 const [priceSaved,setPriceSaved]=useState(false);
 const workingCallback=useRef(onWorkingChange);workingCallback.current=onWorkingChange;
 function working(value:boolean){setBusy(value);workingCallback.current?.(value);}
 useEffect(()=>()=>{controller.current?.abort();workingCallback.current?.(false)},[]);
 const city=trip.destinationMeta?.city||destinations.find(d=>d.id===trip.destination)?.city||trip.destination;
 const country=trip.destinationMeta?.country||destinations.find(d=>d.id===trip.destination)?.country||'';
 const plan=trip.aiPlan;
 useEffect(()=>{const abort=new AbortController();async function check(){
  if(!supabase)return;const {data}=await supabase.auth.getSession();if(!data.session)return;
  try{const r=await fetch('/api/payments/access',{method:'POST',signal:AbortSignal.any([abort.signal,AbortSignal.timeout(15000)]),headers:{'Content-Type':'application/json','X-SortTrip-Language':language(),Authorization:'Bearer '+data.session.access_token},body:JSON.stringify({city,start:trip.start})});if(!r.ok)throw Error('access');const result=await r.json();if(!abort.signal.aborted){setAccess(result);setAccessError('');}}
  catch{if(!abort.signal.aborted)setAccessError(tr('ui_0011'));}
 }void check();return()=>abort.abort();},[city,trip.start,plan?.createdAt,trip.priceCheckedAt]);
 const autoStarted=useRef<string|null>(null);
 useEffect(()=>{if(!autoRequest||autoStarted.current===autoRequest)return;const timer=setTimeout(()=>{autoStarted.current=autoRequest;void generate().finally(()=>onAutoComplete?.());},0);return()=>clearTimeout(timer)},[autoRequest]);
 const legacy=!!plan&&!trip.items.some(x=>x.aiGenerated);
 async function applyPrevious(){if(!plan)return;working(true);try{const saved=await onResult(applyAIPlan(trip,plan));setStatus(saved?'Hasil sebelumnya masuk ke itinerary dan tersimpan di akunmu.':'Hasil sebelumnya masuk ke draft. Klik Simpan itinerary untuk mencoba menyimpan ke akun.');setError('');}catch(e){setError(e instanceof Error?e.message:'Hasil AI belum dapat dimasukkan.');}finally{working(false)}}
 async function generate(mode:"itinerary"|"prices"="itinerary"){
  if(busy)return;
  if(!supabase){setError(tr('ui_0012'));return;}
  const {data}=await supabase.auth.getSession();if(!data.session){onLogin();return;}
  const snapshot=trip;setOperation(mode);working(true);setError('');setStatus('');setPriceSaved(false);controller.current=new AbortController();
  try{
   const r=await fetch('/api/itinerary',{method:'POST',signal:AbortSignal.any([controller.current.signal,AbortSignal.timeout(185000)]),headers:{'Content-Type':'application/json','X-SortTrip-Language':language(),Authorization:'Bearer '+data.session.access_token},body:JSON.stringify({language:language(),mode,priceTargets:mode==='prices'?buildPriceTargets(trip,city):undefined,city,country,start:trip.start,days:trip.days,people:trip.people,budget:trip.budget,transportPreference,pace,interests,conversation:trip.aiConversation?.slice(-6),arrival:trip.flight?.arrive,arrivalDay:trip.flight?.arrivalDay,returnAt:trip.flight?.returnAt,oneWay:trip.journey==='oneway',...(mode==='prices'?{}:aiTripContext(trip,city,country))})});
   let body;try{body=await r.json()}catch{throw Error('Server penyusunan belum merespons dengan benar (HTTP '+r.status+'). Draft tetap tersedia; coba lagi setelah server stabil.')}if(body.code==='TRIP_PASS_REQUIRED'){
    if(current.current!==snapshot)return;
    setAccess(null);setAccessError('');
    try{
     const a=await fetch('/api/payments/access',{method:'POST',signal:AbortSignal.any([controller.current.signal,AbortSignal.timeout(15000)]),headers:{'Content-Type':'application/json','X-SortTrip-Language':language(),Authorization:'Bearer '+data.session.access_token},body:JSON.stringify({city,start:snapshot.start})});
     if(!a.ok)throw Error('access');const result=await a.json();if(current.current!==snapshot)return;setAccess(result);
    }catch{if(current.current!==snapshot||controller.current.signal.aborted)return;setAccessError(tr('ui_0013'));}
    setPaywall(true);return;
   }if(!r.ok)throw Error(body.error||'Gagal membuat rekomendasi.');if(current.current!==snapshot)throw Error(tr('ui_0014'));
   if(mode==='prices'){const next=applyPriceQuotes(snapshot,body.prices||[]);const changed=next.items.filter((item,i)=>JSON.stringify(item.priceQuote)!==JSON.stringify(snapshot.items[i]?.priceQuote)||JSON.stringify(item.routePriceQuotes)!==JSON.stringify(snapshot.items[i]?.routePriceQuotes)).length;if(!changed)throw Error(tr('ui_0015'));const saved=await onResult(next);setPriceSaved(saved);setPaywall(false);setAccess(null);setStatus(tr('quota_updated',{count:changed,saved:saved?tr('msg_0009'):tr('msg_0010')}));return;}
   const next=applyPriceQuotes(applyAIPlan(snapshot,body.plan),body.prices||[]);const saved=await onResult({...next,aiConversation:[...(snapshot.aiConversation||[]),{role:"user" as const,text:interests.trim()||`Susun perjalanan ${city} dengan transportasi ${transportPreference}`},{role:"assistant" as const,text:body.plan.summary}].slice(-20)});setPaywall(false);setStatus(saved?'Itinerary dan percakapan otomatis tersimpan di akunmu. Buka melalui Perjalanan saya.':'Hasil AI sudah masuk ke draft, tetapi belum tersimpan ke akun. Klik Simpan itinerary tanpa mengulang AI.');
  }catch(e){if(e instanceof Error&&e.name!=='AbortError')setError((e.name==='TimeoutError'?'Penyusunan melewati batas waktu.':e.message)+(autoRequest?' Penerbangan baru dan rancangan awal tetap tersedia; susun ulang dengan AI setelah masalah teratasi.':''));}finally{working(false);}
 }
 return <section id="sorttrip-assistant" className="ai-planner"><NarrativeStatus/><div className="eyebrow"><Sparkles size={16}/>{' '+tr('ui_0016')}</div><InfoNote heading={<h2>{tr('ui_0017')+' '}{city}</h2>} label={tr('ui_0018')}><p>{tr('ui_0019')}</p><p>{tr('ui_0020')}</p></InfoNote>
 {access?.pass&&!paywall&&<InfoNote heading={<p className="pass-quota-status">{tr('ui_0021')+' '}{access.pass.remaining}{' '+tr('ui_0022')}</p>} label={tr('ui_0023')}><p>{tr('ui_0024')+' '}{new Date(access.pass.expiresAt).toLocaleDateString(locale())}{tr('ui_0025')}</p></InfoNote>}
 {paywall&&<div className="ai-plan-access" role="region" aria-label={tr('ui_0026')}><strong>{access?.pass?tr('ui_0027'):tr('ui_0028')}</strong>
  <p>{access?.pass?(access.pass.remaining>0?tr('ui_0029'):tr('ui_0030')):access?.otherTrips.length?tr('ui_0031'):tr('ui_0032')}</p>
  {access?.otherTrips.map(t=><p key={t.city+t.start}>{tr('ui_0033')+' '}{t.city} · {t.start}</p>)}
  {accessError&&<p role="alert">{localize(accessError)}</p>}
  {onOpenSaved&&<button type="button" className="secondary" onClick={onOpenSaved}>{tr('ui_0034')}</button>}
  {!accessError&&!access?.otherTrips.length&&<TripPass trip={trip} onLogin={onLogin} onAccessChange={active=>{if(active)setPaywall(false);}}/>}
  <button type="button" className="secondary" onClick={()=>setPaywall(false)}>{tr('ui_0035')}</button></div>}
 {trip.aiConversation?.length?<div className="assistant-conversation" aria-label={tr('ui_0036')}>{trip.aiConversation.map((message,i)=><div className={"assistant-message "+message.role} key={i}><strong>{message.role==='user'?tr('ui_0037'):tr('ui_0038')}</strong><p>{message.role==='assistant'?narrative(message.text):message.text}</p></div>)}</div>:null}<div className="ai-controls"><label>{tr('ui_0039')}<input disabled={busy} type="number" min="0" max="1000000000" value={trip.budget} onChange={e=>{const n=Number(e.target.value);if(Number.isFinite(n)&&n>=0&&n<=1e9)onChange({...trip,budget:n});}}/></label><label>{tr('ui_0040')}<select disabled={busy} value={pace} onChange={e=>{setPace(e.target.value);onChange({...trip,aiPace:e.target.value})}}><option value="santai">{tr('ui_0041')}</option><option value="seimbang">{tr('ui_0042')}</option><option value="padat">{tr('ui_0043')}</option></select></label><label>{tr('ui_0044')}<select disabled={busy} value={transportPreference} onChange={e=>{const value=e.target.value as "hemat"|"cepat"|"seimbang";setTransportPreference(value);onChange({...trip,aiTransportPreference:value});}}><option value="hemat">{tr('ui_0045')}</option><option value="cepat">{tr('ui_0046')}</option><option value="seimbang">{tr('ui_0047')}</option></select></label><label className="assistant-composer">{tr('ui_0048')}<textarea rows={4} disabled={busy} maxLength={1000} value={interests} onChange={e=>{setInterests(e.target.value);onChange({...trip,aiPrompt:e.target.value})}} placeholder={tr('ui_0049')}/></label></div>
 <button type="button" className="primary" disabled={busy} onClick={()=>generate()}>{busy?(operation==='prices'?tr('ui_0050'):tr('ui_0051')):plan?tr('ui_0052'):tr('ui_0053')}</button>{trip.priceCheckedAt&&<p className="inline-note">{tr('ui_0054')+' '}{new Date(trip.priceCheckedAt).toLocaleString(locale())}{tr('ui_0055')}</p>}<button type="button" className="secondary refresh-prices" disabled={busy||!trip.items.some(x=>!x.paid&&['Penginapan','Transportasi'].includes(x.category))} onClick={event=>{event.preventDefault();event.stopPropagation();void generate('prices')}}>{tr('ui_0056')}</button>{busy&&<p className="assistant-working" role="status" aria-live="polite">{operation==='prices'?tr('ui_0057'):tr('ui_0058')}</p>}{busy&&<button type="button" className="text-action" onClick={()=>controller.current?.abort()}>{tr('ui_0059')}</button>}
 {error&&<p role="alert" className="city-warning">{localize(error)}</p>}{status&&<div role="status" className={priceSaved?'price-update-success':'assistant-result-status'}>{priceSaved&&<span aria-hidden="true">✓</span>}<span>{localize(status)}</span></div>}{!busy&&!status&&!error&&isSaved&&trip.priceCheckedAt&&<div role="status" className="price-update-success"><span aria-hidden="true">✓</span><span>{tr('ui_0060')+' '}{new Date(trip.priceCheckedAt).toLocaleString(locale())}</span></div>}
 {plan&&<div className="ai-result">{!trip.aiConversation?.length&&<p>{narrative(plan.summary)}</p>}{legacy&&<><p>{tr('ui_0061')}</p><button type="button" className="secondary" disabled={busy} onClick={applyPrevious}>{tr('ui_0062')}</button></>}<InfoNote label={tr('ui_0063')}><p>{tr('ui_0064')}</p></InfoNote><details><summary>{tr('ui_0065')}</summary>{plan.sources.map(s=><p key={s.url}><a href={s.url} target="_blank" rel="noopener noreferrer">{s.title}</a></p>)}</details></div>}
 </section>;
}
