import {MEDIA_LIMITS,validateAssistantMedia} from '../worker/assistant-media.mjs';
export const mediaDataURL=file=>new Promise((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(String(reader.result));reader.onerror=()=>reject(Error('media_invalid'));reader.readAsDataURL(file);});
async function jpeg(file){
 if(!['image/jpeg','image/png','image/webp'].includes(file.type)||file.size>10000000)throw Error('media_invalid');
 const image=await createImageBitmap(file);try{
  if(image.width*image.height>40000000)throw Error('media_invalid');
  const scale=Math.min(1,MEDIA_LIMITS.maxSide/image.width,MEDIA_LIMITS.maxSide/image.height),canvas=document.createElement('canvas');canvas.width=Math.max(1,Math.round(image.width*scale));canvas.height=Math.max(1,Math.round(image.height*scale));
  const ctx=canvas.getContext('2d');if(!ctx)throw Error('media_invalid');ctx.fillStyle='#fff';ctx.fillRect(0,0,canvas.width,canvas.height);ctx.drawImage(image,0,0,canvas.width,canvas.height);
  for(const quality of [.8,.6,.4]){const url=canvas.toDataURL('image/jpeg',quality),data=url.split(',')[1];if(data.length*3/4<=MEDIA_LIMITS.imageBytes)return {kind:'image',mime:'image/jpeg',data};}
  throw Error('media_invalid');
 }finally{image.close();}
}
async function video(file){
 if(file.type!=='video/mp4'||file.size>MEDIA_LIMITS.videoBytes)throw Error('media_invalid');
 const url=URL.createObjectURL(file),el=document.createElement('video');
 try{await new Promise((resolve,reject)=>{const timer=setTimeout(()=>{el.onloadedmetadata=null;el.onerror=null;reject(Error('media_invalid'));},10000);el.preload='metadata';el.onloadedmetadata=()=>{clearTimeout(timer);resolve();};el.onerror=()=>{clearTimeout(timer);reject(Error('media_invalid'));};el.src=url;});
  if(!Number.isFinite(el.duration)||el.duration<=0||el.duration>MEDIA_LIMITS.videoSeconds)throw Error('media_invalid');
  const data=(await mediaDataURL(file)).split(',')[1];return {kind:'video',mime:'video/mp4',data};
 }finally{el.removeAttribute('src');el.load();URL.revokeObjectURL(url);}
}
export async function prepareAssistantFiles(files){
 if(files.length>4)throw Error('media_invalid');const result=[];
 for(const file of files){const media=file.type.startsWith('image/')?await jpeg(file):await video(file);result.push({...media,name:file.name.slice(0,120)});}
 validateAssistantMedia(result,true);return result;
}
