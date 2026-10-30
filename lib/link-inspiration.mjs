import {socialVideoUrl,VideoError} from './video-itinerary.mjs';
// Reference-only handoff to the existing planner. The URL is never fetched and
// is never evidence that its video/audio was analysed. Preserve the user's text.
export function linkInspiration(instructions,url,language='id'){
 if(typeof instructions!=='string')throw new VideoError('INVALID_INPUT');
 const source=socialVideoUrl(url).url;
 const note=language==='en'?`Travel inspiration: ${source}. The linked video has not been analysed. Use the destinations and preferences I confirm; research current travel details separately.`:`Inspirasi perjalanan: ${source}. Video dari tautan belum dianalisis. Gunakan tujuan dan preferensi yang saya konfirmasi; teliti informasi perjalanan terkini secara terpisah.`;
 const combined=instructions.includes(note)?instructions.trim():[instructions.trim(),note].filter(Boolean).join('\n\n');
 if(combined.length>1000||new TextEncoder().encode(combined).length>3000)throw new VideoError('INSPIRATION_TOO_LONG');
 return combined;
}
