import {transportAffiliateHome,transportLegLink} from './transport-affiliate.mjs';
import {tr,label as localize,locale} from './i18n';
import {useEffect,useRef,useState} from 'react';
import {TrainFront} from 'lucide-react';
import widgetHtml from './transport-widget';
import PartnerSelectionForm from './partner-selection-form';
import type {PartnerSearchProps} from './partner-selection';
const widgetUrl='data:text/html;charset=utf-8,'+encodeURIComponent(widgetHtml);

export default function TransportSearch(props:PartnerSearchProps){
 const frame=useRef<HTMLIFrameElement>(null);
 const [ready,setReady]=useState(false),[failed,setFailed]=useState(false),[height,setHeight]=useState(220),[attempt,setAttempt]=useState(0);
 useEffect(()=>{
  setReady(false);setFailed(false);
  const timer=window.setTimeout(()=>setFailed(true),20000);
  function receive(event:MessageEvent){
   if(event.source!==frame.current?.contentWindow)return;
   if(event.data?.type==='sorttrip-transport-size'&&Number.isFinite(event.data.height)){setHeight(Math.max(180,Math.min(700,event.data.height)));return}
   if(event.data?.type==='sorttrip-transport-error'){setReady(false);setFailed(true);window.clearTimeout(timer);return}
   if(event.data?.type!=='sorttrip-transport-ready')return;
   setReady(true);setFailed(false);window.clearTimeout(timer);
  }
  window.addEventListener('message',receive);
  return ()=>{window.clearTimeout(timer);window.removeEventListener('message',receive)};
 },[attempt]);
 return <section className="direct-search">
  <div className="direct-heading"><span className="strip-icon"><TrainFront size={26}/></span><div><div className="eyebrow">{tr('ui_0549')}</div><h1>{tr('ui_0550')}</h1><p>{tr('ui_0551')}</p></div></div>
  {props.context&&<p className="partner-context">{props.context.from} → {props.context.to} · {props.context.date}</p>}
  {!ready&&<p role="status">{failed?tr('ui_0552'):tr('ui_0553')}</p>}
  <iframe key={attempt} ref={frame} title={tr('ui_0554')} src={widgetUrl} sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-popups-to-escape-sandbox" referrerPolicy="no-referrer" style={{width:'100%',maxWidth:918,height,border:0,display:failed?'none':'block',margin:'0 auto'}}/>
  <p className="inline-note">{tr('ui_0555')}</p>
  {failed&&<button className="secondary" onClick={()=>setAttempt(n=>n+1)}>{tr('ui_0429')}</button>}
  <p><a className="secondary transport-fallback-link" href={props.context?transportLegLink({fromPlace:props.context.from||'',toPlace:props.context.to||''},props.context.date||'',props.trip?.people||1)||transportAffiliateHome:transportAffiliateHome} target="_blank" rel="noopener noreferrer sponsored">{tr('ui_0440')}</a></p>
  <p className="discovery-note">{tr('discovery_transport_tip')}</p><PartnerSelectionForm {...props} kind="transport"/>
 </section>;
}
