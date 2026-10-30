import {forwardRef,useEffect,useImperativeHandle,useRef,useState} from 'react';
import {Dialog,DialogContent,DialogTitle,DialogDescription} from '@/components/ui/dialog';
import {supabase} from './supabase';
import {apiFetch} from './api-fetch';
import {gateDDemoEnabled} from '../lib/gate-d-network.mjs';
import {language,tr} from './i18n';
import {apiTrip,fetchFlights} from './api-flights';
import {addDays,money,resolveSearchDates,type SearchCriteria,type Trip,type Item} from './travel-data';
import './assistant-discovery.css';
export type AssistantDiscoveryHandle={start:()=>Promise<void>;preview:()=>Promise<void>};
type Option={city:string;airport:string;country:string;days:number;summary:string;stops:{day:number;time:string;title:string;category:string;place:string;note:string}[]};
type Card={option:Option;trip:Trip;flightPrice:number|null;budgetFrom:number|null};
export default forwardRef<AssistantDiscoveryHandle,{prompt:string;preferences:SearchCriteria;fixedDays:boolean;loggedIn:boolean;onLogin?:()=>void;onChoose:(trip:Trip)=>void;onBusy:(busy:boolean)=>void}>(function AssistantDiscovery({prompt,preferences,fixedDays,loggedIn,onLogin,onChoose,onBusy},ref){
 const [cards,setCards]=useState<Card[]>([]),[message,setMessage]=useState(''),[stage,setStage]=useState(''),[subscribe,setSubscribe]=useState(false);
 const [qaDiagnostic,setQADiagnostic]=useState('');
 const running=useRef(false),controller=useRef<AbortController|null>(null);
 useEffect(()=>()=>controller.current?.abort(),[]);
 useEffect(()=>{setCards([]);setMessage('');controller.current?.abort();},[prompt,preferences,fixedDays,loggedIn]);
 const t=(id:string)=>tr('assistant_discovery_'+id);
 const isolatedDemo=gateDDemoEnabled(import.meta.env.MODE,import.meta.env.VITE_GATE_D_DEMO,import.meta.env.VITE_SUPABASE_URL);
 async function start(preview=false){
  if(running.current)return;
  setCards([]);setMessage('');
  setQADiagnostic('');
  if(!loggedIn){onLogin?.();return;}
  running.current=true;onBusy(true);controller.current?.abort();const control=new AbortController();controller.current=control;
  async function call(path:string,body:unknown){
   const session=await supabase?.auth.getSession();if(!session?.data.session)throw Error('AUTH_REQUIRED');
   const endpoint=!isolatedDemo&&preview&&import.meta.env.MODE==='meta-qa'?'/api/meta-qa/discovery-preview':'/api/assistant/'+path;
   const response=await fetch(endpoint,{method:'POST',signal:AbortSignal.any([control.signal,AbortSignal.timeout(45000)]),headers:{'Content-Type':'application/json',Authorization:'Bearer '+session.data.session.access_token},body:JSON.stringify(body)});
   let data;try{data=await response.json();}catch{throw Error('SUBSCRIPTION_UNAVAILABLE');}
   if(!response.ok){if(preview&&import.meta.env.MODE==='meta-qa')setQADiagnostic(JSON.stringify({http:response.status,code:typeof data.code==='string'&&/^[A-Z_]{1,50}$/.test(data.code)?data.code:'FAILED',stage:data.qa?.validationStage,usage:data.qa?.usage}));throw Error(data.code||'SUBSCRIPTION_UNAVAILABLE');}return data;
  }
  try{
   if(!preview){
    setStage(t('checking'));
    const access=await call('access',{});
    if(access.meta?.code&&access.meta.code!=='META_AI_ACTIVE')throw Error(access.meta.code);
    if(!access.pass||access.pass.remaining<1){if(import.meta.env.MODE==='staging')setMessage(tr('staging_entitlement_missing'));else setSubscribe(true);return;}
   }
   setStage(t('planning'));
   const result=await call('discover',{prompt,consent:true,preferences:{origin:preferences.origin,people:preferences.people,budget:preferences.budget,days:fixedDays?preferences.minDays:null,language:language()}});
   if(!Array.isArray(result.options)||!result.options.length){setMessage(result.question||t('clarify'));return;}
   setStage(t('pricing'));
   let references:{airport:string;hotelMinimum:number|null;updatedAt:string|null}[]=[];
   if(!isolatedDemo)try{const response=await apiFetch('/api/recommendations',{signal:AbortSignal.any([control.signal,AbortSignal.timeout(8000)])});const data=await response.json();if(response.ok&&!data.stale&&Array.isArray(data.cities))references=data.cities;}catch{/* Missing/stale data must not become a made-up price. */}
   const results:Card[]=await Promise.all(result.options.map(async(option:Option)=>{
    const q=resolveSearchDates({...preferences,destination:option.airport,region:'world',minDays:option.days,maxDays:option.days,durationMode:'fixed'});
    let trip:Trip|null=null,flightPrice:number|null=null;
    if(!isolatedDemo)try{const response=await fetchFlights(q,control.signal);const f=response.flights.filter(f=>f.destination===option.airport&&f.days===option.days).sort((a,b)=>a.price-b.price)[0];if(f){trip=apiTrip(f,q);flightPrice=f.price;}}catch{/* Plans remain useful without inventing unavailable fares. */}
    const start=trip?.start||q.outFrom;
    const items:Item[]=option.stops.map((s,index)=>({id:'meta-'+index,day:s.day,time:s.time,title:s.title,category:s.category,place:s.place,note:s.note,price:0,priceUnknown:true,paid:false,aiGenerated:true,...(s.category==='Penginapan'?{shared:true,checkin:addDays(start,s.day-1),checkout:addDays(start,s.day)}:{})}));
    // Every overnight remains visible, even when supplier rates are unavailable.
    for(let day=1;day<option.days;day++)if(!items.some(item=>item.category==='Penginapan'&&item.day===day))items.push({id:'meta-stay-'+day,day,time:'20:00',title:t('stay'),category:'Penginapan',place:option.city,note:t('stay_note'),price:0,priceUnknown:true,paid:false,shared:true,checkin:addDays(start,day-1),checkout:addDays(start,day),aiGenerated:true});
    items.sort((a,b)=>a.day-b.day||a.time.localeCompare(b.time));
    const reference=references.find(r=>r.airport===option.airport);
    const normalize=(value:string)=>value.normalize('NFKD').replace(/\p{M}/gu,'').toLowerCase().replace(/[^a-z]/g,'');
    const stays=items.filter(item=>item.category==='Penginapan');
    // A Hanoi reference cannot price a night in Sapa. Keep mixed-city stays
    // unknown until their own supplier searches have succeeded.
    const comparable=stays.length===Math.max(0,option.days-1)&&stays.every(item=>normalize(item.place||'').includes(normalize(option.city)));
    const nightly=comparable?reference?.hotelMinimum:null,rooms=Math.ceil(q.people/2);
    if(Number.isFinite(nightly)&&nightly!>0&&reference?.updatedAt)for(const stay of stays){stay.price=nightly!*rooms;stay.priceUnknown=false;stay.priceQuote={id:stay.id,amountIDR:nightly!,basis:'room_night',scope:'reference',sourceUrl:new URL('/api/recommendations',location.origin).href,quote:t('hotel_reference'),checkedAt:reference.updatedAt,provider:'SortTrip / LiteAPI'};}
    const budgetFrom=flightPrice!==null&&stays.every(stay=>!stay.priceUnknown)?Math.ceil(flightPrice+stays.reduce((sum,stay)=>sum+stay.price,0)/q.people):null;
    return {option,flightPrice,budgetFrom,trip:{...(trip||{destination:option.airport.toLowerCase(),origin:q.origin,start,days:option.days,people:q.people,budget:q.budget,journey:q.journey}),destinationMeta:{city:option.city,country:option.country,code:option.airport},aiPrompt:prompt,estimateIncomplete:true,items:[...(trip?.items.filter(x=>x.category==='Pesawat')||[]),...items]}};
   }));
   if(!control.signal.aborted)setCards(results);
  }catch(error){
   const code=error instanceof Error?error.message:'';
   if(code==='TRIP_PASS_REQUIRED')setSubscribe(true);
   else if(code==='META_AI_EXPIRED')setMessage(language()==='en'?'Meta AI access has expired. You can still edit and save trips manually.':'Akses Meta AI sudah berakhir. Kamu tetap bisa mengedit dan menyimpan perjalanan secara manual.');
   else if(code==='META_AI_CUTOFF_INVALID')setMessage(language()==='en'?'Meta AI is disabled because its expiry configuration is unavailable.':'Meta AI dinonaktifkan karena konfigurasi masa aktif tidak tersedia.');
   else if(code==='AUTH_REQUIRED')onLogin?.();
   else if(!control.signal.aborted)setMessage(t(code==='AI_BUSY'?'busy':code==='BUDGET_EXHAUSTED'?'budget_error':code==='SUBSCRIPTION_UNAVAILABLE'?'access_error':'error'));
  }finally{setStage('');running.current=false;onBusy(false);}
 }
 useImperativeHandle(ref,()=>({start:()=>start(),preview:()=>start(true)}));
 const subscriptionTrip:Trip={destination:'planning',destinationMeta:{city:language()==='en'?'Travel planning':'Rencana perjalanan',country:'',code:''},origin:preferences.origin,start:preferences.outFrom||new Date().toISOString().slice(0,10),days:fixedDays?preferences.minDays:3,people:preferences.people,budget:preferences.budget,items:[],aiPrompt:prompt};
 return <section className="assistant-discovery" aria-label={t('title')}>
  {isolatedDemo&&<p role="note">{language()==='en'?'QA demo: supplier pricing is disabled. Prices unavailable.':'Demo QA: pencarian harga mitra dinonaktifkan. Harga belum tersedia.'}</p>}
  {import.meta.env.MODE==='meta-qa'&&prompt.trim()&&<div className="inline-note"><p>{t('qa_notice')}</p><button type="button" className="secondary" disabled={running.current} onClick={()=>void start(true)}>{t('qa_preview')}</button></div>}
  {stage&&<p role="status" className="assistant-progress"><span aria-hidden="true" className="assistant-dots">•••</span> {stage}</p>}
  {message&&<p role="status" className="inline-note">{message}</p>}
  {import.meta.env.MODE==='meta-qa'&&qaDiagnostic&&<pre>{qaDiagnostic}</pre>}
  {cards.length>0&&<><h2>{t('title')}</h2><p>{t('review')}</p><div className="assistant-trip-options">{[...cards].sort((a,b)=>(a.budgetFrom??a.flightPrice??Infinity)-(b.budgetFrom??b.flightPrice??Infinity)).map((card,i)=><article key={i}><h3>{card.option.city}, {card.option.country}</h3><p>{tr('days',{count:card.trip.days})} · {tr('nights',{count:Math.max(0,card.trip.days-1)})}</p><p>{card.option.summary}</p><strong>{card.budgetFrom?t('budget_from')+' '+money(card.budgetFrom):card.flightPrice? t('flight_from')+' '+money(card.flightPrice):t('no_fare')}</strong><small>{t(card.budgetFrom?'budget_scope':'unknown_prices')}</small>{preferences.budget>0&&card.budgetFrom!==null&&card.budgetFrom>preferences.budget&&<small>{t('above_budget')}</small>}<button type="button" className="primary" onClick={()=>onChoose(card.trip)}>{t('open')}</button></article>)}</div></>}
  <Dialog open={subscribe} onOpenChange={setSubscribe}><DialogContent><DialogTitle>{t('subscribe')}</DialogTitle><DialogDescription>{t('paid_description')}</DialogDescription><p>{t('subscription_steps')}</p><button type="button" className="primary" onClick={()=>{setSubscribe(false);onChoose(subscriptionTrip);}}>{t('manage')}</button></DialogContent></Dialog>
 </section>;
});
