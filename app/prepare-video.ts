import {inspectMp4,VIDEO_LIMITS} from '../lib/video-itinerary.mjs';
import {jpegDimensions} from '../lib/prepared-media.mjs';
// Local browser-native decode only: no remote URLs, media cache, persistence,
// audio capture or third-party decoder. Failure offers the transcript path.
export async function prepareVideo(file:File,signal:AbortSignal){
 inspectMp4(new Uint8Array(await file.arrayBuffer()),file.type);signal.throwIfAborted();
 const video=document.createElement('video'),canvas=document.createElement('canvas'),url=URL.createObjectURL(file);
 video.preload='metadata';video.muted=true;video.playsInline=true;
 const bounded=AbortSignal.any([signal,AbortSignal.timeout(20000)]);
 function event(name:string,action:()=>void){return new Promise<void>((resolve,reject)=>{
  const done=()=>{clear();resolve();},fail=()=>{clear();reject(Error('VIDEO_DECODE_FAILED'));},abort=()=>{clear();reject(new DOMException('Aborted','AbortError'));};
  const clear=()=>{video.removeEventListener(name,done);video.removeEventListener('error',fail);bounded.removeEventListener('abort',abort);};
  if(bounded.aborted){abort();return;}video.addEventListener(name,done,{once:true});video.addEventListener('error',fail,{once:true});bounded.addEventListener('abort',abort,{once:true});action();
 });}
 try{
  await event('loadedmetadata',()=>{video.src=url;});
  if(!Number.isFinite(video.duration)||video.duration<=0||video.duration>VIDEO_LIMITS.seconds||video.videoWidth<1||video.videoHeight<1||video.videoWidth>4096||video.videoHeight>2160)throw Error('UNSUPPORTED_MEDIA');
  const scale=Math.min(320/video.videoWidth,320/video.videoHeight,1);canvas.width=Math.max(1,Math.round(video.videoWidth*scale));canvas.height=Math.max(1,Math.round(video.videoHeight*scale));
  const ctx=canvas.getContext('2d');if(!ctx)throw Error('VIDEO_DECODE_FAILED');const frames=[];
  for(const fraction of [.15,.5,.85]){
   const seconds=Number((video.duration*fraction).toFixed(3));if(frames.length&&seconds<=frames.at(-1)!.seconds)continue;
   await event('seeked',()=>{video.currentTime=seconds;});bounded.throwIfAborted();ctx.drawImage(video,0,0,canvas.width,canvas.height);
   const image=canvas.toDataURL('image/jpeg',.65);jpegDimensions(Uint8Array.from(atob(image.slice(23)),c=>c.charCodeAt(0)));frames.push({seconds,image});
  }
  return {frames,durationSeconds:video.duration,audioIncluded:false as const};
 }catch(error){if(bounded.aborted&&!signal.aborted)throw Error('VIDEO_DECODE_FAILED');throw error;}
 finally{video.pause();video.removeAttribute('src');video.load();URL.revokeObjectURL(url);canvas.width=canvas.height=0;}
}
