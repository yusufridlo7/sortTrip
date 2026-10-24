import {referenceAdmission} from './admission-reference.mjs';
const references=[
 {names:['national museum','national museum muzium negara','muzium negara','national museum of malaysia'],url:'https://www.muziumnegara.gov.my/en/ticket',title:'Muzium Negara official ticket information',identity:/Muzium Negara|National Museum/i,price:/FOREIGNER\s+Adult\s+RM\s*([\d.]+)/i,audience:'Foreign adult'},
 {names:['islamic arts museum malaysia','islamic arts museum'],url:'https://iamm.org.my/visit-us',title:'Islamic Arts Museum Malaysia official visitor information',identity:/Islamic Arts Museum Malaysia/i,price:/Admissions and Tickets[\s\S]{0,900}?Adults\s+RM\s*([\d.]+)/i,audience:'Adult (including non-Malaysian visitors)'}
];
const normalize=value=>String(value||'').toLowerCase().replace(/[^\p{L}\p{N}]+/gu,' ').trim();
const plain=html=>html.replace(/<script\b[^>]*>[\s\S]*?<\/script>|<style\b[^>]*>[\s\S]*?<\/style>/gi,' ').replace(/<[^>]+>/g,' ').replace(/&nbsp;|&#160;|&#xA0;/gi,' ').replace(/&amp;/g,'&').replace(/\s+/g,' ');

export function parseOfficialAdmission(activity,url,html){
 const ref=references.find(ref=>ref.url===url&&ref.names.includes(normalize(activity.title)));
 if(!ref||typeof html!=='string'||html.length>1200000)return null;
 const text=plain(html);if(!ref.identity.test(text))return null;
 const match=text.match(ref.price);if(!match)return null;const amount=Number(match[1]);
 if(!Number.isFinite(amount)||amount<=0||amount>1000)return null;
 return {amount,currency:'MYR',audience:ref.audience,quote:match[0].match(/(?:FOREIGNER\s+)?Adults?\s+RM\s*[\d.]+/i)?.[0]||'',sourceUrl:ref.url,checkedAt:new Date().toISOString()};
}

export async function enrichOfficialAdmissions(plan,fetcher=fetch){
 const cache=new Map();
 const activities=await Promise.all(plan.activities.map(async activity=>{
  if(activity.category!=='Wisata'||activity.admission)return activity;
  const ref=references.find(ref=>ref.names.includes(normalize(activity.title))&&(!activity.city||/kuala lumpur/i.test(activity.city)));
  if(!ref)return activity;
  try{
   if(!cache.has(ref.url))cache.set(ref.url,(async()=>{const r=await fetcher(ref.url,{redirect:'error',signal:AbortSignal.timeout(8000),headers:{Accept:'text/html'}});return r.ok?await r.text():'';})());
   const admission=parseOfficialAdmission(activity,ref.url,await cache.get(ref.url));
   const checked=admission||referenceAdmission(activity.title,activity.city);return checked?{...activity,admission:checked}:activity;
  }catch{const admission=referenceAdmission(activity.title,activity.city);return admission?{...activity,admission}:activity;}
 }));
 const urls=new Set(activities.filter(a=>a.admission).map(a=>a.admission.sourceUrl));
 return {...plan,activities,sources:[...plan.sources,...references.filter(ref=>urls.has(ref.url)&&!plan.sources.some(s=>s.url===ref.url)).map(({url,title})=>({url,title}))]};
}
