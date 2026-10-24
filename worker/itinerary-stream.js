import {handleItinerary} from './itinerary.js';
import {localizedResponse,requestLanguage} from './localization.js';
export const itineraryStages=['validating','research','draft','hotels','transport','finalizing'];
export function streamItinerary(request,env,handler=handleItinerary){
 const encoder=new TextEncoder(),abort=new AbortController();let stopped=false;
 const job=new Request(request,{signal:AbortSignal.any([request.signal,abort.signal])});
 const stream=new ReadableStream({
  start(controller){
   const send=data=>{if(!stopped)try{controller.enqueue(encoder.encode('data: '+JSON.stringify(data)+'\n\n'));}catch{stopped=true;abort.abort();}};
   const ping=setInterval(()=>send({type:'heartbeat'}),15000);
   send({type:'progress',stage:'validating'});
   void handler(job,env,stage=>{if(itineraryStages.includes(stage))send({type:'progress',stage});}).then(async response=>{
    const localized=await localizedResponse(response,requestLanguage(request));
    send({type:'result',status:localized.status,body:await localized.json()});
   }).catch(()=>send({type:'result',status:502,body:{error:requestLanguage(request)==='en'?'The AI connection was interrupted. Check your saved trip before trying again.':'Koneksi proses AI terputus. Periksa perjalanan tersimpan sebelum mencoba lagi.'}})).finally(()=>{clearInterval(ping);if(!stopped){stopped=true;controller.close();}});
  },
  cancel(){stopped=true;abort.abort();}
 });
 return new Response(stream,{headers:{'Content-Type':'text/event-stream; charset=utf-8','Cache-Control':'no-store','X-Accel-Buffering':'no','X-Content-Type-Options':'nosniff'}});
}
