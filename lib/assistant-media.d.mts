export type AssistantPlace={name:string;city:string;country:string;evidenceKind:'mentioned'|'inferred';confidence:'high'|'medium'|'low';verified:boolean;sourceUrl?:string};
export function assistantMedia(value?:unknown):AssistantPlace[];
export function mediaInstructions(value?:string):string;
