import {researchRequest,transportResearchRequest,draftRequest,collectSources,responseText} from './ai-draft.js';
import {planningKey} from './trip-access.js';
import {validateRoutes} from './transport-plan.js';
// Recommendation drafts have no prices or booking actions. Provider APIs own those facts.
const reply=(data,status=200)=>Response.json(data,{status,headers:{'Cache-Control':'no-store'}});
const text=(v,n=160)=>typeof v==='string'?v.slice(0,n):'';
export function validateInput(b){
 if(!b||!/^\d{4}-\d{2}-\d{2}$/.test(b.start)||!Number.isSafeInteger(b.days)||b.days<1||!Number.isFinite(Date.parse(b.start)+(b.days-1)*86400000)||Date.parse(b.start)+(b.days-1)*86400000>253402214400000||!Number.isInteger(b.people)||b.people<1||b.people>8||!Number.isFinite(b.budget)||b.budget<0||b.budget>1e9)throw Error('Parameter perjalanan tidak valid.');
 if(!b.city||typeof b.city!=='string'||b.city.length>100)throw Error('Kota tujuan tidak valid.');
 return {city:text(b.city,100),country:text(b.country,100),start:b.start,days:b.days,people:b.people,budget:b.budget,transportPreference:['hemat','cepat','seimbang'].includes(b.transportPreference)?b.transportPreference:undefined,pace:['santai','seimbang','padat'].includes(b.pace)?b.pace:'seimbang',interests:text(b.interests,1000),conversation:Array.isArray(b.conversation)?b.conversation.slice(-6).filter(x=>x&&['user','assistant'].includes(x.role)).map(x=>({role:x.role,text:text(x.text,1000)})):[],arrival:text(b.arrival,40),arrivalDay:Number.isInteger(b.arrivalDay)?Math.max(0,Math.min(b.days-1,b.arrivalDay)):0,returnAt:text(b.returnAt,40),oneWay:!!b.oneWay,dailyCities:Array.isArray(b.dailyCities)?b.dailyCities.slice(0,70).filter(x=>Number.isInteger(x.day)&&x.day>=1&&x.day<=b.days).map(x=>({day:x.day,city:text(x.city,100),country:text(x.country,100)})):[],retained:Array.isArray(b.retained)?b.retained.slice(0,100).map(x=>({day:x.day,category:text(x.category,40),title:text(x.title),time:text(x.time,10),checkin:text(x.checkin,10),checkout:text(x.checkout,10)})):[],currency:'IDR',routingTargets:Array.isArray(b.routingTargets)?b.routingTargets.slice(0,70).filter(x=>x&&Number.isInteger(x.day)&&x.day>=1&&x.day<=b.days&&['Wisata','Penginapan'].includes(x.category)).map(x=>({day:x.day,city:text(x.city,100),place:text(x.place),category:x.category})):[],requestedStops:Array.isArray(b.requestedStops)?b.requestedStops.slice(0,70).filter(x=>x&&Number.isInteger(x.day)&&x.day>=1&&x.day<=b.days).map(x=>({day:x.day,city:text(x.city,100),title:text(x.title),protected:x.protected===true})):[],routeRequests:Array.isArray(b.routeRequests)?b.routeRequests.slice(0,70).filter(x=>x&&Number.isInteger(x.day)&&x.day>=1&&x.day<=b.days).map(x=>({day:x.day,from:text(x.from),to:text(x.to),mode:text(x.mode,100),protected:x.protected===true})):[],locked:Array.isArray(b.locked)?b.locked.slice(0,100).map(x=>({day:x.day,time:text(x.time,10),title:text(x.title)})):[]};
}
function sourceUrl(value){try{const u=new URL(value);return u.protocol==='https:'?u.href:null;}catch{return null;}}
export function validationCode(error){if(['Pilihan rute transportasi belum lengkap.','Sambungan transportasi tidak dapat diverifikasi.'].includes(error?.message))return 'TRANSPORT_CONNECTIONS';return ({'Rancangan tidak lengkap.':'INCOMPLETE','Rancangan tidak dapat diverifikasi.':'SOURCE_OR_FORMAT','Malam penginapan tidak valid.':'HOTEL_NIGHT','Rute transportasi belum lengkap.':'TRANSFER_ROUTE','Aktivitas sebelum kedatangan.':'BEFORE_ARRIVAL','Aktivitas terlalu dekat penerbangan pulang.':'AFTER_RETURN_BUFFER','Aktivitas berbenturan dengan pesanan.':'BOOKING_CONFLICT','Referensi wisata belum cukup.':'ATTRACTIONS_REQUIRED'})[error?.message]||'INVALID_JSON';}
export function validatePlan(plan,q,sources){
 if(!plan||!Array.isArray(plan.activities)||plan.activities.length>70||!plan.activities.length)throw Error('Rancangan tidak lengkap.');
 const allowed=new Set(sources.map(s=>s.url));
 const activities=plan.activities.map((a,i)=>{
  if(!Number.isInteger(a.day)||a.day<1||a.day>q.days||!/^([01]\d|2[0-3]):[0-5]\d$/.test(a.time)||!['Wisata','Penginapan','Area menginap','Transfer'].includes(a.category)||!a.title||!allowed.has(a.sourceUrl))throw Error('Rancangan tidak dapat diverifikasi.');
  if(a.category==='Penginapan'&&a.day>=q.days)throw Error('Malam penginapan tidak valid.');
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
  return {id:`ai-${i}`,day:a.day,time:a.time,category:a.category,title:text(a.title),note:text(a.note,500),sourceUrl:a.sourceUrl,city:text(a.city,100),location:text(a.location),fromPlace:selected?selected.legs[0].fromPlace:text(a.fromPlace),toPlace:selected?selected.legs.at(-1).toPlace:text(a.toPlace),mode:selected?selected.legs.map(l=>l.mode).join(' + '):text(a.mode,100),...routes};
 }).sort((a,b)=>a.day-b.day||a.time.localeCompare(b.time));
 if(new Set(activities.filter(a=>a.category==='Wisata').map(a=>a.title.toLowerCase())).size<2)throw Error('Referensi wisata belum cukup.');
 return {summary:text(plan.summary,1000),activities,sources,createdAt:new Date().toISOString(),context:q};
}
export async function handleItinerary(request,env){
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
 const raw=await request.text();if(raw.length>16000)return reply({error:'Permintaan terlalu besar.'},413);
 let q;try{q=validateInput(JSON.parse(raw));}catch{return reply({error:'Parameter perjalanan tidak valid.'},400);}
 if(!env.SUPABASE_SERVICE_ROLE_KEY)return reply({error:'Migrasi kuota AI dan konfigurasi server perlu disiapkan.'},503);
 const requestId=crypto.randomUUID();
 const quotaResponse=await quota('reserve_ai_request',{p_user:user.id,p_trip_key:planningKey(q.city,q.start),p_request:requestId});
 if(!quotaResponse.ok)return reply({error:'Migrasi kuota AI belum siap.'},503);
 const access=await quotaResponse.json();
 if(!access.allowed)return access.busy?reply({error:'Permintaan AI lain sedang diproses. Tunggu hingga selesai.'},429):reply({code:'TRIP_PASS_REQUIRED',error:'Beli Trip Pass untuk melanjutkan AI, atau lanjutkan edit manual.'},402);
 reservation={p_user:user.id,p_request:requestId};
 const providerSignal=AbortSignal.timeout(160000);
 const callProvider=body=>fetch('https://api.openai.com/v1/responses',{method:'POST',headers:{Authorization:'Bearer '+env.OPENAI_API_KEY,'Content-Type':'application/json'},signal:providerSignal,body:JSON.stringify(body)});
 let [response,routeResponse]=await Promise.all([callProvider(researchRequest(q,env)),q.transportPreference?callProvider(transportResearchRequest(q,env,'')):null]);
 let sources=[],researchText='';
 if(response.ok){
  const research=await response.json();
  if(research.status!=='completed')return reply({error:'Pencarian referensi belum selesai. Coba lagi nanti.'},502);
  sources=collectSources(research);
  if(!sources.length)return reply({code:'AI_SOURCES_UNAVAILABLE',error:'Referensi belum dapat diverifikasi. Tidak ada itinerary yang diubah.'},502);
  researchText=responseText(research);
  if(q.transportPreference){
   const routes=routeResponse;
   if(!routes.ok)return reply({code:'AI_TRANSPORT_RESEARCH_UNAVAILABLE',error:'Pencarian sambungan transportasi belum berhasil. Itinerary tidak diubah.'},502);
   const routeResearch=await routes.json();if(routeResearch.status!=='completed')return reply({code:'AI_TRANSPORT_RESEARCH_INCOMPLETE',error:'Pencarian rute transit belum selesai. Itinerary tidak diubah.'},502);
   const routeSources=collectSources(routeResearch);if(!routeSources.length)return reply({code:'AI_TRANSPORT_SOURCES_UNAVAILABLE',error:'Sumber rute transit belum dapat diverifikasi. Itinerary tidak diubah.'},502);
   sources=[...new Map([...routeSources,...sources].map(s=>[s.url,s])).values()].slice(0,80);
   researchText='TRANSPORT RESEARCH:\n'+responseText(routeResearch)+'\nGENERAL RESEARCH:\n'+researchText;
  }
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
 const parse=data=>validatePlan(JSON.parse(responseText(data).replace(/^```(?:json)?\s*|\s*```$/g,'')),q,sources);
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
 const settled=await quota('finish_ai_request',{...reservation,p_success:true});if(!settled.ok||!(await settled.json()).ok)return reply({error:'Pencatatan kuota belum berhasil. Coba lagi nanti.'},503);completed=true;return reply({access,plan});
 }catch{return reply({error:'Koneksi penyusunan terganggu atau melewati batas waktu. Itinerary lama tetap tersimpan.'},502);}finally{if(reservation&&!completed)try{await quota('finish_ai_request',{...reservation,p_success:false})}catch{}}
}
