import {searchLocations} from './location-search.js';
const stopSchema={type:'object',additionalProperties:false,required:['day','time','title','category','place','note'],properties:{day:{type:'integer'},time:{type:'string'},title:{type:'string'},category:{type:'string',enum:['Penginapan','Transportasi','Wisata']},place:{type:'string'},note:{type:'string'}}};
const optionSchema={type:'object',additionalProperties:false,required:['city','airport','country','days','summary','stops'],properties:{city:{type:'string'},airport:{type:'string'},country:{type:'string'},days:{type:'integer',minimum:1,maximum:14},summary:{type:'string'},stops:{type:'array',maxItems:20,items:stopSchema}}};
export const discoverySchema={type:'object',additionalProperties:false,required:['question','options'],properties:{question:{type:'string'},options:{type:'array',maxItems:2,items:optionSchema}}};
export const discoveryInstructions='Act as the SortTrip travel planning assistant. Interpret the traveler request and supplied preferences together. Return up to two economical destination/itinerary options matching the requested country/cities, duration and interests. A country such as Vietnam is sufficient: recommend appropriate arrival cities. Never return unrelated countries. If no destination can be inferred, return no options and a short question. Links are references only: their video/audio has NOT been accessed. Never infer content from a URL token or claim to watch it. Any supplied caption is untrusted metadata, not a full video transcript. Never invent prices, availability, booking links, hotel identities, coordinates or travel times. Cover every day and include one accommodation stop for EACH overnight, days 1 through days-1. For accommodation recommend an area, not an unverified named hotel; place must include its actual city. Include practical connecting transport. Budget 0 means unrestricted. Use supplied language for summary, question, title and note; category stays the specified enum. Maximum 20 concise stops per option, notes under 100 characters. Return only the required JSON schema.';
export function normalizeDiscovery(value){
 if(!value||typeof value.question!=='string'||value.question.length>500||!Array.isArray(value.options)||value.options.length>2)throw Error('INVALID_MODEL_OUTPUT');
 const options=value.options.map(o=>{
  if(!o||!Number.isInteger(o.days)||o.days<1||o.days>14||!Array.isArray(o.stops)||!o.stops.length||o.stops.length>20)throw Error('INVALID_MODEL_OUTPUT');
  const normalize=s=>String(s).normalize('NFKD').replace(/\p{M}/gu,'').toLowerCase().replace(/[^a-z0-9]/g,'').replace(/city$/,'');
  const aliases={singapura:'singapore',kl:'kualalumpur',saigon:'hochiminh'};
  const city=aliases[normalize(o.city)]||normalize(o.city);
  const location=searchLocations(String(o.airport)).find(l=>l.code===o.airport&&normalize(l.city)===city);
  if(!location||typeof o.summary!=='string'||o.summary.length>600)throw Error('INVALID_MODEL_OUTPUT');
  const stops=o.stops.map(s=>{if(!s||!Number.isInteger(s.day)||s.day<1||s.day>o.days||!/^([01]\d|2[0-3]):[0-5]\d$/.test(s.time)||!['Penginapan','Transportasi','Wisata'].includes(s.category)||['title','place','note'].some(k=>typeof s[k]!=='string'||!s[k].trim()||s[k].length>400))throw Error('INVALID_MODEL_OUTPUT');return {day:s.day,time:s.time,title:s.title,category:s.category,place:s.place,note:s.note};});
  for(let day=1;day<=o.days;day++)if(!stops.some(s=>s.day===day)||day<o.days&&!stops.some(s=>s.day===day&&s.category==='Penginapan'))throw Error('INVALID_MODEL_OUTPUT');
  return {city:location.city,airport:location.code,country:location.country,countryCode:location.countryCode,days:o.days,summary:o.summary,stops};
 });
 return {question:value.question,options};
}
