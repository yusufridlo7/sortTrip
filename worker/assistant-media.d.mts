export type AssistantMediaData={kind:string;mime:string;data:string};
export const MEDIA_LIMITS:Readonly<{images:number;videos:number;imageBytes:number;videoBytes:number;totalBytes:number;maxSide:number;videoSeconds:number;requestBytes:number}>;
export class MediaError extends Error{code:string;status:number;constructor(code:string,status?:number)}
export function validateAssistantMedia(values:unknown,consent:boolean):AssistantMediaData[];
export function readAssistantBody(request:Request,maxBytes?:number):Promise<string>;
export function mediaInput(input:string,media:AssistantMediaData[]):unknown[];
