import {unstable_dev} from 'wrangler';
let worker;
try{
 worker=await unstable_dev('scripts/cloud-browser-limits-worker.mjs',{config:'scripts/hotel-browser-check.jsonc',envFiles:[],ip:'127.0.0.1',port:8797,persist:false,logLevel:'none',experimental:{disableExperimentalWarning:true,disableDevRegistry:true,watch:false}});
 console.info(await (await worker.fetch()).text());
}catch{console.info('CLOUD_LIMIT_CHECK_UNAVAILABLE');process.exitCode=1;}
finally{await worker?.stop();}
