import {VideoError,VIDEO_LIMITS} from './video-itinerary.mjs';
// Three base64 JPEGs plus worst-case JSON escaping of the permitted transcript
// and travel request. The transport limit must not depend on activation flags.
export const FRAME_LIMITS=Object.freeze({count:3,bytes:32768,width:320,height:320,totalBody:240000});
// Header/dimension validation only. Browser codecs perform decoding in their
// sandbox; the Worker never executes codecs or fetches media URLs.
export function jpegDimensions(bytes){
 if(!(bytes instanceof Uint8Array)||bytes.length<12||bytes.length>FRAME_LIMITS.bytes||bytes[0]!==255||bytes[1]!==216||bytes.at(-2)!==255||bytes.at(-1)!==217)throw new VideoError('INVALID_FRAME');
 let at=2,dimensions=null,scans=0;
 while(at<bytes.length-2&&scans++<200){
  if(bytes[at++]!==255)throw new VideoError('INVALID_FRAME');let marker=bytes[at++];while(marker===255)marker=bytes[at++];
  if(marker===218)break;
  if(marker===216||marker===217||marker===0||marker>=208&&marker<=215)throw new VideoError('INVALID_FRAME');
  const size=(bytes[at]<<8)|bytes[at+1];if(size<2||at+size>bytes.length)throw new VideoError('INVALID_FRAME');
  if([192,193,194].includes(marker)){if(size<8||dimensions)throw new VideoError('INVALID_FRAME');dimensions={height:(bytes[at+3]<<8)|bytes[at+4],width:(bytes[at+5]<<8)|bytes[at+6]};}
  at+=size;
 }
 if(!dimensions||dimensions.width<1||dimensions.height<1||dimensions.width>320||dimensions.height>320)throw new VideoError('INVALID_FRAME');return dimensions;
}
export function preparedFrames(body){
 if(!body||body.kind!=='frames'||body.consent!==true||!Number.isFinite(body.durationSeconds)||body.durationSeconds<=0||body.durationSeconds>VIDEO_LIMITS.seconds||!Array.isArray(body.frames)||body.frames.length<1||body.frames.length>3)throw new VideoError('INVALID_INPUT');
 let previous=-1;
 const frames=body.frames.map(f=>{
  if(!f||!Number.isFinite(f.seconds)||f.seconds<0||f.seconds>body.durationSeconds||f.seconds<=previous||typeof f.image!=='string'||!/^data:image\/jpeg;base64,[A-Za-z0-9+/]+={0,2}$/.test(f.image)||f.image.length>44000)throw new VideoError('INVALID_FRAME');previous=f.seconds;
  let bytes;try{bytes=Uint8Array.from(atob(f.image.slice(23)),c=>c.charCodeAt(0));}catch{throw new VideoError('INVALID_FRAME');}jpegDimensions(bytes);
  return {seconds:f.seconds,image:f.image};
 });
 const text=body.text??'';if(typeof text!=='string'||new TextEncoder().encode(text).length>VIDEO_LIMITS.text)throw new VideoError('INVALID_INPUT');
 return {frames,text,durationSeconds:body.durationSeconds};
}
