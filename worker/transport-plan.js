export const routeOptionsSchema={type:['array','null'],maxItems:3,items:{type:'object',additionalProperties:false,required:['kind','summary','legs'],properties:{kind:{type:'string',enum:['hemat','cepat','seimbang']},summary:{type:'string'},legs:{type:'array',minItems:1,maxItems:8,items:{type:'object',additionalProperties:false,required:['fromPlace','toPlace','mode','note','sourceUrl','fare','duration','checkedAt'],properties:{fromPlace:{type:'string'},toPlace:{type:'string'},mode:{type:'string'},note:{type:'string'},sourceUrl:{type:'string'},fare:{type:['string','null']},duration:{type:['string','null']},checkedAt:{type:['string','null']}}}}}}};
export function validateRoutes(options,sources,preference='seimbang'){
 if(!Array.isArray(options)||!options.length||options.length>3)throw Error('Pilihan rute transportasi belum lengkap.');
 const allowed=new Set(sources.map(s=>s.url));const kinds=new Set();
 const clean=options.map(o=>{
  if(!['hemat','cepat','seimbang'].includes(o.kind)||kinds.has(o.kind)||typeof o.summary!=='string'||!o.summary.trim()||!Array.isArray(o.legs)||!o.legs.length||o.legs.length>8)throw Error('Pilihan rute transportasi belum lengkap.');kinds.add(o.kind);
  const legs=o.legs.map((l,i)=>{
   if(!l||!['fromPlace','toPlace','mode','note'].every(k=>typeof l[k]==='string'&&l[k].trim())||!allowed.has(l.sourceUrl)||l.fromPlace.length>160||l.toPlace.length>160||l.mode.length>100||i&&o.legs[i-1].toPlace.trim().toLowerCase()!==l.fromPlace.trim().toLowerCase())throw Error('Sambungan transportasi tidak dapat diverifikasi.');
   const quote={};
   if(l.fare||l.duration){if(!/^\d{4}-\d{2}-\d{2}$/.test(l.checkedAt||'')||!Number.isFinite(Date.parse(l.checkedAt)))throw Error('Sambungan transportasi tidak dapat diverifikasi.');for(const key of ['fare','duration']){if(l[key]!=null&&(typeof l[key]!=='string'||!l[key].trim()||l[key].length>140))throw Error('Sambungan transportasi tidak dapat diverifikasi.');quote[key]=l[key]||null;}quote.checkedAt=l.checkedAt;}
   return {...quote,fromPlace:l.fromPlace.trim(),toPlace:l.toPlace.trim(),mode:l.mode.trim(),note:l.note.slice(0,500),sourceUrl:l.sourceUrl};
  });return {kind:o.kind,summary:o.summary.slice(0,700),legs};
 });
 // All options must connect the same start/end; never substitute an unrelated route.
 const key=v=>v.trim().toLowerCase(),first=clean[0];
 if(clean.some(o=>key(o.legs[0].fromPlace)!==key(first.legs[0].fromPlace)||key(o.legs.at(-1).toPlace)!==key(first.legs.at(-1).toPlace)))throw Error('Sambungan transportasi tidak dapat diverifikasi.');
 const selectedRoute=Math.max(0,clean.findIndex(o=>o.kind===preference));
 return {routeOptions:clean,selectedRoute};
}
