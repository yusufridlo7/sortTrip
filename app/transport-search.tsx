import {useEffect,useRef,useState} from 'react';
import {TrainFront} from 'lucide-react';
import widgetHtml from './transport-widget';
const widgetUrl='data:text/html;charset=utf-8,'+encodeURIComponent(widgetHtml);

export default function TransportSearch(){
 const frame=useRef<HTMLIFrameElement>(null);
 const [ready,setReady]=useState(false),[failed,setFailed]=useState(false),[height,setHeight]=useState(220);
 useEffect(()=>{
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
 },[]);
 return <section className="direct-search">
  <div className="direct-heading"><span className="strip-icon"><TrainFront size={26}/></span><div><div className="eyebrow">SORTTRIP · TRANSPORTASI</div><h1>Cari tiket transportasi</h1><p>Cari kereta, bus, ferry, dan transfer. Pilih asal, tujuan, serta tanggal keberangkatan.</p></div></div>
  {!ready&&<p role="status">{failed?'Form belum dapat dimuat. Silakan coba muat ulang form.':'Memuat form pencarian transportasi…'}</p>}
  <iframe ref={frame} title="Form pencarian tiket transportasi" src={widgetUrl} sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-popups-to-escape-sandbox" referrerPolicy="no-referrer" style={{width:'100%',height,border:0,display:failed?'none':'block'}}/>
  <p className="inline-note">Hasil pencarian dan pemesanan dibuka di situs mitra. Harga serta ketersediaan mengikuti penyedia. SortTrip dapat menerima komisi melalui tautan affiliate.</p>
  {failed&&<button className="secondary" onClick={()=>{setFailed(false);setReady(false);if(frame.current)frame.current.src=widgetUrl}}>Muat ulang form</button>}
 </section>;
}
