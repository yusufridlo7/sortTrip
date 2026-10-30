import {socialVideoUrl,boundedBytes} from '../lib/video-itinerary.mjs';
// Public oEmbed metadata only. Never downloads video/audio, executes embed HTML,
// forwards account headers, or follows redirects outside the explicit host list.
export async function tiktokReference(prompt,{fetcher=fetch,signal}={}){
 const candidate=prompt.match(/https:\/\/(?:vt\.|vm\.|www\.)?tiktok\.com\/[^\s<>]+/i)?.[0]?.replace(/[),.;]+$/,'');
 if(!candidate)return {status:'none',caption:''};
 try{
  let source=socialVideoUrl(candidate);if(source.provider!=='tiktok')return {status:'unavailable',caption:''};
  const bounded=AbortSignal.any([AbortSignal.timeout(6000),...(signal?[signal]:[])]);
  for(let hop=0;hop<3&&(['vt.tiktok.com','vm.tiktok.com'].includes(new URL(source.url).hostname)||new URL(source.url).pathname.startsWith('/t/'));hop++){
   const r=await fetcher(source.url,{method:'GET',redirect:'manual',signal:bounded,headers:{Accept:'text/html'}});await r.body?.cancel();
   if(![301,302,303,307,308].includes(r.status))return {status:'unavailable',caption:''};
   const location=r.headers.get('Location');if(!location)return {status:'unavailable',caption:''};
   source=socialVideoUrl(new URL(location,source.url).href);
   if(source.provider!=='tiktok')return {status:'unavailable',caption:''};
  }
  if(new URL(source.url).hostname!=='www.tiktok.com')return {status:'unavailable',caption:''};
  const endpoint=new URL('https://www.tiktok.com/oembed');endpoint.searchParams.set('url',source.url);
  const response=await fetcher(endpoint.href,{method:'GET',redirect:'manual',signal:bounded,headers:{Accept:'application/json'}});
  if(!response.ok){await response.body?.cancel();return {status:'unavailable',caption:''};}
  const data=JSON.parse(new TextDecoder().decode(await boundedBytes(response.body,24000,bounded)));
  // Current oEmbed responses can omit title. Embed markup is never scraped as
  // a fallback: absence is a clarification case, not evidence of video content.
  if(typeof data.title!=='string'||!data.title.trim()||data.title.length>2000)return {status:'unavailable',caption:''};
  return {status:'caption',caption:data.title,url:source.url};
 }catch{return {status:'unavailable',caption:''};}
}
