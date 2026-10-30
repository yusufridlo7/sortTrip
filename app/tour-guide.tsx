import {useEffect,useRef,useState} from 'react';
import {Dialog,DialogContent,DialogTitle,DialogDescription} from '@/components/ui/dialog';
import {tr,language,useLanguage} from './i18n';
import LanguageSwitcher from './i18n/language-switcher';
import LocalDiscovery from './local-discovery';
import {destinationGuide,guideAnswer,guideMap,createNarrator,type Answer} from '../lib/tour-guide.mjs';
import type {Item,Trip} from './travel-data';
import './tour-guide.css';
export default function TourGuide({item,trip,onTripChange}:{item:Item;trip:Trip;onTripChange?:(trip:Trip)=>void}){
 useLanguage();const lang=language();
 const [open,setOpen]=useState(false),[active,setActive]=useState(item.id),[question,setQuestion]=useState(''),[answers,setAnswers]=useState<Answer[]>([]),[speechState,setSpeechState]=useState('idle');
 const narrator=useRef<ReturnType<typeof createNarrator>|null>(null);
 const [nearbyOpen,setNearbyOpen]=useState(false);
 const places=trip.items.filter(x=>x.category==='Wisata'),current=places.find(x=>x.id===active)||item;
 const guide=destinationGuide(current,current.locationCity||trip.destinationMeta?.city,trip.destinationMeta?.country,lang);
 const transcript=Object.values(guide.text).join('\n\n');
 useEffect(()=>{narrator.current=createNarrator(globalThis.speechSynthesis,globalThis.SpeechSynthesisUtterance,setSpeechState);return()=>narrator.current?.stop();},[]);
 useEffect(()=>{narrator.current?.stop();setAnswers([]);setQuestion('');},[active,lang,open]);
 useEffect(()=>setNearbyOpen(false),[active,open]);
 const next=places[places.findIndex(x=>x.id===current.id)+1];
 return <><button type="button" className="secondary tour-guide-entry" onClick={()=>{setActive(item.id);setOpen(true);}}>{tr('guide_open')}</button>
 <Dialog open={open} onOpenChange={setOpen}><DialogContent className="tour-guide-panel"><DialogTitle>{guide.name}</DialogTitle><DialogDescription>{guide.city} · {guide.country} · {tr('guide_demo_notice')}</DialogDescription>
 <LanguageSwitcher/>{guide.image&&<img className="tour-guide-image" src={guide.image} alt={guide.city}/>}
 <div className="tour-guide-transcript">{Object.entries(guide.text).map(([key,value])=><section key={key}><h3>{tr('guide_'+key)}</h3><p>{value}</p></section>)}</div>
 <section aria-label={tr('guide_narration')}><h3>{tr('guide_narration')}</h3><p>{tr('guide_voice_note')}</p><div className="video-actions">
 <button type="button" className="primary" onClick={()=>narrator.current?.play(transcript,lang)}>{tr('guide_listen')}</button>
 <button type="button" className="secondary" disabled={speechState!=='playing'} onClick={()=>narrator.current?.pause()}>{tr('guide_pause')}</button>
 <button type="button" className="secondary" disabled={speechState!=='paused'} onClick={()=>narrator.current?.resume()}>{tr('guide_resume')}</button>
 <button type="button" className="secondary" disabled={!['playing','paused'].includes(speechState)} onClick={()=>narrator.current?.stop()}>{tr('guide_stop')}</button></div>
 <p role="status">{tr(!narrator.current?.supported||['error','unsupported'].includes(speechState)?'guide_speech_fallback':'guide_speech_'+speechState)}</p></section>
 <section aria-label={tr('guide_ask')}><h3>{tr('guide_ask')}</h3><p>{tr('guide_demo_notice')}</p><form onSubmit={e=>{e.preventDefault();if(!question.trim())return;setAnswers(rows=>[...rows,guideAnswer(question,{guide,lang,history:rows})].slice(-12));setQuestion('');}}><label>{tr('guide_question')}<input maxLength={500} required value={question} onChange={e=>setQuestion(e.target.value)}/></label><button type="submit" className="secondary">{tr('guide_send')}</button></form><div aria-live="polite">{answers.map((answer,i)=><article className="guide-answer" key={i}><strong>{answer.question}</strong><p>{answer.answer}</p>{answer.sources.map((source,j)=><a key={source} href={source} target="_blank" rel="noopener noreferrer">{tr('guide_source')} {j+1}{' '}</a>)}</article>)}</div></section>
 <nav className="video-actions" aria-label={tr('guide_navigation')}><a className="secondary" href={guideMap(current,guide.city,guide.country)} target="_blank" rel="noopener noreferrer">{tr('guide_map')}</a><a className="secondary" href={guideMap(current,guide.city,guide.country,true)} target="_blank" rel="noopener noreferrer">{tr('guide_directions')}</a><button type="button" className="secondary" disabled={!next} onClick={()=>next&&setActive(next.id)}>{tr('guide_next')}</button><button type="button" className="secondary" onClick={()=>setOpen(false)}>{tr('guide_back')}</button></nav>
 <details className="tour-guide-nearby" open={nearbyOpen} onToggle={event=>setNearbyOpen(event.currentTarget.open)}><summary>{tr('local_title')}</summary>{open&&nearbyOpen&&<LocalDiscovery key={current.id} item={current} trip={trip} city={guide.city} country={guide.country} onTripChange={onTripChange}/>}</details>
 {guide.sources.length>0&&<section><h3>{tr('guide_sources')}</h3>{guide.sources.map((source,i)=><p key={source}><a href={source} target="_blank" rel="noopener noreferrer">{tr('guide_source')} {i+1}</a></p>)}</section>}
 </DialogContent></Dialog></>;
}
