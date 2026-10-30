import type {Trip} from '../app/travel-data';
import type {Candidate} from './video-itinerary.mjs';
export function reviewedTrip(candidates:Candidate[],trip:Trip,options?:{reviewed?:boolean;language?:string}):Trip;

export function mergeReviewedVideoDraft(trip:Trip,draft:Trip):Trip;
