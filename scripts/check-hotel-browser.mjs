// Explicit opt-in remote smoke test: no AI, customer trip, quota or payment calls.
import {unstable_dev} from 'wrangler';
if(!process.argv.includes('--run-remote'))throw Error('Use --run-remote to test the configured browser binding.');
let proxy;
try{
 proxy=await unstable_dev('scripts/hotel-browser-check-worker.mjs',{config:'scripts/hotel-browser-check.jsonc',envFiles:[],ip:'127.0.0.1',port:8793,persist:false,logLevel:'none',experimental:{disableExperimentalWarning:true,disableDevRegistry:true,watch:false}});
 console.log(await (await proxy.fetch()).text());
}catch{console.log('HOTEL_CHECK_RUNTIME_UNAVAILABLE');process.exitCode=1;}
finally{await proxy?.stop();}
