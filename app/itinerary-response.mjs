const stages=new Set(['validating','research','draft','hotels','transport','finalizing']);
export async function itineraryResponse(response,onProgress=()=>{}){
 if(!response.headers.get('content-type')?.includes('text/event-stream'))return {status:response.status,ok:response.ok,body:await response.json()};
 if(!response.body)throw Error('ai_progress_interrupted');
 const reader=response.body.getReader(),decoder=new TextDecoder();let buffer='',result=null,total=0;
 try{
  while(true){const {value,done}=await reader.read();if(done)break;total+=value.length;if(total>2000000)throw Error('ai_progress_interrupted');buffer+=decoder.decode(value,{stream:true});
   let end;while((end=buffer.indexOf('\n\n'))>=0){const frame=buffer.slice(0,end);buffer=buffer.slice(end+2);if(!frame.startsWith('data: '))continue;const event=JSON.parse(frame.slice(6));
    if(event.type==='progress'&&stages.has(event.stage))onProgress(event.stage);
    if(event.type==='result'){if(!Number.isInteger(event.status)||event.status<200||event.status>599||!event.body||typeof event.body!=='object')throw Error('ai_progress_interrupted');result={status:event.status,ok:event.status>=200&&event.status<300,body:event.body};}
   }
  }
  if(!result)throw Error('ai_progress_interrupted');return result;
 }finally{await reader.cancel().catch(()=>{});reader.releaseLock();}
}
