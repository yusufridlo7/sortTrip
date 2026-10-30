import locations from './locations.json' with {type:'json'};
import {boundedBytes,VideoError} from '../lib/video-itinerary.mjs';
const labels=new Map(),regions=new Intl.DisplayNames(['id'],{type:'region'});
export function countryName(code){if(!labels.has(code)){try{labels.set(code,regions.of(code)||code);}catch{labels.set(code,code);}}return labels.get(code);}
export function searchLocations(query){
 const text=query.trim().toLowerCase();if(text.length<2||text.length>160)return [];
 const aliases={bali:'DPS',jakarta:'JKT',bangkok:'BKK','kuala lumpur':'KUL',tokyo:'TYO',singapore:'SIN',singapura:'SIN'};
 const rank=([code,m])=>code.toLowerCase()===text?0:code===aliases[text]?1:m.city.toLowerCase()===text?2:m.city.toLowerCase().startsWith(text)?3:m.city.toLowerCase().includes(text)?4:5;
 return Object.entries(locations).filter(([code,m])=>code.toLowerCase().includes(text)||m.city.toLowerCase().includes(text)||m.name.toLowerCase().includes(text)||countryName(m.country).toLowerCase().includes(text))
 .sort((a,b)=>rank(a)-rank(b)||a[1].city.localeCompare(b[1].city)||a[0].localeCompare(b[0]))
 .slice(0,25).map(([code,m])=>({code,city:m.city,name:m.name,country:countryName(m.country),countryCode:m.country}));
}
const normalize=v=>v.normalize('NFKD').replace(/\p{M}/gu,'').toLowerCase().replace(/[^\p{L}\p{N}]+/gu,' ').trim();
// Airport catalogues include tiny places named "Malam", "Kota", etc. Ordinary
// travel words must never turn a hotel/night preference into an extra city.
const commonWords=new Set(['malam','pagi','siang','hari','minggu','kota','city','night','nights','days','from','stay','cheap','trip','travel','video','tujuan','budget','jalan','main','solo','bandar','baru','barat','utara','timur','selatan']);
export function destinationsFromText(text,origin){
 if(typeof text!=='string'||text.length>1000||!['CGK','SUB','DPS'].includes(origin))return [];
 // A URL is not destination evidence. Do not infer places from URL slugs.
 const plain=normalize(text.replace(/https?:\/\/\S+/gi,''));
 const choices=new Map(),originCity=locations[origin]?.cityCode;
 for(const [code,m] of Object.entries(locations)){
  if(m.cityCode===originCity)continue;
  const aliases=[m.city,...({DPS:['Bali'],SIN:['Singapura'],KUL:['KL']}[m.cityCode]||[])];
  const found=aliases.some(alias=>{
   const term=normalize(alias);if(commonWords.has(term)||term.length<4&&term!=='kl')return false;
   if(!(' '+plain+' ').includes(' '+term+' '))return false;
   return !['jangan','bukan','hindari','tanpa','not','avoid','except'].some(negation=>(' '+plain+' ').includes(' '+negation+' '+term+' '));
  });
  if(!found)continue;
  const item={code:locations[m.cityCode]?m.cityCode:code,city:m.city,name:m.name,country:countryName(m.country),countryCode:m.country};
  if(!choices.has(m.cityCode)||code===m.cityCode)choices.set(m.cityCode,item);
 }
 return [...choices.values()].slice(0,8);
}
export async function resolveLocations(request){
 if(request.method!=='POST')return Response.json({code:'METHOD_NOT_ALLOWED'},{status:405});
 if(request.headers.get('Origin')&&request.headers.get('Origin')!==new URL(request.url).origin)return Response.json({code:'ORIGIN_DENIED'},{status:403});
 try{
  const bytes=await boundedBytes(request.body,8000,AbortSignal.any([request.signal,AbortSignal.timeout(5000)]));
  const body=JSON.parse(new TextDecoder().decode(bytes));
  if(typeof body.text!=='string'||body.text.length>1000||!['CGK','SUB','DPS'].includes(body.origin))throw Error();
  return Response.json({locations:destinationsFromText(body.text,body.origin),source:'supplied-request-text',videoAccessed:false},{headers:{'Cache-Control':'no-store'}});
 }catch(error){return Response.json({code:error instanceof VideoError?error.code:'INVALID_INPUT'},{status:error instanceof VideoError?error.status:400});}
}
