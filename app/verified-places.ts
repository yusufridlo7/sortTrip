// Exact public OSM museum features checked 24 October 2026. No fuzzy geocoding,
// city-centre fallbacks or admission-price assumptions.
export const verifiedPlaces=[
 {city:'Kuala Lumpur',names:['Muzium Negara','National Museum (Muzium Negara)','National Museum','National Museum of Malaysia'],geo:{lat:3.137662,lng:101.6873819},sourceUrl:'https://www.openstreetmap.org/way/323394984'},
 {city:'Kuala Lumpur',names:['Islamic Arts Museum Malaysia','Islamic Arts Museum','Muzium Kesenian Islam Malaysia'],geo:{lat:3.1414525,lng:101.6898711},sourceUrl:'https://www.openstreetmap.org/way/659878360'}
];
export function verifiedPlace(name:string,city:string){return verifiedPlaces.find(place=>place.city.toLowerCase()===city.toLowerCase()&&place.names.some(alias=>alias.toLowerCase()===name.toLowerCase()));}
