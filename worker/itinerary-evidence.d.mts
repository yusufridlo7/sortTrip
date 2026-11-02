export function relevantSource(item:{category?:string;title?:string;location?:string;place?:string;city?:string;locationCity?:string;sourceUrl?:string},sources?:{url:string;title?:string}[]):boolean;
export function usableActivitySource(item:{aiGenerated?:boolean;sourceRelevant?:boolean;sourceUrl?:string;title?:string;place?:string;locationCity?:string},sources?:{url:string;title?:string}[]):string|null;
export function connectionGaps(activities:any[],q?:any):{day:number;from:string;to:string}[];
export function normalizeStationConnections<T extends {routeOptions?:any[]}>(routes:T,language?:string):T;
