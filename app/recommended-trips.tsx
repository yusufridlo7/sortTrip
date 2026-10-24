import {useEffect,useState} from 'react';

import {Dialog,DialogContent,DialogTitle,DialogDescription,DialogClose} from '@/components/ui/dialog';

import {tr,formatMoney,locale} from './i18n';

type Stats={n:number;mean:number;sd:number|null;min:number};

type Recommendation={id:string;city:string;airport:string;image:string;budget:number|null;days:number;nights:number;hotelTotal:number|null;foodTotal:number;flightEstimate:number|null;hotelMinimum:number|null;foodPerDay:number;flight:Stats|null;months:number;updatedAt:string|null;tickets?:{series:string;title:string;basis:string;stats:Stats|null}[]};

const defaults:Recommendation[]=[['kl','Kuala Lumpur','KUL','kuala-lumpur'],['hanoi','Hanoi','HAN','hanoi'],['singapore','Singapore','SIN','singapore']].map(([id,city,airport,image])=>({id,city,airport,image:'/'+image+'.jpg'+(id==='hanoi'?'?v=2':''),budget:null,days:id==='hanoi'?5:4,nights:id==='hanoi'?4:3,hotelTotal:null,foodTotal:0,flightEstimate:null,hotelMinimum:null,foodPerDay:0,flight:null,months:0,updatedAt:null}));

export default function RecommendedTrips({onSelect}:{onSelect:(r:Recommendation)=>void}){

 const [cities,setCities]=useState(defaults),[selected,setSelected]=useState<Recommendation|null>(null),[error,setError]=useState(false);

 useEffect(()=>{const abort=new AbortController();void fetch('/api/recommendations',{signal:abort.signal,cache:'no-cache'}).then(async r=>{if(!r.ok)throw Error();const b=await r.json();if(!Array.isArray(b.cities)||b.cities.length!==3)throw Error();setCities(b.cities);setSelected(current=>current?b.cities.find((c:Recommendation)=>c.id===current.id)||null:null);}).catch(()=>{if(!abort.signal.aborted)setError(true)});return()=>abort.abort()},[]);

 return <section className="recommended-trips"><h2>{tr('rec_heading')}</h2><p>{tr('rec_intro')}</p>{error&&<p role="status">{tr('rec_unavailable')}</p>}<div className="recommendation-grid">{cities.map(city=><button type="button" className="recommendation-card" key={city.id} onClick={()=>setSelected(city)}><img src={city.image} alt="" loading="lazy" width="640" height="400"/><span><strong>{city.city}</strong><small>{city.budget?tr('rec_from',{price:formatMoney(city.budget)}):tr('rec_check')}</small></span></button>)}</div>

 <Dialog open={!!selected} onOpenChange={open=>{if(!open)setSelected(null)}}><DialogContent showCloseButton={false} className="recommendation-dialog"><div className="recommendation-dialog-heading"><DialogTitle>{selected?.city}</DialogTitle><DialogClose aria-label={tr('close')}>×</DialogClose></div><div className="recommendation-dialog-body"><DialogDescription>{tr('rec_assumptions',{days:selected?.days||4,nights:selected?.nights||3})}</DialogDescription>{selected&&<>

 <strong className="recommendation-budget">{selected.budget?tr('rec_from',{price:formatMoney(selected.budget)}):tr('rec_check')}</strong><p>{tr('rec_scope')}</p>

 <ol className="recommendation-days">{Array.from({length:selected.days},(_,i)=>i+1).map(day=><li key={day}><strong>{tr('rec_day',{day})}</strong><p>{tr('rec_'+selected.id+'_'+day)}</p></li>)}</ol>

 <details><summary>{tr('rec_breakdown')}</summary><dl className="recommendation-breakdown"><dt>{tr('rec_flight')}</dt><dd>{selected.flightEstimate?formatMoney(selected.flightEstimate):tr('rec_missing')}</dd><dt>{tr('rec_hotel_total',{nights:selected.nights})}</dt><dd>{selected.hotelTotal?formatMoney(selected.hotelTotal):tr('rec_missing')}</dd><dt>{tr('rec_food',{days:selected.days})}</dt><dd>{selected.foodTotal?formatMoney(selected.foodTotal):tr('rec_missing')}</dd></dl>

 <p>{selected.updatedAt?tr('rec_updated_display',{date:new Date(selected.updatedAt).toLocaleDateString(locale(),{year:'numeric',month:'long',day:'numeric'})}):tr('rec_missing')}</p><p>{tr('rec_excludes')}</p></details>

 {selected.id==='hanoi'&&<small>{tr('rec_photo')}{' '}<a href="https://www.pexels.com/photo/sunset-over-hanoi-skyline-and-hoan-kiem-lake-38983924/" target="_blank" rel="noreferrer">{tr('rec_author')}</a>{' · '}<a href="https://www.pexels.com/license/" target="_blank" rel="noreferrer">{tr('rec_license')}</a>{' · '}{tr('rec_crop')}</small>}

 <button type="button" className="primary" onClick={()=>{onSelect(selected);setSelected(null)}}>{tr('rec_search')}</button></>}</div></DialogContent></Dialog></section>;

}
