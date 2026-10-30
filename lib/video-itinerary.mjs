// Shared, deterministic validation. No network, model authority, or financial tools.
export const VIDEO_LIMITS=Object.freeze({bytes:4*1024*1024,seconds:60,text:12000,candidates:8});
export class VideoError extends Error{constructor(code,status=400){super(code);this.code=code;this.status=status;}}
export function socialVideoUrl(value){
 let u;try{if(typeof value!=='string'||value.length>500)throw 0;u=new URL(value.trim());}catch{throw new VideoError('INVALID_URL');}
 if(u.protocol!=='https:'||u.username||u.password||u.port||/%|\\/.test(value))throw new VideoError('INVALID_URL');
 let provider,path;
 // Accept only known TikTok share hosts/paths, without following redirects.
 if(['vt.tiktok.com','vm.tiktok.com'].includes(u.hostname)&&/^\/[A-Za-z0-9]{5,64}\/?$/.test(u.pathname))return {provider:'tiktok',url:`https://${u.hostname}${u.pathname.replace(/\/$/,'')}/`};
 if(['www.tiktok.com','tiktok.com'].includes(u.hostname)&&/^\/t\/[A-Za-z0-9]{5,64}\/?$/.test(u.pathname))return {provider:'tiktok',url:`https://www.tiktok.com${u.pathname.replace(/\/$/,'')}/`};
 if(['www.tiktok.com','tiktok.com'].includes(u.hostname)&&/^\/@[\w.-]{1,64}\/video\/\d{10,24}\/?$/.test(u.pathname)){provider='tiktok';path=u.pathname.replace(/\/$/,'');}
 if(['www.instagram.com','instagram.com'].includes(u.hostname)&&/^\/reel\/[\w-]{5,64}\/?$/.test(u.pathname)){provider='instagram';path=u.pathname.replace(/\/$/,'')+'/';}
 if(['www.youtube.com','youtube.com','m.youtube.com'].includes(u.hostname)&&/^\/shorts\/[A-Za-z0-9_-]{11}\/?$/.test(u.pathname)){provider='youtube';path=u.pathname.replace(/\/$/,'');}
 if(!provider)throw new VideoError('UNSUPPORTED_URL');
 const host={tiktok:'www.tiktok.com',instagram:'www.instagram.com',youtube:'www.youtube.com'}[provider];
 return {provider,url:`https://${host}${path}`}; // All tracking/redirect/query parameters removed. Never fetched.
}
export async function boundedBytes(stream,max,signal){
 const reader=stream?.getReader();if(!reader)return new Uint8Array();const chunks=[];let length=0;
 const abort=()=>{void reader.cancel().catch(()=>{});};signal?.addEventListener('abort',abort,{once:true});
 try{while(true){if(signal?.aborted)throw new VideoError('CANCELLED',499);const {done,value}=await reader.read();if(signal?.aborted)throw new VideoError('CANCELLED',499);if(done)break;length+=value.length;if(length>max)throw new VideoError('TOO_LARGE',413);chunks.push(value);}}catch(e){await reader.cancel().catch(()=>{});throw e;}finally{signal?.removeEventListener('abort',abort);reader.releaseLock();}
 const out=new Uint8Array(length);let at=0;for(const chunk of chunks){out.set(chunk,at);at+=chunk.length;}return out;
}
// Bounded ISO-BMFF structural inspection, not a codec decoder or malware scan.
// No frames/audio are decoded in the Worker. Unsupported structures fail closed.
export function inspectMp4(bytes,mime){
 if(!['video/mp4','video/quicktime','video/x-m4v'].includes(mime))throw new VideoError('UNSUPPORTED_MEDIA',415);
 if(bytes.length>VIDEO_LIMITS.bytes)throw new VideoError('TOO_LARGE',413);
 const view=new DataView(bytes.buffer,bytes.byteOffset,bytes.byteLength),ascii=(p,n)=>String.fromCharCode(...bytes.subarray(p,p+n));
 let boxes=0,duration=null,ftyp=false,mdat=false,tracks=0;
 function walk(start,end,depth){if(depth>6)throw new VideoError('INVALID_MP4');let at=start;
  while(at<end){if(++boxes>1000||at+8>end)throw new VideoError('INVALID_MP4');const size=view.getUint32(at),type=ascii(at+4,4);if(size<8||at+size>end)throw new VideoError('INVALID_MP4');
   if(depth===0&&at===0){if(type!=='ftyp'||size<16||size>128||!['isom','iso2','mp41','mp42','avc1','qt  ','M4V '].includes(ascii(at+8,4)))throw new VideoError('INVALID_MP4');ftyp=true;}
   if(type==='mdat'&&depth===0&&size>8)mdat=true;
   if(type==='mvhd'&&depth===1){const version=bytes[at+8];if(version!==0||size<108)throw new VideoError('INVALID_MP4');const scale=view.getUint32(at+20);if(!scale)throw new VideoError('INVALID_MP4');duration=view.getUint32(at+24)/scale;}
   if(type==='trak')tracks++;
   if(['moov','trak','mdia','minf','stbl','dinf'].includes(type))walk(at+8,at+size,depth+1);
   if(type==='dref'){if(size<28||view.getUint32(at+12)!==1||ascii(at+20,4)!=='url '||view.getUint32(at+24)!==1||view.getUint32(at+16)!==12)throw new VideoError('EXTERNAL_MEDIA');}
   if(['moof','mvex','sinf','encv','enca','uuid'].includes(type))throw new VideoError('UNSUPPORTED_MEDIA',415);
   at+=size;
  }
 }
 walk(0,bytes.length,0);
 if(!ftyp||!mdat||!tracks||duration===null||!Number.isFinite(duration)||duration<=0)throw new VideoError('INVALID_MP4');
 if(duration>VIDEO_LIMITS.seconds)throw new VideoError('TOO_LONG');
 return {bytes:bytes.length,durationSeconds:duration,inspection:'container-only'};
}
export const placeCatalog=[
 {id:'curated:wat-pho',city:'Bangkok',country:'Thailand',names:['Wat Pho','Wat Phra Chetuphon'],geo:{lat:13.7464237,lng:100.4927733},sourceUrl:'https://www.am2026thailand.go.th/explore-bangkok/wat-pho'},
 {id:'curated:wat-arun',city:'Bangkok',country:'Thailand',names:['Wat Arun','Wat Arun Ratchawararam','Temple of Dawn'],geo:{lat:13.7438652,lng:100.488444},sourceUrl:'https://www.am2026thailand.go.th/explore-bangkok/wat-arun'},
 {id:'osm:way:323394984',city:'Kuala Lumpur',country:'Malaysia',names:['Muzium Negara','National Museum (Muzium Negara)','National Museum','National Museum of Malaysia'],geo:{lat:3.137662,lng:101.6873819},sourceUrl:'https://www.openstreetmap.org/way/323394984'},
 {id:'osm:way:659878360',city:'Kuala Lumpur',country:'Malaysia',names:['Islamic Arts Museum Malaysia','Islamic Arts Museum','Muzium Kesenian Islam Malaysia'],geo:{lat:3.1414525,lng:101.6898711},sourceUrl:'https://www.openstreetmap.org/way/659878360'},
 // Public dataset identities/coordinates checked 27 October 2026. This is an
 // offline identity snapshot, not live opening hours, prices or availability.
 {id:'wikidata:Q1151254',city:'Hanoi',country:'Vietnam',names:['Hoàn Kiếm Lake','Hoan Kiem Lake','Hồ Hoàn Kiếm'],geo:{lat:21.028888888889,lng:105.8525},sourceUrl:'https://www.wikidata.org/wiki/Q1151254'},
 {id:'wikidata:Q208760',city:'Singapore',country:'Singapore',names:['Merlion','Merlion statue'],geo:{lat:1.286805555556,lng:103.8545},sourceUrl:'https://www.wikidata.org/wiki/Q208760'},
 {id:'wikidata:Q42798',city:'Magelang',country:'Indonesia',names:['Borobudur','Borobudur Temple','Candi Borobudur'],geo:{lat:-7.60793,lng:110.20384},sourceUrl:'https://www.wikidata.org/wiki/Q42798'}
];
const clean=(v,max)=>typeof v==='string'&&v.trim().length>0&&v.length<=max&&!/[\u0000-\u001f]/.test(v);
const norm=v=>v.normalize('NFKC').trim().toLowerCase().replace(/\s+/g,' ');
export function resolvePlace(name,city,country){const matches=placeCatalog.filter(p=>norm(p.city)===norm(city)&&norm(p.country)===norm(country)&&p.names.some(n=>norm(n)===norm(name)));return matches.length===1?matches[0]:undefined;}
export const destinationSchema={type:'object',additionalProperties:false,required:['destinations'],properties:{destinations:{type:'array',maxItems:8,items:{type:'object',additionalProperties:false,required:['name','city','country','category','activity','sourceEvidence','evidenceKind','confidence','verified','recommendedDurationMinutes'],properties:{name:{type:'string'},city:{type:'string'},country:{type:'string'},category:{type:'string',enum:['attraction','museum','park','food','other']},activity:{type:'string'},sourceEvidence:{type:'string'},evidenceKind:{type:'string',enum:['mentioned','inferred']},confidence:{type:'string',enum:['low','medium','high']},verified:{type:'boolean'},recommendedDurationMinutes:{type:['integer','null'],minimum:15,maximum:240}}}}}};
export function normalizeDestinations(data,transcript){
 if(!data||Object.keys(data).some(k=>k!=='destinations')||!Array.isArray(data.destinations)||data.destinations.length>8)throw new VideoError('INVALID_MODEL_OUTPUT',502);
 const seen=new Set();return data.destinations.map((c,i)=>{
  if(!c||Object.keys(c).sort().join('|')!==destinationSchema.properties.destinations.items.required.slice().sort().join('|')||!clean(c.name,160)||!clean(c.city,100)||!clean(c.country,100)||!clean(c.activity,240)||!clean(c.sourceEvidence,600)||!['attraction','museum','park','food','other'].includes(c.category)||!['mentioned','inferred'].includes(c.evidenceKind)||!['high','medium','low'].includes(c.confidence)||typeof c.verified!=='boolean'||!(c.recommendedDurationMinutes===null||Number.isInteger(c.recommendedDurationMinutes)&&c.recommendedDurationMinutes>=15&&c.recommendedDurationMinutes<=240))throw new VideoError('INVALID_MODEL_OUTPUT',502);
  if(c.evidenceKind==='mentioned'&&transcript!==undefined&&!transcript.includes(c.sourceEvidence))throw new VideoError('INVALID_EVIDENCE',502);
  const p=resolvePlace(c.name,c.city,c.country);
  const key=p?.id||[c.name,c.city,c.country].map(norm).join('|'),duplicate=seen.has(key);seen.add(key);
  return {...c,id:`candidate-${i}`,verified:!!p,verification:p?'catalog-identity':'unverified',...(p?{placeId:p.id,geo:p.geo,sourceUrl:p.sourceUrl}:{}),duplicate};
 });
}
export function initialVideoTrip(candidates,{start,days,people,language='en',demo=false,manualReview=false}){
 if(!/^\d{4}-\d{2}-\d{2}$/.test(start)||!Number.isFinite(Date.parse(start))||new Date(start).toISOString().slice(0,10)!==start||!Number.isInteger(days)||days<1||days>14||!Number.isInteger(people)||people<1||people>8)throw new VideoError('INVALID_TRIP');
 const selected=candidates.filter(c=>!c.duplicate);if(!selected.length||selected.length>8||selected.length>days*3)throw new VideoError('REVIEW_REQUIRED');
 // Resolve again; never trust client/model verified flags or coordinates.
 const resolved=normalizeDestinations({destinations:selected.map(c=>Object.fromEntries(destinationSchema.properties.destinations.items.required.map(k=>[k,c[k]])))});
 if(resolved.some((c,i)=>(!c.verified&&!(manualReview&&selected[i].manualConfirmed===true))||c.duplicate)||new Set(resolved.map(c=>norm(c.city)+'|'+norm(c.country))).size!==1)throw new VideoError('REVIEW_REQUIRED');
 const perDay=Math.ceil(resolved.length/days);
 const items=resolved.map((c,i)=>({id:`video-${crypto.randomUUID()}`,title:c.name,place:c.name,locationCity:c.city,category:c.category==='food'?'Makan':'Wisata',price:0,priceUnknown:true,paid:false,day:Math.floor(i/perDay)+1,time:`${String(9+(i%perDay)*4).padStart(2,'0')}:00`,minutes:c.recommendedDurationMinutes||60,note:(demo?(language==='en'?'DEMO FIXTURE · ':'CONTOH DEMO · '):'')+(language==='en'?'Approximate visit duration. Opening hours, admission and travel time are not verified.':'Durasi kunjungan perkiraan. Jam buka, tiket masuk, dan waktu perjalanan belum terverifikasi.'),geo:c.geo,sourceUrl:c.sourceUrl}));
 const airport={'Bangkok|Thailand':'DMK','Kuala Lumpur|Malaysia':'KUL','Hanoi|Vietnam':'HAN','Singapore|Singapore':'SIN'}[resolved[0].city+'|'+resolved[0].country]||'';
 return {destination:'video-'+norm(resolved[0].city).replace(/[^a-z0-9]+/g,'-'),destinationMeta:{city:resolved[0].city,country:resolved[0].country,code:airport},origin:'CGK',start,days,people,budget:0,items,estimateIncomplete:true,version:2};
}
export function demoDestinations(city='Kuala Lumpur'){const bangkok=city==='Bangkok';const transcript=bangkok?'Demo reference: Wat Arun in Bangkok, Thailand.':'Visit Muzium Negara and Islamic Arts Museum Malaysia in Kuala Lumpur, Malaysia.';return {transcript,destinations:normalizeDestinations({destinations:(bangkok?['Wat Arun','Wat Pho']:['Muzium Negara','Islamic Arts Museum Malaysia']).map(name=>({name,city:bangkok?'Bangkok':'Kuala Lumpur',country:bangkok?'Thailand':'Malaysia',category:bangkok?'attraction':'museum',activity:bangkok?'Temple visit':'Museum visit',sourceEvidence:transcript,evidenceKind:'mentioned',confidence:'high',verified:false,recommendedDurationMinutes:90}))},transcript)};}
