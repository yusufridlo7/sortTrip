import baseId from '../app/i18n/locales/id.json' with {type:'json'};
import baseEn from '../app/i18n/locales/en.json' with {type:'json'};
import support from '../app/i18n/locales/support.json' with {type:'json'};
const id={...baseId,...support.id},en={...baseEn,...support.en};
export const normalizeLanguage=value=>value==='en'?'en':'id';
export const requestLanguage=request=>normalizeLanguage(new URL(request.url).searchParams.get('language')||request.headers.get('X-SortTrip-Language'));
export const languageInstruction=q=>` Write every narrative summary, note, transport explanation and budget description in ${normalizeLanguage(q.language)==='en'?'English':'Indonesian'}. Preserve place names, addresses, prices, currencies, source URLs and structured identifiers/category/kind values exactly. Language is independent of currency.`;
const reverse=new Map([...Object.entries(id),...Object.entries(en)].map(([key,value])=>[value.trim(),key]));
export function translateMessage(message,language='id'){
 if(typeof message!=='string')return message;
 if(Object.hasOwn(id,message))return normalizeLanguage(language)==='en'?en[message]:id[message];
 const key=reverse.get(message.trim());if(key)return message.replace(message.trim(),normalizeLanguage(language)==='en'?en[key]:id[key]);
 if(normalizeLanguage(language)==='id')return message;
 // Fixed server diagnostics may insert an HTTP status or validation code.
 const inserts=[['Hasil AI belum lolos pemeriksaan (','msg_0296'],['Pemeriksaan status Midtrans gagal (HTTP ','msg_0228'],['Midtrans menolak permintaan (HTTP ','msg_0325']];
 for(const [prefix,key] of inserts)if(message.startsWith(prefix)){const m=message.slice(prefix.length).match(/^(\d{3}|[A-Z_]+)(\).*?)$/);if(m)return en[key]+m[1]+translateMessage(m[2],language);}
 return message;
}
export async function localizedResponse(response,language){
 if(!response.headers.get('Content-Type')?.includes('application/json'))return response;
 const data=await response.json();if(data&&typeof data==='object')for(const key of ['error','message','checkoutReason'])if(typeof data[key]==='string')data[key]=translateMessage(data[key],language);
 const headers=new Headers(response.headers);headers.delete('content-length');headers.set('Content-Language',normalizeLanguage(language));if(!headers.get('Vary')?.toLowerCase().includes('x-sorttrip-language'))headers.append('Vary','X-SortTrip-Language');return Response.json(data,{status:response.status,headers});
}
export function priceWatchEmail(n,language){const english=normalizeLanguage(language)==='en';const money=v=>new Intl.NumberFormat(english?'en-GB':'id-ID',{style:'currency',currency:'IDR',maximumFractionDigits:0}).format(v);return {subject:english?'SortTrip: flight price dropped':'SortTrip: harga penerbangan turun',text:english?`The indicative fare for your watched route and dates dropped from ${money(n.old_price)} to ${money(n.price)} / 1 adult. Airlines and times may differ. Baggage and fare rules have not been compared. Check the final price with the provider.\n${n.booking_url}\n\nOpen SortTrip to view notifications or disable Price Watch emails:\nhttps://sorttrip.yusufridlo7.workers.dev/`:`Harga indikatif untuk rute dan tanggal yang Anda pantau turun dari ${money(n.old_price)} menjadi ${money(n.price)} / 1 dewasa. Maskapai dan jam dapat berbeda. Bagasi dan ketentuan tarif belum dibandingkan. Periksa harga akhir di penyedia.\n${n.booking_url}\n\nBuka SortTrip untuk melihat notifikasi atau mematikan email di Price Watch:\nhttps://sorttrip.yusufridlo7.workers.dev/`};}
