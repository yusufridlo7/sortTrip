import {Check,ArrowUpRight,LockKeyhole,Flag,Plane,TrainFront,BedDouble,Landmark,MapPin,ChevronRight} from 'lucide-react';
import {BrandIcon} from './brand-logo';
import {guidePin} from '../shared/guide-view.mjs';
export default function GuideCheckpointTrail({checkpoints,progress,reached,active,en,onSelect}:{checkpoints:any[];progress:any;reached:string[];active:boolean;en:boolean;onSelect:(id:string)=>void}){
 const pin=guidePin(checkpoints,progress,reached,active),t=(id:string,eng:string)=>en?eng:id;
 return <ol className="guide-trail" aria-label={t('Jalur checkpoint perjalanan','Trip checkpoint trail')}>{checkpoints.map((c,i)=>{
 const done=reached.includes(c.id),here=pin.id===c.id,expected=active&&progress.current?.id===c.id;
 const PlaceIcon=c.category==='Pesawat'?Plane:c.category==='Transportasi'?TrainFront:c.category==='Penginapan'?BedDouble:c.category==='Wisata'?Landmark:MapPin;
 return <li key={c.id} className={[done?'is-reached':'',here?'has-pin':'',expected?'is-expected':'',c.at===null?'is-unscheduled':''].join(' ')}>
 {i<checkpoints.length-1&&<svg className="guide-trail-line" viewBox="0 0 100 170" preserveAspectRatio="none" aria-hidden="true"><path d="M50 0 C110 55 -10 115 50 170"/></svg>}
 <button className="guide-trail-node" type="button" aria-label={t('Detail checkpoint: ','Checkpoint details: ')+c.title} aria-current={here?'step':undefined} onClick={()=>onSelect(c.id)}>{here?<BrandIcon/>:done?<Check size={20}/>:i===checkpoints.length-1?<Flag size={18}/>:<span>{i+1}</span>}</button>
 <button type="button" className="guide-trail-card" onClick={()=>onSelect(c.id)}><span className="guide-checkpoint-art" aria-hidden="true"><PlaceIcon size={28}/></span><span className="guide-checkpoint-copy"><span className="guide-trail-time">{c.time||t('Jam belum diisi','Time not set')}</span><span className="guide-trail-meta">{t('Hari ','Day ')+c.day} · {c.date} · {c.time||t('Jam belum diisi','Time not set')}</span><span className="guide-trail-title">{c.title}<ArrowUpRight size={19}/></span><span className="guide-trail-place"><MapPin size={12} aria-hidden="true"/>{c.city||c.zone}</span><span className="guide-trail-tags">{here?<span className="guide-pin-label">{pin.basis==='confirmed'?t('Terakhir dikonfirmasi','Last confirmed'):t('Perkiraan menurut jadwal','Expected by schedule')}</span>:done?<span>{t('Checkpoint tercapai','Checkpoint reached')}</span>:expected?<span>{t('Diharapkan sekarang','Expected now')}</span>:<span>{active?t('Belum dikonfirmasi','Not confirmed'):t('Pratinjau rencana','Plan preview')}</span>}{c.protected&&<span><LockKeyhole size={13}/>{t('Diprioritaskan & dilindungi','Prioritized & protected')}</span>}</span><span className="guide-trail-detail">{t('Lihat wisata & perjalanan berikutnya','View details & next connection')} →</span></span><ChevronRight className="guide-card-chevron" size={17} aria-hidden="true"/></button>
 </li>;
 })}</ol>;
}
