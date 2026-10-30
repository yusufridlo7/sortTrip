import {initialVideoTrip,VideoError} from './video-itinerary.mjs';
import {assistantMedia} from './assistant-media.mjs';
// QA bridge into the existing Trip format, not a second AI planning service.
// Requires the explicit review action; preserves constraints and existing items.
export function reviewedTrip(candidates,trip,{reviewed=false,language='id'}={}){
 if(!reviewed||!trip||!Array.isArray(trip.items))throw new VideoError('REVIEW_REQUIRED');
 const draft=initialVideoTrip(candidates,{start:trip.start,days:trip.days,people:trip.people,language});
 if(trip.destinationMeta&&(trip.destinationMeta.city!==draft.destinationMeta.city||trip.destinationMeta.country!==draft.destinationMeta.country))throw new VideoError('REVIEW_REQUIRED');
 const retained=trip.items.filter(item=>!item.id.startsWith('video-')||item.paid||item.bookingHold||item.aiLocked);
 // A protected item is retained exactly and is never duplicated by the bridge.
 const additions=draft.items.filter(item=>!retained.some(old=>old.place===item.place&&old.locationCity===item.locationCity));
 return {...trip,destination:draft.destination,destinationMeta:{...draft.destinationMeta,code:trip.destinationMeta?.code||''},assistantMedia:assistantMedia(candidates),items:[...retained,...additions],estimateIncomplete:true,version:2};
}
// Merge a reviewed local/demo draft into the existing editor, never into a
// parallel store. Keep original constraints, payments, locks and partner URLs.
export function mergeReviewedVideoDraft(trip,draft){
 if(!trip||!draft||!Array.isArray(trip.items)||!Array.isArray(draft.items)||trip.destinationMeta?.city!==draft.destinationMeta?.city||trip.destinationMeta?.country!==draft.destinationMeta?.country||draft.items.some(x=>!Number.isInteger(x.day)||x.day<1||x.day>trip.days))throw new VideoError('REVIEW_REQUIRED');
 const key=x=>[x.place||x.title,x.locationCity||trip.destinationMeta?.city].map(v=>String(v||'').normalize('NFKC').trim().toLowerCase()).join('|');
 const kept=trip.items.filter(x=>!x.id.startsWith('video-')||x.paid||x.bookingHold||x.aiLocked);
 const seen=new Set(kept.map(key)),added=[];
 for(const item of draft.items){if(!seen.has(key(item))){seen.add(key(item));added.push(item);}}
 return {...trip,items:[...kept,...added],estimateIncomplete:true};
}
