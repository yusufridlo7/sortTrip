import ItemBooking from './item-booking';
import type {PartnerContext} from './partner-selection';
import {useEffect,useRef,useState} from 'react';
import {type Trip,addDays,shortDate,geoData} from './travel-data';
import {routePoints} from './local-transport-data';
import LocalTransport from './local-transport';
import AIItemDetails from './ai-item-details';
import InfoNote from './info-note';
import {Choice} from './flight-search';
export default function RouteMap({trip,onChange,onSearch}:{trip:Trip;onChange:(t:Trip)=>void;onSearch?:(kind:'hotels'|'transport',context:PartnerContext)=>void}){
 const [day,setDay]=useState('1'),[error,setError]=useState('');
 const container=useRef<HTMLDivElement>(null);
 const catalog=geoData[trip.destination];
 const points=routePoints(trip,+day),signature=JSON.stringify(points);
 const items=trip.items.filter(x=>x.day===+day&&['Wisata','Penginapan','Transportasi'].includes(x.category)).sort((a,b)=>a.time.localeCompare(b.time));
 useEffect(()=>{let disposed=false,map:any;const resize=new ResizeObserver(()=>map?.invalidateSize());if(container.current)resize.observe(container.current);setError('');
  import('leaflet').then(L=>{if(disposed||!container.current)return;map=L.map(container.current,{scrollWheelZoom:false});
   L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png',{attribution:'&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',maxZoom:19}).on('tileerror',()=>setError('Latar peta belum termuat. Tautan lokasi dan rute tetap tersedia.')).addTo(map);
   const bounds:[number,number][]=[];points.forEach((p,i)=>{bounds.push([p.geo.lat,p.geo.lng]);const icon=L.divIcon({className:'route-marker',html:`<span style="background:${p.kind==='Penginapan'?'#176b53':'#326fe5'}">${i+1}</span>`,iconSize:[30,36],iconAnchor:[15,32]});const label=document.createElement('span');label.textContent=`${i+1}. ${p.name}`;L.marker([p.geo.lat,p.geo.lng],{icon,title:p.name}).addTo(map).bindPopup(label)});
   if(bounds.length){L.polyline(bounds,{color:'#3679de',weight:3,dashArray:'7 9',opacity:.8}).addTo(map);map.fitBounds(bounds,{padding:[35,35],maxZoom:15})}else map.setView(catalog?[catalog.hotel.geo.lat,catalog.hotel.geo.lng]:[0,0],catalog?13:2);
  }).catch(()=>setError('Peta belum tersedia. Gunakan tautan lokasi dan rute.'));
  return()=>{disposed=true;resize.disconnect();map?.remove()};
 },[signature,trip.destination]);
 return <section className="route-section"><div className="map-toolbar"><Choice label="Hari pada peta" value={day} onChange={setDay} options={Array.from({length:trip.days},(_,i)=>[String(i+1),`Hari ${i+1} · ${shortDate(addDays(trip.start,i))}`])}/><InfoNote label="Informasi peta dan rute"><p>Garis putus-putus hanya urutan titik, bukan jalur jalan. Titik tanpa koordinat tidak diperkirakan otomatis. Rekomendasi AI, tarif bersumber dan simulasi jarak dibedakan di bawah.</p></InfoNote></div><div className="map-canvas" ref={container} role="region" aria-label={`Peta perjalanan hari ${day}`}/>{error&&<p role="status">{error}</p>}{items.some(x=>['Wisata','Penginapan'].includes(x.category)&&!x.geo)&&<p className="inline-note">Beberapa tempat belum memiliki koordinat. Buka lokasi melalui Maps di bawah.</p>}
 <div className="map-route-list">{items.map(item=><article key={item.id}><strong>{item.time} · {item.title}</strong>{item.aiGenerated?<AIItemDetails item={item} onSelectRoute={index=>{if(!item.paid)onChange({...trip,items:trip.items.map(x=>x.id===item.id?{...x,selectedRoute:index,userEdited:true}:x)});}}/>:<p>{item.note}</p>}{['Wisata','Penginapan'].includes(item.category)&&<a href={'https://www.google.com/maps/search/?'+new URLSearchParams({api:'1',query:(item.place||item.title)+' '+(item.locationCity||trip.destinationMeta?.city||'')})} target="_blank" rel="noopener noreferrer">Lihat lokasi ↗</a>}<ItemBooking item={item} trip={trip} onSearch={onSearch}/></article>)}</div>{catalog&&<LocalTransport key={day+signature} trip={trip} day={+day} onChange={onChange}/>}</section>;
}
