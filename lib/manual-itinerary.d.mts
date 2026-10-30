import type {Trip} from '../app/travel-data';
export function manualItinerary(location:{city:string;country:string;code:string}|null,preferences:{start:string;days:number;people:number;budget?:number;origin?:string}):Trip;
