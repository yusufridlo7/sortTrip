import fs from 'node:fs';
import path from 'node:path';
export const C2_LIMITS=Object.freeze({flight:5,hotel:5,metadata:2});
export function gateC2Budget(directory){
 const count=kind=>{if(!Object.hasOwn(C2_LIMITS,kind))throw Error('C2_KIND_DENIED');return fs.existsSync(directory)?fs.readdirSync(directory).filter(n=>new RegExp('^'+kind+'-[1-5]\\.claimed$').test(n)).length:0;};
 return {count,reserve(kind){
  if(!Object.hasOwn(C2_LIMITS,kind))throw Error('C2_KIND_DENIED');
  fs.mkdirSync(directory,{recursive:true});if(fs.lstatSync(directory).isSymbolicLink())throw Error('C2_STATE_DENIED');
  if(fs.existsSync(path.join(directory,'closed'))||fs.existsSync(path.join(directory,kind+'.success')))throw Error('C2_PROVIDER_CLOSED');
  const busy=path.join(directory,'inflight');let lock;
  try{lock=fs.openSync(busy,'wx',0o600);}catch{throw Error('C2_REQUEST_BUSY');}
  try{
   for(let slot=1;slot<=C2_LIMITS[kind];slot++){
    const claim=path.join(directory,kind+'-'+slot+'.claimed');let fd;
    try{fd=fs.openSync(claim,'wx',0o600);}catch(e){if(e.code==='EEXIST')continue;throw Error('C2_STATE_DENIED');}
    try{fs.writeSync(fd,'Gate C.2 2026-10-29: reserved before egress; never reset.\n');fs.fsyncSync(fd);}finally{fs.closeSync(fd);}
    return {slot,release(){if(lock!==undefined){fs.closeSync(lock);lock=undefined;fs.unlinkSync(busy);}}};
   }
   throw Error('C2_BUDGET_EXHAUSTED');
  }catch(e){fs.closeSync(lock);fs.unlinkSync(busy);throw e;}
 }};
}
