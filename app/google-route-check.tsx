import {useEffect,useRef,useState} from 'react';
import {tr,label as localize,language,locale} from './i18n';
import {supabase} from './supabase';
type Result={routes:{durationSeconds:number;distanceMeters:number;fare:null|{currency:string;amount:number};steps:{mode:string;instruction:string;line:string;fromStop:string;toStop:string}[]}[];remaining:{userDaily:number};checkedAt:string};
export default function GoogleRouteCheck({from,to,date}:{from?:string;to?:string;date:string}){
 const [open,setOpen]=useState(false),[mode,setMode]=useState('TRANSIT'),[at,setAt]=useState(date+'T09:00'),[busy,setBusy]=useState(false),[error,setError]=useState(''),[result,setResult]=useState<Result|null>(null);
 const abort=useRef<AbortController|null>(null);
 useEffect(()=>{abort.current?.abort();setResult(null);setError('');setAt(date+'T09:00');return()=>abort.current?.abort();},[from,to,date]);
 if(!from||!to||from===to)return null;
 const mapsUrl='https://www.google.com/maps/dir/?'+new URLSearchParams({api:'1',origin:from,destination:to,travelmode:mode==='TRANSIT'?'transit':mode==='WALK'?'walking':'driving'}).toString();
 async function check(){if(busy)return;setBusy(true);setError('');setResult(null);abort.current=new AbortController();
  try{if(!supabase)throw Error('google_route_login');const {data}=await supabase.auth.getSession();if(!data.session)throw Error('google_route_login');
   const departureTime=mode==='TRANSIT'?new Date(at).toISOString():undefined;
   const response=await fetch('/api/routes/google',{method:'POST',signal:AbortSignal.any([abort.current.signal,AbortSignal.timeout(45000)]),headers:{'Content-Type':'application/json','X-SortTrip-Language':language(),Authorization:'Bearer '+data.session.access_token},body:JSON.stringify({from,to,mode,departureTime,language:language()})});
   const body=await response.json();if(!response.ok)throw Error(body.error||'google_route_unavailable');setResult(body);
  }catch(e){if(e instanceof Error&&e.name!=='AbortError')setError(e instanceof RangeError?'google_route_date':e.name==='TimeoutError'?'google_route_unavailable':e.message||'google_route_unavailable');}finally{setBusy(false);}
 }
 return <details className="google-route-check" open={open} onToggle={e=>setOpen(e.currentTarget.open)}><summary>{tr('google_route_action')}</summary><p>{from} → {to}</p><p className="inline-note">{tr('google_route_consent')}</p><div className="form-two"><label>{tr('google_route_mode')}<select disabled={busy} value={mode} onChange={e=>{setMode(e.target.value);setResult(null)}}><option value="TRANSIT">{tr('google_route_transit')}</option><option value="WALK">{tr('google_route_walk')}</option><option value="DRIVE">{tr('google_route_drive')}</option></select></label>{mode==='TRANSIT'&&<label>{tr('google_route_departure')}<input type="datetime-local" disabled={busy} value={at} onChange={e=>{setAt(e.target.value);setResult(null)}}/><small>{Intl.DateTimeFormat().resolvedOptions().timeZone}</small></label>}</div><button type="button" className="secondary" disabled={busy} onClick={()=>void check()}>{tr(busy?'google_route_working':'google_route_check')}</button>{error&&<p role="alert">{tr(error)===error?localize(error):tr(error)}</p>}
  {result&&<div className="google-route-results"><span className="gmp-attribution" translate="no">{'Google Maps'}</span>{!result.routes.length&&<p>{tr('google_route_empty')}</p>}{result.routes.map((r,i)=><article key={i}><strong>{Math.round(r.durationSeconds/60)} {tr('google_route_minutes')} · {(r.distanceMeters/1000).toFixed(1)} {'km'}</strong><p>{r.fare?tr('google_route_fare')+' '+new Intl.NumberFormat(locale(),{style:'currency',currency:r.fare.currency}).format(r.fare.amount):tr('google_route_fare_unknown')}</p><ol>{r.steps.map((s,j)=><li key={j}>{s.line&&<strong>{s.line} · </strong>}{s.fromStop&&s.toStop?s.fromStop+' → '+s.toStop:s.instruction||s.mode}</li>)}</ol></article>)}<p className="inline-note">{tr('google_route_notice')}</p><small>{tr('google_route_remaining',{count:result.remaining.userDaily})}</small></div>}
  {error&&<a className="secondary" href={mapsUrl} target="_blank" rel="noopener noreferrer">{tr('ui_0466')}</a>}
  <nav className="policy-links" aria-label={tr('legal_terms')}><a href={'/privacy.html?lang='+language()} target="_blank" rel="noopener noreferrer">{tr('legal_privacy')}</a><a href={'/terms.html?lang='+language()} target="_blank" rel="noopener noreferrer">{tr('legal_terms')}</a></nav>
 </details>;
}
