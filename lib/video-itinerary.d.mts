import type {Trip} from '../app/travel-data';
export type Candidate={reviewAdded?:boolean;manualConfirmed?:boolean;id:string;name:string;city:string;country:string;category:string;activity:string;sourceEvidence:string;evidenceKind:'mentioned'|'inferred';confidence:'low'|'medium'|'high';verified:boolean;recommendedDurationMinutes:number|null;verification:string;duplicate:boolean;placeId?:string;sourceUrl?:string;geo?:{lat:number;lng:number}};
export const VIDEO_LIMITS:{bytes:number;seconds:number;text:number;candidates:number};
export class VideoError extends Error{code:string;status:number;constructor(code:string,status?:number)}
export function socialVideoUrl(value:string):{provider:string;url:string};
export function inspectMp4(bytes:Uint8Array,mime:string):{bytes:number;durationSeconds:number;inspection:string};
export const placeCatalog:{id:string;city:string;country:string;names:string[];geo:{lat:number;lng:number};sourceUrl:string}[];
export function resolvePlace(name:string,city:string,country:string):typeof placeCatalog[number]|undefined;
export function normalizeDestinations(value:unknown,transcript?:string):Candidate[];
export function initialVideoTrip(candidates:Candidate[],options:{start:string;days:number;people:number;language?:string;demo?:boolean;manualReview?:boolean}):Trip;
export function demoDestinations(city?:string):{transcript:string;destinations:Candidate[]};
