export type ResolvedDestination={code:string;city:string;name:string;country:string;countryCode?:string};
export function resolveSearchDestination(text:string,origin:string,signal:AbortSignal,options?:{fetcher?:typeof fetch}):Promise<ResolvedDestination[]>;
