import {spawnSync} from 'node:child_process';
import fs from 'node:fs';
import {fileURLToPath} from 'node:url';
const file=fileURLToPath(new URL('../.dev.vars.gate-c',import.meta.url));
let valid=false;try{const s=fs.lstatSync(file);valid=s.isFile()&&!s.isSymbolicLink()&&s.size<16384;}catch{}
if(!valid||process.argv[2]!=='--owner-approved-kingstone-metadata'){console.log(JSON.stringify({status:'BINDING_OR_APPROVAL_REQUIRED'}));process.exitCode=1;}
else{
 const minimal=Object.fromEntries(['SystemRoot','WINDIR','TEMP','TMP'].filter(k=>process.env[k]).map(k=>[k,process.env[k]]));
 const variant=process.argv[3]||'Kingstone';
 const child=spawnSync(process.execPath,['--env-file='+file,fileURLToPath(new URL('./qa-gate-c-metadata-child.mjs',import.meta.url)),'--owner-approved-kingstone-metadata',variant],{env:minimal,encoding:'utf8',windowsHide:true,timeout:25000,maxBuffer:32000});
 // Never print child stderr, native loader failures or inherited environment.
 try{const body=JSON.parse(child.stdout);if(child.status!==0||typeof body.status!=='string'||!Number.isInteger(body.upstreamRequests)||body.upstreamRequests<0||body.upstreamRequests>1)throw Error();console.log(JSON.stringify(body));}
 catch{console.log(JSON.stringify({status:'RUNTIME_FAILED_CHECK_CLAIM_BEFORE_ANY_FURTHER_ACTION'}));process.exitCode=1;}
}
