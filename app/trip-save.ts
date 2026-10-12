import type {Trip} from './travel-data';
export function historyTripView(current:string,state:unknown,working=false){
 if(working)return current;
 const next=state&&typeof state==='object'&&'sorttripView' in state?state.sorttripView:null;
 return typeof next==='string'&&['explore','flights','planner','saved','hotels','transport','watch','support'].includes(next)?next:current;
}
export function restoredTripView(view:string|null,draft:string|null){
 if(view==='support')return 'support';
 if(view!=='planner'||!draft)return 'explore';
 try{const trip=JSON.parse(draft);return trip&&Array.isArray(trip.items)&&typeof trip.destination==='string'?'planner':'explore';}catch{return 'explore';}
}

// Serialize writes so a slow older save cannot overwrite a newer AI result.
export function createSaveQueue(){
 let tail:Promise<void>=Promise.resolve();
 return {
  run<T>(job:()=>Promise<T>):Promise<T>{const task=tail.then(job);tail=task.then(()=>{},()=>{});return task;},
  async idle(){let pending;do{pending=tail;await pending;}while(pending!==tail);}
 };
}

// A save acknowledges a snapshot, never edits made while its request was in flight.
export function reconcileSavedTrip(current:Trip|null,snapshot:Trip,id:string,sameDraft:boolean){
  if(!sameDraft||!current)return null;
  const sameContent=current===snapshot||JSON.stringify({...current,id:undefined})===JSON.stringify({...snapshot,id:undefined});
  return {trip:{...current,id},dirty:!sameContent};
}
