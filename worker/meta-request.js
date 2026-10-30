import {VideoError} from '../lib/video-itinerary.mjs';

// An environment value may shorten this window, never extend it.
export const META_HARD_CUTOFF='2026-11-04T17:00:00Z';
const hardDeadline=Date.parse(META_HARD_CUTOFF);
export function assertMetaActive(env,now=Date.now()){
 if(now>=hardDeadline)throw new VideoError('META_AI_EXPIRED',503);
 const value=env?.META_AI_CUTOFF_AT;
 const deadline=typeof value==='string'&&/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:Z|[+-]\d{2}:\d{2})$/.test(value)?Date.parse(value):NaN;
 const calendarValid=Number.isFinite(deadline)&&new Date(value.slice(0,10)).toISOString().slice(0,10)===value.slice(0,10)&&Number(value.slice(11,13))<24;
 if(!calendarValid||deadline>hardDeadline)throw new VideoError('META_AI_CUTOFF_INVALID',503);
 if(now>=deadline||now>=hardDeadline)throw new VideoError('META_AI_EXPIRED',503);
 return deadline;
}

// All Meta egress (including metadata/token counts) goes through this gate.
// No retries, redirects, alternate provider or deferred callback.
export function metaRequest(env,url,init={},fetcher=fetch){
 const deadline=assertMetaActive(env);
 const target=new URL(url);
 if(target.origin!=='https://api.meta.ai'||target.username||target.password||!target.pathname.startsWith('/v1/'))throw new VideoError('META_ENDPOINT_DENIED',503);
 const signal=AbortSignal.any([AbortSignal.timeout(Math.max(1,deadline-Date.now())),...(init.signal?[init.signal]:[])]);
 signal.throwIfAborted();
 // Recheck immediately before dispatch; a previous await may span the cutoff.
 assertMetaActive(env);
 return Promise.resolve(fetcher(target.href,{...init,redirect:'manual',signal})).catch(error=>{assertMetaActive(env);throw error;});
}
