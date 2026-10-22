import {useEffect,useRef,useState} from 'react';
import {tr} from './i18n';
import {tripHotelAffiliate,tripHotelWidget,tripHotelMobileWidget,type PartnerSearchProps} from './partner-selection';
import PartnerSelectionForm from './partner-selection-form';
import './trip-hotel-search.css';
export default function TripHotelSearch(props:PartnerSearchProps){
 const container=useRef<HTMLDivElement>(null),[width,setWidth]=useState(0);
 useEffect(()=>{const el=container.current;if(!el)return;const observer=new ResizeObserver(entries=>setWidth(Math.floor(entries[0].contentRect.width)));observer.observe(el);return()=>observer.disconnect();},[]);
 const mobile=width<856,baseWidth=mobile?320:856,baseHeight=mobile?320:190,scale=Math.min(1,width/baseWidth);
 return <section className="direct-search trip-affiliate-search"><div className="direct-heading"><div><div className="eyebrow">SORTTRIP · HOTEL · TRIP.COM</div><h1>{tr('ui_0423')}</h1><p>{tr('trip_hotel_intro')}</p></div></div>
  {props.context&&<p className="partner-context">{tr('trip_hotel_context',{name:props.context.to||props.context.name||'',start:props.context.date||'',end:props.context.checkOut||''})}</p>}
  <div ref={container} className="trip-affiliate-widget"><div className="trip-affiliate-canvas" style={{width:Math.min(width,baseWidth)||'100%',height:width?baseHeight*scale:320}}>
   {width>0&&<iframe key={mobile?'mobile':'desktop'} src={mobile?tripHotelMobileWidget:tripHotelWidget} title={tr('trip_hotel_widget_title')} scrolling="no" style={{width:baseWidth,height:baseHeight,transform:`scale(${scale})`}}/>}
  </div></div>
  <div className="partner-actions"><a className="secondary" href={tripHotelAffiliate} target="_blank" rel="noopener noreferrer sponsored">{tr('trip_hotel_open')}</a></div>
  <p className="inline-note">{tr('trip_hotel_note')}</p><PartnerSelectionForm kind="hotels" {...props}/>
 </section>;
}
