import {createContext,useContext,useEffect,useMemo,useRef,useState,type ReactNode} from 'react';
import {supabase} from '../supabase';
import {type Trip} from '../travel-data';
import {tr,useLanguage,label} from './index';
export function narrativeTexts(trip:Trip|null){const values:string[]=[];const add=(v:unknown)=>{if(typeof v==='string'&&v.trim()&&v.length<=1500&&!values.includes(v))values.push(v);};if(!trip)return values;add(trip.aiPlan?.summary);trip.items.filter(i=>i.aiGenerated).forEach(i=>{if(i.category!=='Penginapan')add(i.title);add(i.note);i.routeOptions?.forEach(o=>{add(o.summary);o.legs.forEach(l=>add(l.note));});});trip.aiConversation?.filter(m=>m.role==='assistant').forEach(m=>add(m.text));return values.slice(0,300);}
type Context={text:(value:string)=>string;busy:boolean;error:boolean;retry:()=>void};
const NarrativeContext=createContext<Context>({text:label,busy:false,error:false,retry:()=>{}});
export const useNarrative=()=>useContext(NarrativeContext).text;
export function NarrativeText({value}:{value:string}){const text=useNarrative();return <>{text(value)}</>;}
const cache=new Map<string,Record<string,string>>();
const storageKey='sorttrip-narrative-translations-v1';
// A bounded, tab-scoped cache stores narrative text only, never authentication data.
function readCache(key:string):Record<string,string>|undefined{try{const entries=JSON.parse(sessionStorage.getItem(storageKey)||'[]');const match=Array.isArray(entries)?entries.find(e=>Array.isArray(e)&&e[0]===key):null;if(match&&match[1]&&typeof match[1]==='object'&&Object.values(match[1]).every(v=>typeof v==='string'))return match[1];}catch{}return undefined;}
function saveCache(key:string,value:Record<string,string>){cache.set(key,value);if(cache.size>10)cache.delete(cache.keys().next().value!);try{let entries=[...cache.entries()].slice(-10);while(JSON.stringify(entries).length>120000&&entries.length>1)entries.shift();if(JSON.stringify(entries).length<=120000)sessionStorage.setItem(storageKey,JSON.stringify(entries));}catch{}}
export default function NarrativeProvider({trip,userId,active,children}:{trip:Trip|null;userId?:string;active:boolean;children:ReactNode}){
 const language=useLanguage();const texts=useMemo(()=>narrativeTexts(trip),[trip]);const signature=JSON.stringify(texts);const key=(userId||'guest')+':'+language+':'+signature;
 const [translated,setTranslated]=useState<{key:string;texts:Record<string,string>}>({key:'',texts:{}}),[busy,setBusy]=useState(false),[error,setError]=useState(false),[attempt,setAttempt]=useState(0);const failed=useRef(new Set<string>());
 useEffect(()=>{const abort=new AbortController();setBusy(false);setError(false);if(!active||!trip?.aiPlan||!texts.length||!userId||(trip.aiPlan.context as {language?:string}).language===language||(!(trip.aiPlan.context as {language?:string}).language&&language==='id'))return;
  const cached=cache.get(key)||readCache(key);if(cached){cache.set(key,cached);setTranslated({key,texts:cached});return;}
  if(failed.current.has(key)){setError(true);return;}
  async function translate(){if(!supabase)return;setBusy(true);try{const {data}=await supabase.auth.getSession();if(!data.session)throw Error('auth');const r=await fetch('/api/itinerary/translate',{method:'POST',signal:AbortSignal.any([abort.signal,AbortSignal.timeout(65000)]),headers:{'Content-Type':'application/json','X-SortTrip-Language':language,Authorization:'Bearer '+data.session.access_token},body:JSON.stringify({language,entries:texts.map((text,i)=>({id:'n'+i,text}))})});if(!r.ok)throw Error('translation');const result=await r.json();if(result.language!==language||!Array.isArray(result.entries)||result.entries.length!==texts.length)throw Error('shape');const map:Record<string,string>={};texts.forEach((text,i)=>{const value=result.entries.find((e:{id:string;text:string})=>e.id==='n'+i)?.text;if(typeof value!=='string')throw Error('shape');map[text]=value;});if(!abort.signal.aborted){saveCache(key,map);setTranslated({key,texts:map});}}
   catch{if(!abort.signal.aborted){failed.current.add(key);setError(true);}}finally{if(!abort.signal.aborted)setBusy(false);}}
  void translate();return()=>abort.abort();
 },[key,active,attempt]);
 const text=(value:string)=>translated.key===key?translated.texts[value]||label(value):label(value);
 return <NarrativeContext.Provider value={{text,busy,error,retry:()=>{failed.current.delete(key);setAttempt(n=>n+1);}}}>{children}</NarrativeContext.Provider>;
}
export function NarrativeStatus(){const context=useContext(NarrativeContext);return context.busy?<p className="narrative-status" role="status">{tr('translate_working')}</p>:context.error?<div className="narrative-status" role="status"><span>{tr('translate_failed')}</span><button type="button" className="text-action" onClick={context.retry}>{tr('translate_retry')}</button></div>:null;}
