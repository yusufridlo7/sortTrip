export type RlsReference={kind:string;fixtureId:string;ownerId:string};
export type RlsResult={test:string;passed:boolean;category:string};
export const QA_RLS_KIND:string;
export function fixtureData(revision?:number):Record<string,unknown>;
export function parseRlsReference(text:string):RlsReference;
export function probeForeign(api:any,ownId:string,reference:RlsReference):Promise<RlsResult[]>;
export function probeGuest(api:any,reference:RlsReference):Promise<RlsResult>;
export function verifyOwn(api:any,ownId:string,reference:RlsReference):Promise<RlsResult>;
