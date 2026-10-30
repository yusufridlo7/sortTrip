import {useEffect,useRef,useState} from 'react';
import {tr,language,useLanguage} from './i18n';
import {supabase} from './supabase';
import {VIDEO_LIMITS,socialVideoUrl,inspectMp4,normalizeDestinations,initialVideoTrip,demoDestinations,type Candidate} from '../lib/video-itinerary.mjs';
import {prepareVideo} from './prepare-video';
import {FRAME_LIMITS} from '../lib/prepared-media.mjs';
import type {Trip} from './travel-data';
import './video-itinerary.css';
type Kind='url'|'upload'|'transcript';
export default function VideoItinerary({onCreate,onLogin,onWorkingChange,disabled=false,sourceKind,initialTrip,instructions='',onPlan,onUseReference,demoOnly=false}:{demoOnly?:boolean;instructions?:string;onPlan?:(candidates:Candidate[])=>Promise<void>;onUseReference?:(url:string)=>void;initialTrip?:Trip;sourceKind?:Kind;disabled?:boolean;onCreate:(trip:Trip)=>void;onLogin:()=>void;onWorkingChange?:(value:boolean)=>void}){
 useLanguage();
 const localDemo=demoOnly&&['mvp-demo','owner-ui'].includes(import.meta.env.MODE);
 const [excluded,setExcluded]=useState<string[]>([]);
 const [kind,setKind]=useState<Kind>(sourceKind||'url'),[url,setUrl]=useState(''),[text,setText]=useState(''),[file,setFile]=useState<File|null>(null),[consent,setConsent]=useState(false),[busy,setBusy]=useState(false),[progress,setProgress]=useState<number|null>(null),[message,setMessage]=useState(''),[candidates,setCandidates]=useState<Candidate[]>([]),[demo,setDemo]=useState(false),[complete,setComplete]=useState(false),[start,setStart]=useState(new Date().toISOString().slice(0,10)),[days,setDays]=useState(2),[people,setPeople]=useState(1);
 const [prepared,setPrepared]=useState<Awaited<ReturnType<typeof prepareVideo>>|null>(null);
 const [qaMetrics,setQAMetrics]=useState<Record<string,string|number>|null>(null);
 const [linkAdvanced,setLinkAdvanced]=useState(false);
 const controller=useRef<AbortController|null>(null),active=useRef(false);
 const planning=useRef(false);
 useEffect(()=>{if(sourceKind)setKind(sourceKind);setConsent(false);setFile(null);setLinkAdvanced(false);reset();},[sourceKind]);
 useEffect(()=>{if(initialTrip){setStart(initialTrip.start);setDays(initialTrip.days);setPeople(initialTrip.people);}},[initialTrip?.start,initialTrip?.days,initialTrip?.people]);
 useEffect(()=>()=>{controller.current?.abort();if(active.current)onWorkingChange?.(false);},[]);
 function reset(){setExcluded([]);setPrepared(null);setCandidates([]);setComplete(false);setMessage('');setDemo(false);setQAMetrics(null);}
 function problem(code:string){const key='video_error_'+code;return ['INVALID_URL','UNSUPPORTED_URL','AUTH_REQUIRED','CONSENT_REQUIRED','INVALID_INPUT','TOO_LARGE','REQUEST_TOO_LARGE','TOO_LONG','INVALID_MP4','UNSUPPORTED_MEDIA','EXTERNAL_MEDIA','MODEL_UNAVAILABLE','BUDGET_CONTROL_REQUIRED','BUDGET_EXHAUSTED','RATE_LIMITED','MODEL_ACCESS_REQUIRED','MODEL_TIMEOUT','INVALID_MODEL_OUTPUT','INVALID_EVIDENCE','REVIEW_REQUIRED','INVALID_TRIP','INVALID_FRAME','VIDEO_DECODE_FAILED','TOKEN_COUNT_REQUIRED','INPUT_TOKEN_LIMIT'].includes(code)?key:'video_error_failed';}
 async function run(){
  setCandidates([]);setComplete(false);setMessage('');setDemo(false);setProgress(null);setQAMetrics(null);const control=new AbortController();controller.current=control;active.current=true;setBusy(true);onWorkingChange?.(true);
  try{
   if(kind==='url')socialVideoUrl(url);
   if(kind==='upload'){if(!file)throw Error('INVALID_INPUT');if(file.size>VIDEO_LIMITS.bytes)throw Error('TOO_LARGE');if(!consent)throw Error('CONSENT_REQUIRED');inspectMp4(new Uint8Array(await file.arrayBuffer()),file.type);}
   if(kind==='transcript'&&(!text.trim()||new TextEncoder().encode(text).length>VIDEO_LIMITS.text))throw Error('INVALID_INPUT');
   if(kind==='transcript'&&!consent)throw Error('CONSENT_REQUIRED');
   // Linked text is supplied by the user, not read from the remote video.
   if(kind==='url'){
    if(!text.trim()){setMessage('video_link_needs_text');return;}
    if(new TextEncoder().encode(text).length>VIDEO_LIMITS.text)throw Error('INVALID_INPUT');
    if(!consent)throw Error('CONSENT_REQUIRED');
   }
   if(control.signal.aborted)throw new DOMException('Aborted','AbortError');
   if(kind==='upload'&&!prepared){setPrepared(await prepareVideo(file!,control.signal));setMessage('video_frames_ready');return;}
   if(localDemo){const fixture=demoDestinations('Bangkok');setText(fixture.transcript);setCandidates(fixture.destinations);setDemo(true);setComplete(true);return;}
   const session=await supabase?.auth.getSession();const token=session?.data.session?.access_token;if(!token)throw Error('AUTH_REQUIRED');
   if(control.signal.aborted)throw new DOMException('Aborted','AbortError');
   let result:{ok:boolean;data:any};
   const body=kind==='upload'?{kind:'frames',...prepared,text,consent,instructions}:kind==='url'?{kind:'linked-transcript',url:socialVideoUrl(url).url,text,consent,instructions}:{kind:'transcript',text,consent,instructions};
   const payload=JSON.stringify(body);if(new TextEncoder().encode(payload).length>FRAME_LIMITS.totalBody)throw Error('REQUEST_TOO_LARGE');
   const requestStarted=performance.now();
   const r=await fetch('/api/video-itinerary',{method:'POST',headers:{Authorization:'Bearer '+token,'Content-Type':'application/json'},body:payload,signal:AbortSignal.any([control.signal,AbortSignal.timeout(45000)])});let responseData;try{responseData=await r.json();}catch{responseData={code:r.status===413?'REQUEST_TOO_LARGE':'failed'};}result={ok:r.ok,data:responseData};
   if(import.meta.env.MODE==='meta-qa'){
    const usage=result.data.usage||result.data.qa?.usage;
    const stage=result.data.qa?.validationStage;
    setQAMetrics({http:r.status,elapsedMs:Math.round(performance.now()-requestStarted),inputKind:kind==='upload'?'video-frames':'transcript',...(['provider-request','response-json','response-not-completed','response-model','destination-json','destination-schema'].includes(stage)?{validationStage:stage}:{}),...(result.data.model==='muse-spark-1.3'?{model:'muse-spark-1.3'}:{}),...(usage&&Number.isSafeInteger(usage.inputTokens)&&Number.isSafeInteger(usage.outputTokens)&&Number.isFinite(usage.estimatedUSD)?{inputTokens:usage.inputTokens,outputTokens:usage.outputTokens,estimatedUSD:usage.estimatedUSD}:{})});
   }
   if(control.signal.aborted)throw new DOMException('Aborted','AbortError');
   if(result.data.code==='MEDIA_PROCESSOR_REQUIRED'){setMessage('video_processor');return;}
   if(!result.ok)throw Error(result.data.code||'failed');
   if(result.data.mock!==false||result.data.provider!=='Meta'||result.data.inputKind!==(kind==='upload'?'video-frames':'transcript'))throw Error('INVALID_MODEL_OUTPUT');
   // Revalidate the model fields and independently resolve catalog identity.
   const rows=result.data.destinations.map((c:Candidate)=>({name:c.name,city:c.city,country:c.country,category:c.category,activity:c.activity,sourceEvidence:c.sourceEvidence,evidenceKind:c.evidenceKind,confidence:c.confidence,verified:false,recommendedDurationMinutes:c.recommendedDurationMinutes}));
   setCandidates(normalizeDestinations({destinations:rows},kind==='upload'?undefined:text));setComplete(true);
  }catch(e){setMessage(e instanceof Error&&e.name==='AbortError'?'video_cancelled':problem(e instanceof Error?e.message:'failed'));}
  finally{active.current=false;setBusy(false);onWorkingChange?.(false);controller.current=null;}
 }
 function useReference(){
  if(busy||disabled)return;
  try{const source=socialVideoUrl(url);onUseReference?.(source.url);setMessage('');}
  catch(error){setMessage(error instanceof Error&&error.message==='INSPIRATION_TOO_LONG'?'video_error_INSPIRATION_TOO_LONG':problem(error instanceof Error?error.message:'failed'));}
 }
 function edit(index:number,field:'name'|'city'|'country',value:string){setCandidates(rows=>{
  const changed=rows.map((c,i)=>i===index?{...c,[field]:value,reviewAdded:true}:c);
  // Blank edits remain editable but cannot retain verification/coordinates.
  try{return normalizeDestinations({destinations:changed.map(c=>({name:c.name,city:c.city,country:c.country,category:c.category,activity:c.activity,sourceEvidence:c.sourceEvidence,evidenceKind:c.evidenceKind,confidence:c.confidence,verified:false,recommendedDurationMinutes:c.recommendedDurationMinutes}))}).map((c,i)=>({...c,id:changed[i].id,reviewAdded:changed[i].reviewAdded,manualConfirmed:false}));}
  catch{return changed.map(c=>({...c,verified:false,geo:undefined,sourceUrl:undefined,placeId:undefined}));}
 });}
 async function create(){if(planning.current)return;planning.current=true;try{if(onPlan&&!demo){await onPlan(candidates.filter(c=>!c.duplicate&&!excluded.includes(c.id)));return;}const trip=initialVideoTrip(candidates.filter(c=>!excluded.includes(c.id)),{start,days,people,language:language(),demo,manualReview:true});onCreate({...trip,destinationMeta:{...trip.destinationMeta!,code:initialTrip?.destinationMeta&&initialTrip.destinationMeta.city===trip.destinationMeta?.city&&initialTrip?.destinationMeta?.country===trip.destinationMeta?.country?initialTrip.destinationMeta!.code:trip.destinationMeta!.code},origin:initialTrip?.origin||trip.origin,budget:initialTrip?.budget??trip.budget,journey:initialTrip?.journey||trip.journey,aiPrompt:instructions});}catch(e){setMessage(problem(e instanceof Error?e.message:'failed'));}finally{planning.current=false;}}
 return <div className="assistant-media-input" hidden={!sourceKind} onKeyDown={event=>{if(event.key==='Enter'&&event.target instanceof HTMLInputElement)event.preventDefault();}}><fieldset disabled={disabled||!sourceKind} className="video-content">
 {import.meta.env.MODE==='meta-qa'&&!(kind==='url'&&onUseReference&&!linkAdvanced)&&<p className="inline-note">{tr('meta_qa_draft_notice')}</p>}
 {kind==='url'&&<><label>{tr('video_url')}<input disabled={busy} type="url" maxLength={500} value={url} onChange={e=>{setUrl(e.target.value);reset();}}/></label><p className="inline-note">{tr(onUseReference?'video_inspiration_intro':'video_link_notice')}</p>{onUseReference&&<div className="video-actions"><button type="button" className="primary" disabled={busy||!url.trim()} onClick={useReference}>{tr('video_use_inspiration')}</button><button type="button" className="text-action" disabled={busy} aria-expanded={linkAdvanced} onClick={()=>setLinkAdvanced(value=>!value)}>{tr('video_link_advanced')}</button></div>}{(!onUseReference||linkAdvanced)&&<label>{tr('video_link_text')}<textarea rows={4} disabled={busy} maxLength={12000} value={text} onChange={e=>{setText(e.target.value);reset();}}/></label>}</>}
 {kind==='transcript'&&<label>{tr('video_text')}<textarea rows={5} disabled={busy} maxLength={12000} value={text} onChange={e=>{setText(e.target.value);reset();}}/></label>}
 {kind==='upload'&&<label>{tr('video_file')}<input type="file" accept="video/mp4,video/quicktime,video/x-m4v,.mp4,.mov,.m4v" disabled={busy} onChange={e=>{setFile(e.target.files?.[0]||null);setConsent(false);setText('');reset();}}/></label>}
 {kind==='upload'&&<><p className="inline-note">{tr('video_frames_fallback')}</p><label>{tr('video_optional_transcript')}<textarea rows={3} disabled={busy} maxLength={12000} value={text} onChange={e=>{setText(e.target.value);setCandidates([]);setComplete(false);}}/></label>{prepared&&<div className="video-frame-previews">{prepared.frames.map(f=><figure key={f.seconds}><img src={f.image} alt={tr('video_frame_at',{seconds:f.seconds})}/><figcaption>{tr('video_frame_at',{seconds:f.seconds})}</figcaption></figure>)}</div>}</>}
 {(kind!=='url'||!onUseReference||linkAdvanced)&&<><label className="video-consent"><input type="checkbox" checked={consent} disabled={busy} onChange={e=>setConsent(e.target.checked)}/><span>{tr('video_consent')}</span></label>
 <p className="inline-note">{tr('assistant_combined_help')}</p><details className="assistant-media-info"><summary>{tr('assistant_media_info')}</summary><p className="inline-note">{tr('video_retention')}</p></details><div className="video-actions"><button type="button" className="primary" disabled={busy||(kind==='url'?!url.trim()||!!text.trim()&&!consent:kind==='upload'?!file||!consent:!text.trim()||!consent)} onClick={()=>void run()}>{tr(localDemo&&kind==='upload'&&prepared?'mvp_demo_analyse':kind==='url'?(text.trim()?'video_analyse_link_text':'video_check'):kind==='upload'?(prepared?'video_analyse_frames':'video_prepare_frames'):'assistant_analyse_combined')}</button>
 {import.meta.env.DEV&&import.meta.env.MODE!=='qa-preparation'&&import.meta.env.MODE!=='staging'&&<button type="button" className="secondary" disabled={busy} onClick={()=>{const fixture=demoDestinations(localDemo?'Bangkok':undefined);setText(fixture.transcript);setCandidates(fixture.destinations);setDemo(true);setComplete(true);setMessage('');}}>{tr('video_demo')}</button>}
 {busy&&<button type="button" className="secondary" onClick={()=>controller.current?.abort()}>{tr('video_cancel')}</button>}</div></>}
 {busy&&<p role="status">{progress===null?tr('video_processing'):tr('video_uploading',{percent:progress})}</p>}
 {import.meta.env.MODE==='meta-qa'&&qaMetrics&&<pre aria-label={tr('meta_qa_inference_metrics')}>{JSON.stringify(qaMetrics,null,2)}</pre>}
 {message==='video_link_needs_text'&&<div className="city-warning"><p>{tr('mvp_tiktok_fallback')}</p><button type="button" className="secondary" onClick={()=>{setKind('upload');reset();}}>{tr('mvp_upload_alternative')}</button></div>}
 {message&&<div role="status" className="city-warning">{tr(message)}{message==='video_error_AUTH_REQUIRED'&&<button type="button" className="secondary" onClick={onLogin}>{tr('video_login')}</button>}</div>}
 {complete&&<section aria-label={tr('video_review')}><h3>{tr('video_review')}</h3>{demo&&<p className="city-warning">{tr('video_demo_note')}</p>}<p>{tr('video_review_help')}</p>{!candidates.length&&<p>{tr('video_none')}</p>}
 {candidates.map((c,i)=><article className="video-candidate" key={c.id}><label className="video-consent"><input type="checkbox" checked={!excluded.includes(c.id)} onChange={e=>setExcluded(rows=>e.target.checked?rows.filter(id=>id!==c.id):[...rows,c.id])}/>{tr("mvp_select_place")}</label><div className="video-fields">{(['name','city','country'] as const).map(field=><label key={field}>{tr('video_'+field)}<input maxLength={field==='name'?160:100} value={c[field]} onChange={e=>edit(i,field,e.target.value)}/></label>)}</div>
 {!c.verified&&<><p>{tr('mvp_location_uncertain')}</p><label className="video-consent"><input type="checkbox" checked={!!c.manualConfirmed} onChange={e=>setCandidates(rows=>rows.map((row,j)=>j===i?{...row,manualConfirmed:e.target.checked}:row))}/>{tr('mvp_confirm_manual')}</label></>}<div className="video-actions">{[-1,1].map(delta=><button key={delta} type="button" className="secondary" disabled={i+delta<0||i+delta>=candidates.length} aria-label={tr(delta<0?'mvp_move_up':'mvp_move_down')+' '+c.name} onClick={()=>setCandidates(rows=>{const copy=[...rows];[copy[i],copy[i+delta]]=[copy[i+delta],copy[i]];return copy;})}>{tr(delta<0?'mvp_move_up':'mvp_move_down')}</button>)}</div><p>{tr(c.duplicate?'video_duplicate':c.verified?'video_verified':'video_unverified')}{c.sourceUrl&&<> · <a href={c.sourceUrl} target="_blank" rel="noreferrer">{tr('video_location_source')}</a></>}</p><p>{tr(c.reviewAdded?'video_manual':'video_'+c.evidenceKind)} · {tr('video_confidence_'+c.confidence)}</p><details><summary>{tr('video_evidence')}</summary><p>{c.sourceEvidence}</p></details><button type="button" className="secondary" aria-label={tr('video_remove',{name:c.name})} onClick={()=>{setCandidates(rows=>rows.filter((_,j)=>i!==j).map(c=>({...c,duplicate:false})));}}>{tr('video_remove',{name:c.name})}</button></article>)}
 <button type="button" className="secondary" disabled={candidates.length>=8} onClick={()=>setCandidates(rows=>[...rows,{reviewAdded:true,id:crypto.randomUUID(),name:'',city:'',country:'',category:'attraction',activity:'User added',sourceEvidence:language()==='en'?'Added during review':'Ditambahkan saat peninjauan',evidenceKind:'inferred',confidence:'low',verified:false,verification:'unverified',recommendedDurationMinutes:60,duplicate:false}])}>{tr('video_add')}</button>
 {(!onPlan||demo)&&<div className="video-fields"><label>{tr('video_start')}<input type="date" value={start} required onChange={e=>setStart(e.target.value)}/></label><label>{tr('video_days')}<input type="number" min={1} max={14} value={days} onChange={e=>setDays(Number(e.target.value))}/></label><label>{tr('video_people')}<input type="number" min={1} max={8} value={people} onChange={e=>setPeople(Number(e.target.value))}/></label></div>}<button type="button" className="primary" disabled={!candidates.some(c=>!excluded.includes(c.id))||candidates.some(c=>!excluded.includes(c.id)&&!c.duplicate&&!c.verified&&!c.manualConfirmed)} onClick={()=>void create()}>{tr(onPlan&&!demo?'assistant_generate_combined':'video_create')}</button></section>}
 </fieldset></div>;
}
