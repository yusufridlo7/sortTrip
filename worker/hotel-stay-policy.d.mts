export const KLIA_SCOPE:{city:string;area:string;latitude:number;longitude:number;radius:number};
export function finalAirportNight(message?:string,days?:number):number|null;
export function airportStayPolicy(q:{interests?:string;days?:number;city?:string;country?:string}):({day:number}&typeof KLIA_SCOPE)|null;
export function withinAirportScope(geo?:{lat:number;lng:number}):boolean;
