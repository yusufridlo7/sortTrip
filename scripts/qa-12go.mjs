// Opt-in, fixed transport search. No AI quota, booking, payment or env files.
import {unstable_dev} from 'wrangler';
import {mkdir,writeFile} from 'node:fs/promises';
if(!process.argv.includes('--run-remote'))throw Error('Use --run-remote for the configured Cloudflare browser binding.');
let worker;
try{
 worker=await unstable_dev('scripts/qa-12go-worker.mjs',{config:'scripts/hotel-browser-check.jsonc',envFiles:[],ip:'127.0.0.1',port:8794,persist:false,logLevel:'none',experimental:{disableExperimentalWarning:true,disableDevRegistry:true,watch:false}});
 const response=await worker.fetch();const data=await response.json();
 await mkdir('qa-reports/2026-10-23/evidence',{recursive:true});
 await writeFile('qa-reports/2026-10-23/evidence/12go-backend.json',JSON.stringify({checkedAt:new Date().toISOString(),...data},null,2));
 console.log(JSON.stringify(data));
}catch{console.log('TRANSPORT_QA_RUNTIME_UNAVAILABLE');process.exitCode=1;}
finally{await worker?.stop();}
