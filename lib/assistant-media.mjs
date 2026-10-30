import {resolvePlace,VideoError} from './video-itinerary.mjs';
const identity=v=>v.normalize('NFKC').trim().toLowerCase().replace(/\s+/g,' ');
// Retain minimal reviewed place metadata, never raw transcripts, video or model
// coordinates. The ordinary planner researches facts and validates its sources.
export function assistantMedia(value){
 if(value===undefined)return [];
 if(!Array.isArray(value)||value.length>8)throw new VideoError('INVALID_INPUT');
 const seen=new Set();return value.flatMap(c=>{
  if(!c||['name','city','country'].some(k=>typeof c[k]!=='string'||!c[k].trim()||c[k].length>(k==='name'?160:100)||/[\u0000-\u001f]/.test(c[k])))throw new VideoError('INVALID_INPUT');
  const p=resolvePlace(c.name,c.city,c.country);
  const key=p?.sourceUrl||[c.name,c.city,c.country].map(identity).join('|');if(seen.has(key))return [];seen.add(key);
  return [{name:c.name.trim(),city:c.city.trim(),country:c.country.trim(),evidenceKind:c.evidenceKind==='mentioned'?'mentioned':'inferred',confidence:['high','medium','low'].includes(c.confidence)?c.confidence:'low',verified:!!p,...(p?{sourceUrl:p.sourceUrl}:{})}];
 });
}
export function mediaInstructions(value=''){
 if(typeof value!=='string'||value.length>1000||new TextEncoder().encode(value).length>3000)throw new VideoError('INVALID_INPUT');return value;
}
