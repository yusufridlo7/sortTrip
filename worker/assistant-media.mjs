export const MEDIA_LIMITS=Object.freeze({images:3,videos:1,imageBytes:512000,videoBytes:4000000,totalBytes:5500000,maxSide:1280,videoSeconds:60,requestBytes:7500000});
export class MediaError extends Error{constructor(code,status=400){super(code);this.code=code;this.status=status;}}
const bad=()=>{throw new MediaError('AI_MEDIA_INVALID');};
function jpegSize(b){
 if(b[0]!==255||b[1]!==216||b.at(-2)!==255||b.at(-1)!==217)return bad();
 for(let p=2;p+4<b.length;){
  if(b[p++]!==255)return bad();while(b[p]===255)p++;const marker=b[p++];
  if(marker===0xda||marker===0xd9)break;if(marker===0x01||marker>=0xd0&&marker<=0xd7)continue;
  const n=b[p]*256+b[p+1];if(n<2||p+n>b.length)return bad();
  if([0xc0,0xc1,0xc2].includes(marker)){if(n<8)return bad();return {height:b[p+3]*256+b[p+4],width:b[p+5]*256+b[p+6]};}p+=n;
 }return bad();
}
function videoDuration(b){
 const v=new DataView(b.buffer,b.byteOffset,b.byteLength),tag=p=>String.fromCharCode(...b.slice(p,p+4));let ftyp=false,duration;
 function atoms(start,end,depth=0){
  if(depth>3)return bad();for(let p=start;p<end;){
   if(p+8>end)return bad();const n=v.getUint32(p),kind=tag(p+4);if(n<8||p+n>end)return bad();
   if(kind==='ftyp'){if(n<16||!['isom','iso2','mp41','mp42','avc1','M4V '].includes(tag(p+8)))return bad();ftyp=true;}
   if(kind==='moov')atoms(p+8,p+n,depth+1);
   if(kind==='mvhd'){
    const s=p+8,version=b[s];if(![0,1].includes(version)||s+(version?32:20)>p+n)return bad();
    const timescale=v.getUint32(s+(version?20:12));const ticks=version?Number(v.getBigUint64(s+24)):v.getUint32(s+16);
    if(!timescale||!Number.isSafeInteger(ticks)||duration!==undefined)return bad();duration=ticks/timescale;
   }p+=n;
  }
 }atoms(0,b.length);if(!ftyp||!Number.isFinite(duration)||duration<=0||duration>MEDIA_LIMITS.videoSeconds)return bad();return duration;
}
export function validateAssistantMedia(values,consent){
 if(values===undefined)return [];if(!Array.isArray(values)||values.length>4)return bad();if(!values.length)return [];
 if(consent!==true)throw new MediaError('AI_MEDIA_CONSENT_REQUIRED');let images=0,videos=0,total=0;
 return values.map(x=>{
  if(!x||typeof x.data!=='string'||!x.data.length||x.data.length>Math.ceil(MEDIA_LIMITS.totalBytes/3)*4||(x.data.length%4!==0||!/^[A-Za-z0-9+/]*={0,2}$/.test(x.data)))return bad();
  const bytes=Uint8Array.from(atob(x.data),c=>c.charCodeAt(0));total+=bytes.length;
  if(total>MEDIA_LIMITS.totalBytes)throw new MediaError('AI_MEDIA_TOO_LARGE',413);
  if(x.kind==='image'&&x.mime==='image/jpeg'){
   if(++images>MEDIA_LIMITS.images||bytes.length>MEDIA_LIMITS.imageBytes)throw new MediaError('AI_MEDIA_TOO_LARGE',413);
   const size=jpegSize(bytes);if(!size.width||!size.height||Math.max(size.width,size.height)>MEDIA_LIMITS.maxSide)return bad();
  }else if(x.kind==='video'&&x.mime==='video/mp4'){
   if(++videos>MEDIA_LIMITS.videos||bytes.length>MEDIA_LIMITS.videoBytes)throw new MediaError('AI_MEDIA_TOO_LARGE',413);videoDuration(bytes);
  }else return bad();
  // Never forward filenames, client metadata, URLs, or arbitrary fields.
  return {kind:x.kind,mime:x.mime,data:x.data};
 });
}
export async function readAssistantBody(request,maxBytes=32000){
 if(Number(request.headers.get('Content-Length'))>maxBytes)throw new MediaError('AI_MEDIA_TOO_LARGE',413);
 const reader=request.body?.getReader();if(!reader)return '';const chunks=[];let size=0;
 try{while(true){const {done,value}=await reader.read();if(done)break;size+=value.byteLength;if(size>maxBytes){await reader.cancel();throw new MediaError('AI_MEDIA_TOO_LARGE',413);}chunks.push(value);}}
 finally{reader.releaseLock();}
 const bytes=new Uint8Array(size);let p=0;for(const chunk of chunks){bytes.set(chunk,p);p+=chunk.length;}return new TextDecoder('utf-8',{fatal:true}).decode(bytes);
}
export function mediaInput(input,media){return [{role:'user',content:[{type:'input_text',text:input},...media.map(m=>m.kind==='image'?{type:'input_image',image_url:'data:'+m.mime+';base64,'+m.data}:{type:'input_video',video_url:'data:'+m.mime+';base64,'+m.data})]}];}
