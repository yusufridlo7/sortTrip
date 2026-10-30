// Exact public OSM museum features checked 24 October 2026. No fuzzy geocoding,
// city-centre fallbacks or admission-price assumptions.
import {placeCatalog} from '../lib/video-itinerary.mjs';
export const verifiedPlaces=placeCatalog;
export function verifiedPlace(name:string,city:string){return verifiedPlaces.find(place=>place.city.toLowerCase()===city.toLowerCase()&&place.names.some(alias=>alias.toLowerCase()===name.toLowerCase()));}
