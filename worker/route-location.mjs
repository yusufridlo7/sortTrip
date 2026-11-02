import locations from './locations.json' with {type:'json'};
export function airportRouteName(value){
 const code=String(value||'').trim(),entry=/^[A-Z]{3}$/.test(code)?locations[code]:null;
 return entry&&/airport|international|airfield|aerodrome/i.test(entry.name)?entry.name:null;
}
export function routeAddress(value){
 const name=airportRouteName(value);if(!name)return value.trim();
 const entry=locations[value.trim()];return [name,entry.city,entry.country].join(', ');
}
