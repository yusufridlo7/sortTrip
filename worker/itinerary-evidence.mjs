const norm=v=>String(v||'').normalize('NFKD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^\p{L}\p{N}]+/gu,' ').trim();
const contains=(text,name)=>name.length>=4&&(' '+norm(text)+' ').includes(' '+norm(name)+' ');
// Relevance is deliberately conservative. A listed URL alone is not evidence
// about this place, and a matching page name does not verify every claim on it.
export function relevantSource(item,sources=[]){
 const source=sources.find(s=>s.url===item.sourceUrl);if(!source)return false;
 let path,host;try{const u=new URL(source.url);if(u.protocol!=='https:')return false;path=decodeURIComponent(u.pathname);host=u.hostname.split('.');}catch{return false;}
 if(item.category!=='Transfer'&&/\b(?:station|stasiun)\b/i.test(source.title||'')&&!/\b(?:station|stasiun)\b/i.test([item.title,item.location,item.place].join(' ')))return false;
 if(item.category!=='Transfer'&&/(?:\/routes?\/|\/transfers?\/)/i.test(path)&&/\b(?:airport|bandara)\b/i.test(path+' '+source.title))return false;
 const names=[item.location,item.place,item.title].filter(Boolean).flatMap(v=>[v,...v.split(/\s+\/\s+|\s+\|\s+/)]).map(v=>v.replace(/\([^)]*\)/g,'').trim()).filter(v=>norm(v)!==norm(item.city||item.locationCity));
 // Role labels added by route normalization must not hide an otherwise exact
 // station information reference. This is relevance only, never route/fare proof.
 if(item.category==='Transfer')for(const name of [...names])if(/^(?:station|stasiun|terminal)\s|\s(?:station|stasiun|terminal)$/i.test(name))names.push(name.replace(/^(?:station|stasiun|terminal)\s+|\s+(?:station|stasiun|terminal)$/gi,'').trim());
 return names.some(name=>contains(source.title||'',name)||contains(path,name)||norm(name).replace(/ /g,'').length>=8&&host.includes(norm(name).replace(/ /g,'')));
}
export function attractionSource(item,sources=[],language='id'){
 if(relevantSource(item,sources))return {...item,sourceRelevant:true};
 const related=sources.find(s=>relevantSource({...item,sourceUrl:s.url},[s]));
 return related?{...item,sourceUrl:related.url,sourceRelevant:true,note:(item.note||'')+(language==='en'?' · Related place reference; verify factual details separately.':' · Referensi terkait lokasi; periksa detail faktual secara terpisah.')}:{...item,sourceRelevant:false};
}
export function checkRouteSources(routes,sources=[],research=''){
 if(!routes.routeOptions)return routes;
 return {...routes,routeOptions:routes.routeOptions.map(option=>({...option,legs:option.legs.map(leg=>{
  const sourceRelevant=relevantSource({category:'Transfer',title:leg.fromPlace,location:leg.toPlace,sourceUrl:leg.sourceUrl},sources)||norm(leg.mode).split(' ').length>=2&&relevantSource({category:'Transfer',title:leg.mode,sourceUrl:leg.sourceUrl},sources);
  const {fare,duration,checkedAt,...rest}=leg;
  const supported=sourceRelevant&&[fare,duration].filter(Boolean).every(value=>research.includes(value));
  return {...rest,sourceRelevant,...(supported&&checkedAt?{fare,duration,checkedAt}:{})};
 })}))};
}
export function usableActivitySource(item,sources=[]){
 if(!item.sourceUrl)return null;
 if(!item.aiGenerated)return item.sourceUrl;
 // Reassess old saved drafts with the current metadata/alias rules. This
 // selects an information reference; it never creates admission/price facts.
 return relevantSource(item,sources)?item.sourceUrl:sources.find(s=>relevantSource({...item,sourceUrl:s.url},[s]))?.url||null;
}
const at=(start,day)=>new Date(Date.parse(start+'T12:00:00Z')+(day-1)*86400000).toISOString().slice(0,10);
const minute=time=>/^([01]\d|2[0-3]):[0-5]\d$/.test(time||'')?Number(time.slice(0,2))*60+Number(time.slice(3)):null;
const names=(item,city)=>[item.location,item.place,item.title].filter(Boolean).flatMap(v=>[norm(v),norm(v.replace(/\([^)]*\)/g,'').replace(new RegExp(',\\s*'+String(city||'').replace(/[.*+?^${}()|[\]\\]/g,'\\$&')+'$','i'),''))]).filter(Boolean);
const usableTransit=(legs,stays,city)=>legs.every(leg=>{
 const rail=/\b(?:mrt|lrt|metro|rail|train|kereta)\b/i.test(leg.mode||'');
 if(/\b(?:lrt\s*\/\s*mrt|mrt\s*\/\s*lrt)\b/i.test(leg.mode||''))return false;
 if(!rail)return true;
 if([leg.fromPlace,leg.toPlace].some(p=>/\b(?:city centre|city center|pusat kota)\s+(?:station|kuala lumpur)\b|\bstasiun\s+(?:city centre|city center|pusat kota)\b/i.test(p||'')))return false;
 return !stays.some(stay=>[leg.fromPlace,leg.toPlace].some(p=>names(stay,city).includes(norm(p))));
});
export function validateTransitAnchors(activities,q){
 const stays=[...activities,...(q.retained||[])].filter(x=>x.category==='Penginapan');
 for(const item of activities.filter(x=>x.category==='Transfer'))for(const option of item.routeOptions||[]){
  if(!usableTransit(option.legs,stays,q.city))throw Error('Sambungan transportasi tidak dapat diverifikasi.');
 }
}
export function normalizeStationConnections(routes,language='id'){
 const walking=l=>/^(?:walk(?:ing)?|jalan kaki)$/i.test(l.mode||'');
 const station=p=>/\b(?:station|stasiun|terminal)\b/i.test(p)?p:(language==='en'?'Station ':'Stasiun ')+p;
 return {...routes,routeOptions:routes.routeOptions?.map(o=>{
  const legs=o.legs.map(l=>({...l}));
  for(let i=0;i<legs.length;i++){
   const leg=legs[i];if(!/\b(?:mrt|lrt|metro|rail|train|kereta)\b/i.test(leg.mode||''))continue;
   const from=leg.fromPlace,to=leg.toPlace;
   leg.fromPlace=station(from);leg.toPlace=station(to);
   if(i&&walking(legs[i-1])&&norm(legs[i-1].toPlace)===norm(from))legs[i-1].toPlace=leg.fromPlace;
   if(i+1<legs.length&&walking(legs[i+1])&&norm(legs[i+1].fromPlace)===norm(to))legs[i+1].fromPlace=leg.toPlace;
  }
  return {...o,legs:legs.filter(l=>!walking(l)||norm(l.fromPlace)!==norm(l.toPlace))};
 })};
}
export function connectionGaps(activities,q={}){
 if(!q.start||!Number.isInteger(q.days))return [];
 const all=[...activities,...(q.retained||[])],stays=all.filter(x=>['Penginapan','Area menginap'].includes(x.category));
 const gaps=[],city=q.city||'';
 const same=(place,item)=>names(item,city).includes(norm(place));
 const stay=day=>stays.find(x=>(x.checkin||at(q.start,x.day))<=at(q.start,day)&&(x.checkout||at(q.start,x.day+1))>at(q.start,day));
 for(let day=1;day<=q.days;day++){
  const visits=all.filter(x=>x.category==='Wisata'&&x.day===day&&minute(x.time)!==null).sort((a,b)=>a.time.localeCompare(b.time));
  const lodging=stay(Math.min(day,q.days-1)),previous=stay(Math.max(1,day-1));
  const firstStay=previous||lodging,lastStay=lodging||previous;
  const arrival=minute(q.arrival),arrivalDay=arrival===null?null:Math.floor(((q.arrivalDay||0)*1440+arrival+120)/1440)+1;
  const airport=q.airport?{title:q.airport,location:q.airportLabel||q.airport}:null;
  const start=firstStay||(airport&&day===arrivalDay?airport:null);
  const end=airport&&!q.oneWay&&day===q.days?airport:lastStay;
  const nodes=[...(start?[{...start,time:''}]:[]),...visits,...(end?[{...end,time:'24:00'}]:[])];
  if(!visits.length&&!(airport&&(day===arrivalDay||!q.oneWay&&day===q.days)))continue;
  const transfers=activities.filter(x=>x.category==='Transfer'&&x.day===day&&minute(x.time)!==null).sort((a,b)=>a.time.localeCompare(b.time));
  const pairs=nodes.slice(1).map((to,i)=>[nodes[i],to]);
  if(airport&&day===arrivalDay&&firstStay)pairs.unshift([{...airport,time:''},{...firstStay,time:visits[0]?.time||'24:00'}]);
  for(const [from,to] of pairs){
   if(names(from,city).some(n=>names(to,city).includes(n)))continue;
   // Walk only recorded, chronological edges. Do not infer a walk/rail service
   // from proximity or join unrelated legs through a different time window.
   let reachable=new Set(names(from,city));
   for(const t of transfers){
    if(from.time&&t.time<from.time||to.time&&t.time>=to.time)continue;
    if(!reachable.has(norm(t.fromPlace)))continue;
    const option=normalizeStationConnections(t,q.language).routeOptions?.[t.selectedRoute||0];
    if(!option?.legs?.length||!usableTransit(option.legs,stays.filter(x=>x.category==='Penginapan'),city)||option.legs.some((l,j)=>j&&norm(option.legs[j-1].toPlace)!==norm(l.fromPlace))||!same(option.legs[0].fromPlace,{title:t.fromPlace})||!same(option.legs.at(-1).toPlace,{title:t.toPlace}))continue;
    reachable.add(norm(t.toPlace));
   }
   if(!names(to,city).some(n=>reachable.has(n)))gaps.push({day,from:from.location||from.place||from.title,to:to.location||to.place||to.title});
  }
 }
 return gaps.slice(0,100);
}
