// Public local routes only; no authentication, environment or supplier calls.
import fs from 'node:fs/promises';
const rows=[];
for(const [path,expected]of [['/',200],['/hotel-checkout',200],['/api/health',200],['/qa-disclosure-missing',404]]){
 try{const r=await fetch('http://127.0.0.1:8787'+path,{signal:AbortSignal.timeout(10000)});await r.arrayBuffer();rows.push({path,expected,httpStatus:r.status,status:r.status===expected?'PASS':'FAIL'});}catch{rows.push({path,expected,status:'BLOCKED',reason:'LOCAL_SERVER_UNAVAILABLE'});}
}
await fs.writeFile('qa-reports/2026-10-23/evidence/disclosure-http.json',JSON.stringify(rows,null,2));
console.log(JSON.stringify(rows));if(rows.some(x=>x.status!=='PASS'))process.exitCode=1;
