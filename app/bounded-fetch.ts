import {gateBRequestAllowed} from '../lib/qa-gate-b-network.mjs';
// Preserve caller cancellation while bounding database/payment status requests.
export function boundedFetch(input:RequestInfo|URL,init:RequestInit={}){
  if(['qa-preparation','staging'].includes(import.meta.env?.MODE)){
    const url=input instanceof Request?input.url:String(input),method=init.method||(input instanceof Request?input.method:'GET');
    if(!gateBRequestAllowed(url,method))throw Error('QA_SDK_OPERATION_DENIED');
  }
  const caller=init.signal||(input instanceof Request?input.signal:null);
  const timeout=AbortSignal.timeout(20000);
  return fetch(input,{...init,signal:caller?AbortSignal.any([caller,timeout]):timeout});
}
