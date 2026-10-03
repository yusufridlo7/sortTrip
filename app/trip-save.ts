import type {Trip} from './travel-data';

// A save acknowledges a snapshot, never edits made while its request was in flight.
export function reconcileSavedTrip(current:Trip|null,snapshot:Trip,id:string,sameDraft:boolean){
  if(!sameDraft||!current)return null;
  return {trip:{...current,id},dirty:current!==snapshot};
}
