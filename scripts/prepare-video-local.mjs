// Nonproduction/offline media QA helper, not a deployed Worker processor.
// Uses the existing bundled FFmpeg; no download, upload, model or web server.
import {readFile,stat,mkdtemp,rm} from 'node:fs/promises';
import {resolve,join,dirname,sep} from 'node:path';
import {fileURLToPath} from 'node:url';
import {execFile} from 'node:child_process';
import {inspectMp4} from '../lib/video-itinerary.mjs';
import {jpegDimensions} from '../lib/prepared-media.mjs';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const executable=join(root,'artifacts/tutorial-tools/imageio_ffmpeg/binaries/ffmpeg-win-x86_64-v7.1.exe');
function run(args){return new Promise((resolve,reject)=>execFile(executable,['-hide_banner','-loglevel','error','-nostdin','-max_alloc','33554432','-threads','1',...args],{windowsHide:true,timeout:15000,maxBuffer:8192},error=>error?reject(Error('LOCAL_DECODE_FAILED')):resolve()));}
export async function prepareLocalVideo(input){
 input=resolve(input instanceof URL?fileURLToPath(input):input);if((await stat(input)).size>4194304)throw Error('TOO_LARGE');const source=await readFile(input),inspection=inspectMp4(source,'video/mp4');
 const scratch=await mkdtemp(join(root,'artifacts/video-qa-'));
 const base=['-protocol_whitelist','file,pipe','-format_whitelist','mov,mp4,m4a,3gp,3g2,mj2','-i',input];
 try{
  const frames=[];
  for(const fraction of [.15,.5,.85]){const seconds=Number((inspection.durationSeconds*fraction).toFixed(3)),path=join(scratch,`frame-${frames.length}.jpg`);await run([...base,'-ss',String(seconds),'-frames:v','1','-vf','scale=320:180:force_original_aspect_ratio=decrease','-q:v','5','-an','-y',path]);if((await stat(path)).size>32768)throw Error('FRAME_TOO_LARGE');const bytes=await readFile(path);frames.push({seconds,bytes:bytes.length,...jpegDimensions(bytes)});}
  let audio={status:'unavailable',bytes:0};const audioPath=join(scratch,'audio.wav');
  try{await run([...base,'-t','60','-map','0:a:0','-vn','-ac','1','-ar','16000','-c:a','pcm_s16le','-fs','1920100','-y',audioPath]);const size=(await stat(audioPath)).size;if(size>44&&size<=1920100)audio={status:'extracted-local-only',bytes:size};}catch{/* no usable audio: explicit transcript fallback */}
  return {fixture:input.endsWith('synthetic-qa.mp4'),durationSeconds:inspection.durationSeconds,frames,audio,uploaded:false,modelCalled:false,temporaryMediaDeleted:true};
 }finally{
  // Resolve and validate the absolute temporary directory before recursive removal.
  const target=resolve(scratch);if(!target.startsWith(join(root,'artifacts')+sep)||!target.split(sep).at(-1).startsWith('video-qa-'))throw Error('UNSAFE_CLEANUP_PATH');
  await rm(target,{recursive:true,force:true});
 }
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 if(process.argv.length!==3)throw Error('Usage: node scripts/prepare-video-local.mjs <authorized-mp4>');
 console.log(JSON.stringify(await prepareLocalVideo(process.argv[2]),null,2));
}
