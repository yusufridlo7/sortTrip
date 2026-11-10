import locations from './locations.json' with {type:'json'};
function airportEntry(value){
 // Map labels append the city to an IATA code. Keep explicit terminal qualifiers,
 // but never send the ambiguous bare code/city to Google's address resolver.
 const match=String(value||'').trim().match(/^([A-Z]{3})(?:\s*[,·–—]\s*(.+))?$/i);
 const entry=match?locations[match[1].toUpperCase()]:null;
 return entry&&/airport|international|airfield|aerodrome/i.test(entry.name)?{entry,qualifier:match[2]||''}:null;
}
export function airportRouteName(value){
 return airportEntry(value)?.entry.name||null;
}
export function routeAddress(value){
 const match=airportEntry(value);if(!match)return String(value||'').trim();
 const {entry,qualifier}=match;
 return [entry.name,...(/\b(?:terminal|t[1-9])\b/i.test(qualifier)?[qualifier]:[]),entry.city,entry.country].join(', ');
}
