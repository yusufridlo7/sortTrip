import fs from 'node:fs';
import path from 'node:path';
// Durable, fail-closed reservation BEFORE egress. Never remove these claims to retry.
// This is a Gate C task budget, unrelated to the Meta/Supabase ledger.
export function gateCBudget(directory){
 const claim=provider=>{
  if(!['flight','hotel','hotel-metadata','hotel-metadata-kingston','hotel-metadata-riccarton'].includes(provider))throw Error('GATE_C_EGRESS_DENIED');
  fs.mkdirSync(directory,{recursive:true});
  if(fs.lstatSync(directory).isSymbolicLink())throw Error('GATE_C_STATE_INVALID');
  const file=path.join(directory,provider+'.claimed');
  let fd;
  try{fd=fs.openSync(file,'wx',0o600);fs.writeSync(fd,'Gate C 2026-10-29: one request reserved; do not reset.\n');fs.fsyncSync(fd);}
  catch{throw Error('GATE_C_REQUEST_USED_OR_STATE_UNAVAILABLE');}
  finally{if(fd!==undefined)fs.closeSync(fd);}
 };
 return {claim};
}
export function gateCTransport(budget,fetcher){return async(target,init={})=>{
 const u=new URL(target),method=init.method||'GET';
 const flight=u.origin==='https://api.travelpayouts.com'&&u.pathname==='/aviasales/v3/prices_for_dates'&&method==='GET';
 const hotel=u.origin==='https://api.liteapi.travel'&&u.pathname==='/v3.0/hotels/rates'&&method==='POST';
 if((!flight&&!hotel)||u.username||u.password||u.hash)throw Error('GATE_C_EGRESS_DENIED');
 const headers=new Headers(init.headers);
 if(headers.has('Authorization')||headers.has('Cookie'))throw Error('GATE_C_EGRESS_DENIED');
 budget.claim(flight?'flight':'hotel');
 return fetcher(u.href,{...init,redirect:'manual',signal:AbortSignal.any([AbortSignal.timeout(19000),...(init.signal?[init.signal]:[])])});
};}
