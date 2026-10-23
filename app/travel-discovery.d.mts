export const southeastAsia:string[];
export function rankedHotels<T extends {amountIDR:number;rating?:number|null}>(hotels:T[],sort?:string):T[];
export function rankedFlights<T extends {price:number;durationTo:number|null;transfers:number|null}>(flights:T[],sort?:string):T[];
