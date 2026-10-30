import fs from 'node:fs';
import {fileURLToPath} from 'node:url';
import {gateCBudget} from '../qa-config/gate-c-budget.mjs';
import {kingstoneMetadata,KINGSTONE_QUERY} from '../qa-config/gate-c-metadata.mjs';
if(process.argv[2]!=='--owner-approved-kingstone-metadata'){console.log(JSON.stringify({status:'APPROVAL_REQUIRED'}));process.exitCode=1;}
else{
 const variant=process.argv[3]||'Kingstone';
 const result=await kingstoneMetadata({key:process.env.LITEAPI_API_KEY,budget:gateCBudget(fileURLToPath(new URL('../.sorttrip-qa/gate-c-2026-10-29',import.meta.url))),variant});
 const evidence={checkedAt:new Date().toISOString(),query:KINGSTONE_QUERY.replace('hotelName=Kingstone','hotelName='+encodeURIComponent(variant)),...result};
 const dir=fileURLToPath(new URL('../artifacts/gate-c',import.meta.url));fs.mkdirSync(dir,{recursive:true});
 // Only whitelisted public hotel metadata; never persist raw provider response.
 try{fs.writeFileSync(dir+'/'+(['Kingstone','Kingston','Riccarton'].includes(variant)?variant.toLowerCase():'invalid')+'-metadata.json',JSON.stringify(evidence,null,2),{flag:'wx'});}catch{}
 console.log(JSON.stringify(evidence));
}
