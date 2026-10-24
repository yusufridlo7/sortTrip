import {itineraryIntent} from './itinerary-intent.mjs';
import {normalizeLanguage} from './localization.js';
import {liteHotelConfigured,groupHotelAreas,applyLiteHotels} from './lite-hotel.js';
import {priceTargets,researchPrices} from './price-research.js';
import {researchRequest,transportResearchRequest,draftRequest,collectSources,responseText} from './ai-draft.js';
import {planningKey} from './trip-access.js';
import {validateRoutes} from './transport-plan.js';
// Recommendation drafts have no prices or booking actions. Provider APIs own those facts.
const reply=(data,status=200)=>Response.json(data,{status,headers:{'Cache-Control':'no-store'}});
const text=(v,n=160)=>typeof v==='string'?v.slice(0,n):'';
export function validateInput(b){
 if(!b||!/^\d{4}-\d{2}-\d{2}$/.test(b.start)||!Number.isSafeInteger(b.days)||b.days<1||!Number.isFinite(Date.parse(b.start)+(b.days-1)*86400000)||Date.parse(b.start)+(b.days-1)*86400000>253402214400000||!Number.isInteger(b.people)||b.people<1||b.people>8||!Number.isFinite(b.budget)||b.budget<0||b.budget>1e9)throw Error('Parameter perjalanan tidak valid.');
 if(!b.city||typeof b.city!=='string'||b.city.length>100)throw Error('Kota tujuan tidak valid.');
 const intent=itineraryIntent(text(b.interests,1000));
 return {preserveItemIds:Array.isArray(b.preserveItemIds)?b.preserveItemIds.filter(id=>typeof id==='string'&&id.length<=120).slice(0,100):[],replaceItemIds:Array.isArray(b.replaceItemIds)?b.replaceItemIds.filter(id=>typeof id==='string'&&id.length<=120).slice(0,100):[],hotelBudget:intent.maxNightIDR?{maxNightIDR:intent.maxNightIDR,exclusive:intent.exclusive===true}:undefined,language:normalizeLanguage(b.language),mode:b.mode==='prices'?'prices':'itinerary',priceTargets:b.mode==='prices'?priceTargets(b.priceTargets,b.days):[],city:text(b.city,100),country:text(b.country,100),start:b.start,days:b.days,people:b.people,budget:b.budget,transportPreference:['hemat','cepat','seimbang'].includes(b.transportPreference)?b.transportPreference:undefined,pace:['santai','seimbang','padat'].includes(b.pace)?b.pace:'seimbang',interests:text(b.interests,1000),conversation:Array.isArray(b.conversation)?b.conversation.slice(-6).filter(x=>x&&['user','assistant'].includes(x.role)).map(x=>({role:x.role,text:text(x.text,1000)})):[],arrival:text(b.arrival,40),arrivalDay:Number.isInteger(b.arrivalDay)?Math.max(0,Math.min(b.days-1,b.arrivalDay)):0,returnAt:text(b.returnAt,40),oneWay:!!b.oneWay,dailyCities:Array.isArray(b.dailyCities)?b.dailyCities.slice(0,70).filter(x=>Number.isInteger(x.day)&&x.day>=1&&x.day<=b.days).map(x=>({day:x.day,city:text(x.city,100),country:text(x.country,100)})):[],retained:Array.isArray(b.retained)?b.retained.slice(0,100).map(x=>({day:x.day,category:text(x.category,40),title:text(x.title),time:text(x.time,10),checkin:text(x.checkin,10),checkout:text(x.checkout,10)})):[],currency:'IDR',routingTargets:Array.isArray(b.routingTargets)?b.routingTargets.slice(0,70).filter(x=>x&&Number.isInteger(x.day)&&x.day>=1&&x.day<=b.days&&['Wisata','Penginapan'].includes(x.category)).map(x=>({day:x.day,city:text(x.city,100),place:text(x.place),category:x.category})):[],requestedStops:Array.isArray(b.requestedStops)?b.requestedStops.slice(0,70).filter(x=>x&&Number.isInteger(x.day)&&x.day>=1&&x.day<=b.days).map(x=>({day:x.day,city:text(x.city,100),title:text(x.title),protected:x.protected===true})):[],routeRequests:Array.isArray(b.routeRequests)?b.routeRequests.slice(0,70).filter(x=>x&&Number.isInteger(x.day)&&x.day>=1&&x.day<=b.days).map(x=>({day:x.day,from:text(x.from),to:text(x.to),mode:text(x.mode,100),protected:x.protected===true})):[],locked:Array.isArray(b.locked)?b.locked.slice(0,100).map(x=>({day:x.day,time:text(x.time,10),title:text(x.title)})):[]};
}
function sourceUrl(value){try{const u=new URL(value);return u.protocol==='https:'?u.href:null;}catch{return null;}}
export function validationCode(error){if(['Pilihan rute transportasi belum lengkap.','Sambungan transportasi tidak dapat diverifikasi.'].includes(error?.message))return 'TRANSPORT_CONNECTIONS';return ({'Rancangan tidak lengkap.':'INCOMPLETE','Rancangan tidak dapat diverifikasi.':'SOURCE_OR_FORMAT','Malam penginapan tidak valid.':'HOTEL_NIGHT','Rute transportasi belum lengkap.':'TRANSFER_ROUTE','Aktivitas sebelum kedatangan.':'BEFORE_ARRIVAL','Aktivitas terlalu dekat penerbangan pulang.':'AFTER_RETURN_BUFFER','Aktivitas berbenturan dengan pesanan.':'BOOKING_CONFLICT','Referensi wisata belum cukup.':'ATTRACTIONS_REQUIRED'})[error?.message]||'INVALID_JSON';}
export function attractionReferences(a,sources,research=''){
 const identity=v=>String(v||'').toLowerCase().replace(/[^\p{L}\p{N}]+/gu,' ').trim();
 const supported=r=>r&&typeof r.quote==='string'&&r.quote.length>=12&&r.quote.length<=700&&research.includes(r.quote)&&sources.some(s=>s.url===r.sourceUrl)&&[a.title,a.location].filter(v=>v&&identity(v)!==identity(a.city)).some(v=>identity(r.quote).includes(identity(v)));
 const numberIn=(quote,n)=>(quote.match(/-?\d+(?:[.,]\d+)*/g)||[]).some(token=>Number(token.replace(/,/g,''))===n||/^\d{1,3}(?:[.,]\d{3})+$/.test(token)&&Number(token.replace(/[.,]/g,''))===n);
 const result={};
 const p=a.admission;
 if(supported(p)&&Number.isFinite(p.amount)&&p.amount>=0&&p.amount<=1e9&&/^(IDR|MYR|SGD|THB|VND|PHP|USD|KHR|LAK|MMK|BND)$/.test(p.currency)&&p.quote.includes(p.currency)&&numberIn(p.quote,p.amount)&&typeof p.audience==='string'&&p.audience.trim())result.admission={amount:p.amount,currency:p.currency,audience:text(p.audience,160),quote:p.quote,sourceUrl:p.sourceUrl,checkedAt:new Date().toISOString()};
 const c=a.coordinates;
 if(supported(c)&&Number.isFinite(c.lat)&&Number.isFinite(c.lng)&&Math.abs(c.lat)<=90&&Math.abs(c.lng)<=180&&(c.lat!==0||c.lng!==0)&&numberIn(c.quote,c.lat)&&numberIn(c.quote,c.lng))result.geo={lat:c.lat,lng:c.lng};
 return result;
}
export function validatePlan(plan,q,sources,research=''){
 if(!plan||!Array.isArray(plan.activities)||plan.activities.length>70||!plan.activities.length)throw Error('Rancangan tidak lengkap.');
 const allowed=new Set(sources.map(s=>s.url));
 const activities=plan.activities.map((a,i)=>{
  if(!Number.isInteger(a.day)||a.day<1||a.day>q.days||!/^([01]\d|2[0-3]):[0-5]\d$/.test(a.time)||!['Wisata','Penginapan','Area menginap','Transfer'].includes(a.category)||!a.title||!allowed.has(a.sourceUrl))throw Error('Rancangan tidak dapat diverifikasi.');
 if(['Penginapan','Area menginap'].includes(a.category)&&a.day>=q.days)throw Error('Malam penginapan tidak valid.');
  if(a.category==='Transfer'&&(a.fromPlace!==undefined||a.toPlace!==undefined)&&(!a.fromPlace||!a.toPlace||!a.mode))throw Error('Rute transportasi belum lengkap.');
  const minutes=v=>Number(v.slice(0,2))*60+Number(v.slice(3,5));
  const scheduled=(a.day-1)*1440+minutes(a.time);
  if(/^([01]\d|2[0-3]):[0-5]\d$/.test(q.arrival)&&scheduled<q.arrivalDay*1440+minutes(q.arrival)+120)throw Error('Aktivitas sebelum kedatangan.');
  if(!q.oneWay&&/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(q.returnAt)){
   const returnDay=Math.round((Date.parse(q.returnAt.slice(0,10))-Date.parse(q.start))/86400000);
   if(scheduled>returnDay*1440+minutes(q.returnAt.slice(11,16))-240)throw Error('Aktivitas terlalu dekat penerbangan pulang.');
  }
  if(q.locked.some(x=>x.day===a.day&&/^\d{2}:\d{2}$/.test(x.time)&&Math.abs(minutes(x.time)-minutes(a.time))<90))throw Error('Aktivitas berbenturan dengan pesanan.');
  const routes=a.category==='Transfer'&&(a.routeOptions||q.transportPreference)?validateRoutes(a.routeOptions,sources,q.transportPreference):{};
  const selected=routes.routeOptions?.[routes.selectedRoute];
  return {...(a.category==='Wisata'?attractionReferences(a,sources,research):{}),id:`ai-${i}`,day:a.day,time:a.time,category:a.category,title:text(a.title),note:text(a.note,500),sourceUrl:a.sourceUrl,city:text(a.city,100),location:text(a.location),fromPlace:selected?selected.legs[0].fromPlace:text(a.fromPlace),toPlace:selected?selected.legs.at(-1).toPlace:text(a.toPlace),mode:selected?selected.legs.map(l=>l.mode).join(' + '):text(a.mode,100),...routes};
 }).sort((a,b)=>a.day-b.day||a.time.localeCompare(b.time));
 if(new Set(activities.filter(a=>a.category==='Wisata').map(a=>a.title.toLowerCase())).size<2)throw Error('Referensi wisata belum cukup.');
 return {summary:text(plan.summary,1000),activities,sources,createdAt:new Date().toISOString(),context:q};
}
export function itineraryPriceTargets(plan,q){return priceTargets(plan.activities.filter(x=>['Penginapan','Area menginap','Transfer'].includes(x.category)).sort((a,b)=>Number(['Penginapan','Area menginap'].includes(b.category))-Number(['Penginapan','Area menginap'].includes(a.category))).flatMap(x=>{const base={id:'ai-plan-'+x.id,title:x.title,category:x.category==='Transfer'?'Transportasi':'Penginapan',day:x.day,city:x.city,area:x.category==='Area menginap'?(x.location||x.title):'',hotelId:x.hotelId,checkin:x.checkin,checkout:x.checkout,sourceUrl:x.sourceUrl,mode:x.mode,from:x.fromPlace,to:x.toPlace,rooms:Math.ceil(q.people/2),searchAny:x.category==='Area menginap',maxNightIDR:q.hotelBudget?.maxNightIDR,maxNightExclusive:q.hotelBudget?.exclusive};const legs=x.routeOptions?.[x.selectedRoute||0]?.legs;return x.category==='Transfer'&&legs?legs.flatMap((leg,i)=>/bus|bis|coach|kereta|train|rail|ferry|feri|shuttle/i.test(leg.mode)?[{...base,id:base.id+'::'+i,title:(leg.mode+' '+leg.fromPlace+' → '+leg.toPlace).slice(0,160),from:leg.fromPlace,to:leg.toPlace,mode:leg.mode,sourceUrl:leg.sourceUrl}]:[]):[base];}).slice(0,12),q.days);}
export async function handleItinerary(request,env,onProgress=()=>{}){
 if(request.method!=='POST')return reply({error:'Gunakan POST.'},405);
 if(request.headers.get('Origin')&&request.headers.get('Origin')!==new URL(request.url).origin)return reply({error:'Asal permintaan tidak diizinkan.'},403);
 if(!env.OPENAI_API_KEY||!env.SUPABASE_URL||!env.SUPABASE_PUBLISHABLE_KEY||!env.AI_LIMITER)return reply({error:'AI belum diaktifkan. Administrator perlu mengatur koneksi AI dan autentikasi di server.'},503);
 let reservation=null,completed=false;
 async function quota(name,body){return fetch(env.SUPABASE_URL+'/rest/v1/rpc/'+name,{method:'POST',headers:{Authorization:'Bearer '+env.SUPABASE_SERVICE_ROLE_KEY,apikey:env.SUPABASE_SERVICE_ROLE_KEY,'Content-Type':'application/json'},body:JSON.stringify(body),signal:AbortSignal.timeout(10000)})}
 try{
 const auth=request.headers.get('Authorization')||'';
 if(!/^Bearer [\w.-]+$/.test(auth))return reply({error:'Masuk ke akun untuk membuat rekomendasi AI.'},401);
 const userResponse=await fetch(`${env.SUPABASE_URL}/auth/v1/user`,{headers:{Authorization:auth,apikey:env.SUPABASE_PUBLISHABLE_KEY},signal:AbortSignal.timeout(10000)});
 if(!userResponse.ok)return reply({error:'Sesi berakhir. Silakan masuk kembali.'},401);
 const user=await userResponse.json();if(!user.id)return reply({error:'Sesi tidak valid.'},401);
 if(!(await env.AI_LIMITER.limit({key:user.id})).success)return reply({error:'Maksimal dua permintaan per menit. Tunggu sebentar.'},429);
 const raw=await request.text();if(raw.length>32000)return reply({error:'Permintaan terlalu besar.'},413);
 let q;try{q=validateInput(JSON.parse(raw));if(q.mode!=='prices'&&raw.length>16000)throw Error('size');}catch{return reply({error:'Parameter perjalanan tidak valid.'},400);}
 if(!env.SUPABASE_SERVICE_ROLE_KEY)return reply({error:'Migrasi kuota AI dan konfigurasi server perlu disiapkan.'},503);
 if(env.LITEAPI_ENABLED==='true'&&!liteHotelConfigured(env))return reply({code:'LITEAPI_PRODUCTION_REQUIRED',error:'lite_production_required'},503);
 const requestId=crypto.randomUUID();
 const quotaResponse=await quota('reserve_ai_request',{p_user:user.id,p_trip_key:planningKey(q.city,q.start),p_request:requestId});
 if(!quotaResponse.ok)return reply({error:'Migrasi kuota AI belum siap.'},503);
 const access=await quotaResponse.json();
 if(!access.allowed)return access.busy?reply({error:'Permintaan AI lain sedang diproses. Tunggu hingga selesai.'},429):reply({code:'TRIP_PASS_REQUIRED',error:'Beli Trip Pass untuk melanjutkan AI, atau lanjutkan edit manual.'},402);
 reservation={p_user:user.id,p_request:requestId};
 const providerSignal=AbortSignal.any([AbortSignal.timeout(160000),request.signal]);const priceDeadline=Date.now()+145000;
 const callProvider=body=>fetch('https://api.openai.com/v1/responses',{method:'POST',headers:{Authorization:'Bearer '+env.OPENAI_API_KEY,'Content-Type':'application/json'},signal:providerSignal,body:JSON.stringify(body)});
 if(q.mode==='prices'){
  const diagnostics={};
  const prices=await researchPrices(q,q.priceTargets,env,callProvider,priceDeadline,diagnostics,undefined,onProgress);
  if(!prices.length&&diagnostics.hotelAccessRequired)return reply({code:'PRICE_SOURCE_ACCESS_REQUIRED',error:'Trip.com meminta pemeriksaan akses untuk pencarian ini. Harga belum dapat diperbarui; harga lama dan kuota AI tetap.'},502);
  if(!prices.length&&diagnostics.transportAccessRequired)return reply({code:'PRICE_SOURCE_ACCESS_REQUIRED',error:'12Go meminta pemeriksaan akses untuk pencarian ini. Harga belum dapat diperbarui; harga lama dan kuota AI tetap.'},502);
  if(!prices.length)return reply({code:'PRICE_UNAVAILABLE',error:'lite_price_unavailable'},502);
  if(request.signal.aborted)throw Error('cancelled');onProgress('finalizing');
 const settled=await quota('finish_ai_request',{...reservation,p_success:true});if(!settled.ok||!(await settled.json()).ok)return reply({error:'Pencatatan kuota belum berhasil.'},503);
  completed=true;return reply({access,prices});
 }
 onProgress('research');
 let response=await callProvider(researchRequest(q,env));
 let sources=[],researchText='';
 if(response.ok){
  const research=await response.json();
  if(research.status!=='completed')return reply({error:'Pencarian referensi belum selesai. Coba lagi nanti.'},502);
  sources=collectSources(research);
  if(!sources.length)return reply({code:'AI_SOURCES_UNAVAILABLE',error:'Referensi belum dapat diverifikasi. Tidak ada itinerary yang diubah.'},502);
  researchText=responseText(research);
  if(q.transportPreference){
   const routes=await callProvider(transportResearchRequest(q,env,researchText));
   if(!routes.ok)return reply({code:'AI_TRANSPORT_RESEARCH_UNAVAILABLE',error:'Pencarian sambungan transportasi belum berhasil. Itinerary tidak diubah.'},502);
   const routeResearch=await routes.json();if(routeResearch.status!=='completed')return reply({code:'AI_TRANSPORT_RESEARCH_INCOMPLETE',error:'Pencarian rute transit belum selesai. Itinerary tidak diubah.'},502);
   const routeSources=collectSources(routeResearch);if(!routeSources.length)return reply({code:'AI_TRANSPORT_SOURCES_UNAVAILABLE',error:'Sumber rute transit belum dapat diverifikasi. Itinerary tidak diubah.'},502);
   sources=[...new Map([...routeSources,...sources].map(s=>[s.url,s])).values()].slice(0,80);
   researchText='TRANSPORT RESEARCH:\n'+responseText(routeResearch)+'\nGENERAL RESEARCH:\n'+researchText;
  }
  onProgress('draft');
  response=await callProvider(draftRequest(q,env,researchText,sources));
 }
 if(!response.ok){
  // Only classify allowlisted provider codes; never forward its raw body/message.
  let providerCode='';try{const failure=await response.json();providerCode=failure?.error?.code;}catch{}
  if(response.status===429&&['insufficient_quota','credit_balance_exhausted','organization_spend_limit_exceeded','project_spend_limit_exceeded','organization_usage_limit_exceeded'].includes(providerCode))return reply({code:'AI_PROVIDER_QUOTA',error:'Saldo atau batas penggunaan layanan AI belum tersedia. Pengelola perlu memeriksa saldo dan limit API OpenAI. Itinerary tidak diubah.'},503);
  if(response.status===429)return reply({code:'AI_PROVIDER_RATE_LIMIT',error:'Layanan AI sedang membatasi permintaan. Tunggu beberapa saat sebelum mencoba lagi. Itinerary tidak diubah.'},503);
  return reply({code:'AI_PROVIDER_UNAVAILABLE',error:'Layanan AI belum dapat membuat rancangan. Pengelola perlu memeriksa konfigurasi layanan.'},502);
 }
 const data=await response.json();if(data.status!=='completed')return reply({error:'Penyusunan belum selesai. Coba lagi dengan preferensi lebih singkat.'},502);
 const parse=data=>validatePlan(JSON.parse(responseText(data).replace(/^```(?:json)?\s*|\s*```$/g,'')),q,sources,researchText);
 let plan;
 try{plan=parse(data)}catch(error){
  // One bounded correction within the same reservation and provider deadline.
  // Only fixed validation codes are forwarded; never log or return raw output.
  const reason=validationCode(error);
  const correction=draftRequest(q,env,researchText,sources);
  correction.input=JSON.stringify({...JSON.parse(correction.input),validationFeedback:reason});
  const retry=await callProvider(correction);
  if(!retry.ok)return reply({code:'AI_DRAFT_INVALID',validation:reason,error:'Hasil AI belum lolos pemeriksaan ('+reason+'). Koreksi otomatis belum berhasil. Itinerary dan kuota tidak diubah.'},502);
  const corrected=await retry.json();
  if(corrected.status!=='completed')return reply({code:'AI_DRAFT_INCOMPLETE',error:'Koreksi itinerary belum selesai. Itinerary dan kuota tidak diubah.'},502);
  try{plan=parse(corrected)}catch(error){const reason=validationCode(error);return reply({code:'AI_DRAFT_INVALID',validation:reason,error:'Hasil AI belum lolos pemeriksaan ('+reason+'). Itinerary dan kuota tidak diubah.'},502);}
 }
 plan=groupHotelAreas(plan,q);
 let prices=[];
 try{const targets=itineraryPriceTargets(plan,q);prices=await researchPrices(q,targets,env,callProvider,priceDeadline,{},undefined,onProgress);}catch{}
 plan=applyLiteHotels(plan,prices);
 if(q.hotelBudget&&plan.activities.some(a=>a.category==='Area menginap'))plan.summary+=(q.language==='en'?' No matching hotel within the nightly budget was verified in the checked inventory. Existing selections remain until a replacement is available.':' Hotel sesuai batas per malam belum ditemukan dalam stok yang diperiksa. Pilihan lama tetap disimpan sampai pengganti tersedia.');
 if(request.signal.aborted)throw Error('cancelled');onProgress('finalizing');
 const settled=await quota('finish_ai_request',{...reservation,p_success:true});if(!settled.ok||!(await settled.json()).ok)return reply({error:'Pencatatan kuota belum berhasil. Coba lagi nanti.'},503);completed=true;return reply({access,plan,prices});
 }catch{return reply({error:'Koneksi penyusunan terganggu atau melewati batas waktu. Itinerary lama tetap tersimpan.'},502);}finally{if(reservation&&!completed)try{await quota('finish_ai_request',{...reservation,p_success:false})}catch{}}
}
