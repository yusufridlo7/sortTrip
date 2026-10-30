import {useState} from 'react';
import {createRoot} from 'react-dom/client';
import VideoItinerary from './video-itinerary';
import WorldPlanner from './world-planner';
import FlightSearch from './flight-search';
import HotelSearch from './hotel-search';
import TransportBooking from './transport-booking';
import ActivityTickets from './activity-tickets';
import TourGuide from './tour-guide';
import LanguageSwitcher from './i18n/language-switcher';
import {tr,useLanguage} from './i18n';
import {addDays,type Trip} from './travel-data';
import '../public/branding/brand-tokens.css';import './globals.css';import './brand-theme.css';import './mvp-demo.css';
const storageKey='sorttrip-local-mvp-demo-v1';
function Demo(){
 useLanguage();const [source,setSource]=useState<'upload'|'url'>('upload'),[trip,setTrip]=useState<Trip|null>(null),[notice,setNotice]=useState(''),[dirty,setDirty]=useState(false),[search,setSearch]=useState('');
 function change(next:Trip){setTrip(next);setDirty(true);}
 function save(){try{if(trip){localStorage.setItem(storageKey,JSON.stringify(trip));setDirty(false);setNotice('mvp_saved');}}catch{setNotice('staging_save_error');}}
 function reload(){try{const raw=localStorage.getItem(storageKey);if(!raw){setNotice('mvp_no_save');return;}const value=JSON.parse(raw);if(value.version!==2||!Array.isArray(value.items)||!value.items.length||value.items.length>100||!value.items.some((x:{note?:string})=>x.note?.includes('CONTOH DEMO')||x.note?.includes('DEMO FIXTURE')))throw Error();setTrip(value);setDirty(false);setNotice('mvp_saved');}catch{setNotice('staging_save_error');}}
 return <main className="mvp-demo"><header><h1>{tr('mvp_demo_title')}</h1><LanguageSwitcher/></header><p className="city-warning">{tr('mvp_demo_notice')}</p><button type="button" className="secondary" onClick={reload}>{tr('mvp_reload')}</button>{notice&&<p role="status">{tr(notice)}</p>}
 <section className="mvp-source"><label>{tr('mvp_source')}<select value={source} onChange={e=>setSource(e.target.value as 'upload'|'url')}><option value="upload">{tr('mvp_upload')}</option><option value="url">{tr('mvp_link')}</option></select></label><VideoItinerary sourceKind={source} demoOnly onLogin={()=>setNotice('mvp_demo_notice')} onCreate={change}/></section>
 {trip&&<><section className="mvp-booking"><h2>{tr('mvp_search')}</h2><p>{tr('mvp_unavailable')}</p><div className="video-actions">{['flight','hotel','transport','activity'].map(kind=><button type="button" className="secondary" key={kind} onClick={()=>setSearch(kind)} aria-pressed={search===kind}>{tr('mvp_search_'+kind)}</button>)}</div>
 {search&&<p data-testid="search-context">{tr('mvp_trip_parameters')}: {trip.origin} → {trip.destinationMeta?.city} ({trip.destinationMeta?.code}) · {trip.start} → {addDays(trip.start,trip.days-1)} · {trip.people}</p>}
 {search==='flight'&&<FlightSearch direct initialTrip={trip} aiEnabled={false} onChoose={change}/>}
 {search==='hotel'&&<HotelSearch trip={trip} trips={[]} context={{to:trip.destinationMeta?.city,country:trip.destinationMeta?.country,date:trip.start,checkOut:addDays(trip.start,Math.max(1,trip.days-1))}} onAdd={(next,item)=>change({...next,items:[...next.items,item]})}/>}
 {search==='transport'&&<><p>{tr('mvp_unavailable')}</p><TransportBooking from="bkk" to="bkk" date={trip.start} people={trip.people}/></>}
 {search==='activity'&&trip.items.filter(item=>item.category==='Wisata').map(item=><ActivityTickets key={item.id} item={item} trip={trip}/>)}</section>
 <WorldPlanner trip={trip} onChange={change} onSave={save} busy={false} dirty={dirty} onSearch={kind=>setSearch(kind==='hotels'?'hotel':'transport')}/>
 <section className="mvp-guide-links">{trip.items.filter(item=>item.category==='Wisata').map(item=><div key={item.id}><h3>{item.title}</h3><TourGuide item={item} trip={trip} onTripChange={change}/></div>)}</section></>}
 </main>;
}
if(import.meta.env.MODE==='mvp-demo')createRoot(document.getElementById('root')!).render(<Demo/>);
