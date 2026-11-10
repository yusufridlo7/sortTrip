// Short source IDs reduce repeated URL tokens on the wire only. Saved schema stays unchanged.
export function metaDraftWire(body){
 if(body.text?.format?.name!=='sorttrip_itinerary')return {body,restore:x=>x};
 const original=JSON.parse(body.input),sources=Array.isArray(original.sources)?original.sources:[],urls=sources.map(s=>s.url);
 const registry=Object.fromEntries(urls.map((url,i)=>['S'+(i+1),url]));
 if(!urls.length)return {body,restore:x=>x};
 const schema=structuredClone(body.text.format.schema);
 function visit(v){if(!v||typeof v!=='object')return;if(v.properties?.sourceUrl)v.properties.sourceUrl={type:'string',enum:Object.keys(registry)};for(const value of Object.values(v))if(value&&typeof value==='object')visit(value);}
 visit(schema);
 const earliest=original.scheduleBounds?.earliestMinute;
 if(Number.isFinite(earliest)&&earliest>=0)schema.properties.activities.items.properties.day.minimum=Math.floor(earliest/1440)+1;
 schema.properties.summary.maxLength=700;
 schema.properties.activities.items.properties.note.maxLength=180;
 // A four-day trip can need more than sixteen records once every airport/stay/
 // visit/return connector is explicit. Keep the existing schema bound of 70;
 // output tokens, rather than a conflicting short-trip cap, bound generation.
 const wire={...body,reasoning:{effort:'minimal'},text:{...body.text,format:{...body.text.format,schema}},instructions:body.instructions+'\nWIRE FORMAT: use short source IDs (S1, S2, etc.) in every sourceUrl field according to the supplied sourceRegistry; the server restores original URLs before validation/storage. This applies ONLY to sourceUrl fields, not quote text. Keep notes compact. Do not add day-1 activities if earliestMinute starts on day 2.',input:JSON.stringify({...original,sourceRegistry:registry})};
 function restore(result){
  if(result.status!=='completed')return result;
  const translate=v=>{if(!v||typeof v!=='object')return;for(const [key,value]of Object.entries(v)){if(key==='sourceUrl'&&typeof value==='string'&&Object.hasOwn(registry,value))v[key]=registry[value];else if(value&&typeof value==='object')translate(value);}};
  return {...result,output:result.output.map(o=>o.type==='message'?{...o,content:o.content.map(c=>{if(c.type!=='output_text')return c;try{const parsed=JSON.parse(c.text);translate(parsed);return {...c,text:JSON.stringify(parsed)};}catch{return c;}})}:o)};
 }
 return {body:wire,restore};
}
