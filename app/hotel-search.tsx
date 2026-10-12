import {tr,label as localize,locale} from './i18n';
import {useEffect,useRef,useState} from 'react';
import {tripHotelAffiliate,tripHotelWidget,tripHotelMobileWidget,type PartnerSearchProps} from './partner-selection';
import PartnerSelectionForm from './partner-selection-form';
import InfoNote from './info-note';
export default function HotelSearch(props:PartnerSearchProps){
 const [attempt,setAttempt]=useState(0),[loaded,setLoaded]=useState(false);
 const frameHost=useRef<HTMLDivElement>(null);
 const [mobile,setMobile]=useState(()=>window.matchMedia('(max-width:640px)').matches),[frameWidth,setFrameWidth]=useState(320);
 useEffect(()=>{
  const media=window.matchMedia('(max-width:640px)');
  const update=()=>{setMobile(media.matches);setLoaded(false);};
  media.addEventListener('change',update);
  const observer=new ResizeObserver(entries=>setFrameWidth(entries[0].contentRect.width));
  if(frameHost.current)observer.observe(frameHost.current);
  return()=>{media.removeEventListener('change',update);observer.disconnect();};
 },[]);
 const scale=mobile?Math.min(1,Math.max(0,frameWidth)/320):1;
 return <section className="direct-search"><div className="direct-heading"><div><div className="eyebrow">{tr('ui_0422')}</div><h1>{tr('ui_0423')}</h1></div></div>{props.context&&<p className="partner-context">{props.context.name} · {props.context.to} · {props.context.date} → {props.context.checkOut}</p>}<InfoNote label={tr('ui_0424')}><p>{tr('ui_0425')}</p></InfoNote>{!loaded&&<p role="status">{tr('ui_0426')}</p>}<div ref={frameHost} className={"trip-hotel-frame"+(mobile?" trip-hotel-frame-mobile":"")}><div className="trip-hotel-frame-content" style={mobile?{width:320*scale,height:320*scale}:undefined}><iframe key={attempt+"-"+mobile} title={tr('ui_0427')} src={mobile?tripHotelMobileWidget:tripHotelWidget} style={mobile?{width:320,height:320,maxWidth:"none",transform:`scale(${scale})`,transformOrigin:"top left"}:undefined} sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-popups-to-escape-sandbox" referrerPolicy="strict-origin-when-cross-origin" onLoad={()=>setLoaded(true)} scrolling={mobile?"no":"auto"}/></div></div><div className="partner-actions"><a className="secondary" href={tripHotelAffiliate} target="_blank" rel="noopener noreferrer sponsored">{tr('ui_0428')}</a><button className="text-action" onClick={()=>{setLoaded(false);setAttempt(n=>n+1)}}>{tr('ui_0429')}</button></div><PartnerSelectionForm {...props} kind="hotels"/></section>;
}
