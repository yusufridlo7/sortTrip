// Dedicated child runtime loads only the owner-selected file. Never returns secrets.
import {spawnSync} from 'node:child_process';
import fs from 'node:fs';
import {fileURLToPath} from 'node:url';
const file=fileURLToPath(new URL('../.dev.vars.gate-c',import.meta.url));
let valid=false;try{const s=fs.lstatSync(file);valid=s.isFile()&&!s.isSymbolicLink()&&s.size<16384;}catch{}
if(!valid){console.log(JSON.stringify({status:'QA_BINDING_FILE_REQUIRED'}));process.exitCode=1;}
else{
 const code=`const present=k=>typeof process.env[k]==='string'&&process.env[k].trim().length>8;console.log(JSON.stringify({status:'QA_BINDING_METADATA_ONLY',flightBindingPresent:present('TRAVELPAYOUTS_API_TOKEN'),hotelBindingPresent:present('LITEAPI_API_KEY'),credentialValidity:'UNVERIFIED',supplierEnabled:false}));`;
 const minimal=Object.fromEntries(['SystemRoot','WINDIR','TEMP','TMP'].filter(k=>process.env[k]).map(k=>[k,process.env[k]]));
 const child=spawnSync(process.execPath,['--env-file='+file,'--input-type=module','-e',code],{env:minimal,encoding:'utf8',windowsHide:true,timeout:5000,maxBuffer:4096});
 // Capture and discard stderr: parser/launcher errors must not expose file content.
 try{const v=JSON.parse(child.stdout);if(child.status!==0||v.status!=='QA_BINDING_METADATA_ONLY'||typeof v.flightBindingPresent!=='boolean'||typeof v.hotelBindingPresent!=='boolean')throw Error();console.log(JSON.stringify({status:v.status,flightBindingPresent:v.flightBindingPresent,hotelBindingPresent:v.hotelBindingPresent,credentialValidity:'UNVERIFIED',supplierEnabled:false}));}
 catch{console.log(JSON.stringify({status:'QA_BINDING_LOAD_FAILED'}));process.exitCode=1;}
}
