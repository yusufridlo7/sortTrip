// Presentation decisions never infer arrival from the clock or perform network work.
export function guidePin(checkpoints,progress,reached,active){
 if(!active)return {id:null,basis:'inactive'};
 const last=[...reached].reverse().find(id=>checkpoints.some(c=>c.id===id));
 if(last)return {id:last,basis:'confirmed'};
 return {id:progress.current?.id||null,basis:progress.current?'schedule':'not_started'};
}
export function checkpointDetail(trip,checkpoints,id){
 const index=checkpoints.findIndex(c=>c.id===id);if(index<0)return null;
 const checkpoint=checkpoints[index],item=trip.items.find(i=>i.id===id);
 const later=checkpoints.slice(index+1).filter(c=>c.at!==null),nextStop=later.find(c=>['Wisata','Penginapan','Pesawat'].includes(c.category))||null;
 const nextTransport=later.find(c=>c.category==='Transportasi')||null;
 return {checkpoint,item,nextStop,missingConnector:!!nextStop&&(!nextTransport||nextTransport.at>=nextStop.at),nextTransport,nextItem:nextTransport?trip.items.find(i=>i.id===nextTransport.id):null};
}
export function guideConversation(value){
 if(value===undefined)return [];
 if(!Array.isArray(value)||value.length>6||value.some(m=>!m||!['user','assistant'].includes(m.role)||typeof m.text!=='string'||m.text.length>1200||Object.keys(m).some(k=>!['role','text'].includes(k))))throw Error('GUIDE_CONVERSATION_INVALID');
 return value.map(m=>({role:m.role,text:m.text}));
}
