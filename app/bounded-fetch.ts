// Preserve caller cancellation while bounding database/payment status requests.
export function boundedFetch(input:RequestInfo|URL,init:RequestInit={}){
  const caller=init.signal||(input instanceof Request?input.signal:null);
  const timeout=AbortSignal.timeout(20000);
  return fetch(input,{...init,signal:caller?AbortSignal.any([caller,timeout]):timeout});
}
