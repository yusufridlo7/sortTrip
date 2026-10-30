// Read-only resolution from the user's supplied words, not video/URL evidence.
export async function resolveSearchDestination(text,origin,signal,{fetcher=fetch}={}){
 const response=await fetcher('/api/locations/resolve',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({text,origin}),signal});
 if(!response.ok)throw Error('DESTINATION_RESOLVE_UNAVAILABLE');
 const body=await response.json();
 if(!Array.isArray(body.locations)||body.locations.length>8||!body.locations.every(row=>row&&/^[A-Z]{3}$/.test(row.code)&&typeof row.city==='string'&&row.city.length>0&&row.city.length<=160&&typeof row.name==='string'&&typeof row.country==='string'))throw Error('DESTINATION_RESOLVE_UNAVAILABLE');
 return body.locations;
}
