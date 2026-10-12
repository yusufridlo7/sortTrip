import {tr,label as localize,locale} from './i18n';
import {hotelPhotos} from './hotel-photos';
export default function HotelPhoto({id}:{id:string}){const index=Number(id.split('-').at(-1))||0;const photo=hotelPhotos[index%hotelPhotos.length];return <span className="hotel-photo"><img src={photo.src} alt={tr('ui_0382')} loading="lazy" width={640} height={420}/><span className="hotel-photo-caption">{tr('ui_0383')}</span></span>}
export function HotelPhotoCredits(){return <p className="inline-note hotel-photo-credits">{tr('ui_0384')+' '}{hotelPhotos.map((p,i)=><span key={p.src}>{i>0?' · ':''}<a href={p.source} target="_blank" rel="noreferrer">{p.credit}</a></span>)}{tr('ui_0385')}</p>}
