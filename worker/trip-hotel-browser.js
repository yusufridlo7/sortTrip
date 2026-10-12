// Public, anonymous hotel search only. Never log HTML, cookies or booking tokens.
import {openSupplierBrowser} from './supplier-browser.js';
export function hotelPropertyUrl(value){
 try{const u=new URL(value);if(u.protocol!=='https:'||u.port||!['www.trip.com','id.trip.com'].includes(u.hostname)||u.username||u.password||!/^\/hotels\/[a-z0-9-]+-hotel-detail-\d+\/[a-z0-9-]+\/?$/.test(u.pathname))return null;return u.origin+u.pathname.replace(/\/?$/,'/');}catch{return null;}
}
const dateValid=s=>/^\d{4}-\d{2}-\d{2}$/.test(s||'')&&Number.isFinite(Date.parse(s))&&new Date(s).toISOString().slice(0,10)===s;
const normalize=v=>String(v||'').toLowerCase().replace(/\bat\b|@/g,' ').replace(/[^a-z0-9]+/g,' ').trim();
// Report only known public path shapes, never URL query strings or opaque identifiers.
export function navigationKind(value){
 try{const u=new URL(value),p=u.pathname.toLowerCase();if(/captcha|verify|challenge|security|robot/.test(p))return 'ACCESS_CHECK';if(p==='/')return 'HOME';if(p==='/hotels/')return 'HOTEL_LANDING';if(/^\/hotels\/(?:detail|detailpage)\/?$/.test(p))return 'HOTEL_DETAIL';if(/^\/hotels\/(?:list|search)\/?$/.test(p))return 'HOTEL_SEARCH';if(p.startsWith('/hotels/'))return 'HOTEL_OTHER';if(/^\/w\//.test(p))return 'W_GATE';if(/^\/m\//.test(p))return 'MOBILE_PATH';if(/^\/pages\//.test(p))return 'PAGES';if(/^\/(?:account|login|passport)\//.test(p))return 'ACCOUNT';return 'OTHER_PATH';}catch{return 'INVALID';}
}
export function datedHotelUrl(target,people){
 const base=hotelPropertyUrl(target.sourceUrl);
 if(!base||!dateValid(target.checkin)||!dateValid(target.checkout)||target.checkin>=target.checkout||!Number.isInteger(people)||people<1||people>2||target.rooms!==1)return null;
 const u=new URL(base),indonesian=u.hostname==='id.trip.com';u.search=new URLSearchParams({curr:'IDR',[indonesian?'checkin':'checkIn']:target.checkin,[indonesian?'checkout':'checkOut']:target.checkout,crn:'1',adult:String(people),children:'0'}).toString();return u.href;
}
// Reject conflicting aliases rather than accepting a stale date left in a redirect URL.
function searchValue(url,key){
 const values=[...url.searchParams].filter(([k])=>k.toLowerCase()===key.toLowerCase()).map(([,v])=>v);
 return values.length&&new Set(values).size===1?values[0]:null;
}
function visibleDateMatches(label,date,locale){
 if(typeof label!=='string')return false;
 const expected=new Intl.DateTimeFormat(locale,{day:'numeric',month:'short',timeZone:'UTC'}).format(new Date(date+'T12:00:00Z'));
 // Search inputs show weekday, then day/month; never accept an unrelated stay of equal duration.
 return label.replace(/^[^,]+,\s*/,'').trim().toLowerCase()===expected.toLowerCase();
}
export function hotelNavigationAllowed(value,targetUrl){
 try{if(!hotelPropertyUrl(targetUrl))return false;const u=new URL(value),target=new URL(targetUrl);
  if(u.protocol!=='https:'||u.port||u.username||u.password||!['id.trip.com','www.trip.com'].includes(u.hostname))return false;
  if(u.pathname==='/hotels/')return u.hostname===target.hostname;
  return hotelPropertyUrl(u.href)===hotelPropertyUrl(target.href);
 }catch{return false;}
}
export function checkedHotelQuote(target,people,observation){
 const expected=datedHotelUrl(target,people);if(!expected||!observation)return null;
 let u;try{u=new URL(observation.url);}catch{return null;}
 if(hotelPropertyUrl(u.href)!==hotelPropertyUrl(expected)||['curr','checkIn','checkOut','crn','adult','children'].some(k=>searchValue(u,k)!==searchValue(new URL(expected),k)))return null;
 if(u.hostname==='id.trip.com'&&(!visibleDateMatches(observation.checkinLabel,target.checkin,'id-ID')||!visibleDateMatches(observation.checkoutLabel,target.checkout,'id-ID')))return null;
 const guest=String(observation.guests||'').match(/^1 (?:room|kamar), ([12]) (?:adults?|dewasa), 0 (?:children|anak)$/i);
 if(normalize(observation.hotel)!==normalize(target.title)||observation.nights!==Math.round((Date.parse(target.checkout)-Date.parse(target.checkin))/86400000)||!guest||Number(guest[1])!==people)return null;
 const offers=(Array.isArray(observation.offers)?observation.offers:[]).filter(x=>x&&typeof x.roomType==='string'&&x.roomType.trim()&&x.roomType.length<200&&typeof x.text==='string'&&x.text.length<2000&&!/first booking|sign in|member.only|login|coupon|pemesanan pertama|pengguna baru|khusus anggota|khusus member|kode promo|kupon|masuk untuk/i.test(x.text)&&[...x.text.matchAll(/\b([12]) (?:adults?|dewasa)\b/gi)].some(m=>Number(m[1])>=people)).flatMap(x=>{
  // Only an explicitly inclusive total; never the crossed-out or per-night display price.
  const match=x.text.match(/Total \(incl\. taxes & fees\):\s*(?:IDR|Rp)\s*([0-9][0-9.,]*)/i)
   ||x.text.match(/Total price:\s*IDR\s*([0-9][0-9.,]*)\s*\n1 room \u00d7 (\d+) nights? incl\. taxes & fees/i)
   ||x.text.match(/Total harga:\s*Rp\s*([0-9][0-9.,]*)\s*\n(?:1 kamar \u00d7 (\d+) malam\s*)?Termasuk pajak & biaya lainnya/i);
  if(!match||match[2]&&Number(match[2])!==observation.nights)return [];
  const number=match[1];if(!/^(?:[0-9]+|[0-9]{1,3}(?:\.[0-9]{3})+|[0-9]{1,3}(?:,[0-9]{3})+)$/.test(number))return [];
  const amount=Number(number.replace(/[.,]/g,''));if(!Number.isFinite(amount)||amount<=0||amount>1e9)return [];
  const policy=x.text.match(/Non-refundable|Tidak dapat di-refund|Free Cancellation[^\n]*|Pembatalan Gratis[^\n]*/i)?.[0];if(!policy)return [];
  return [{amount,roomType:x.roomType,policy,evidence:match[0]}];
 }).sort((a,b)=>a.amount-b.amount);
 const offer=offers[0];if(!offer)return null;
 return {id:target.id,amountIDR:offer.amount,basis:'stay_total',sourceUrl:expected,quote:offer.evidence,checkedAt:new Date().toISOString(),scope:'dated',provider:'Trip.com',checkin:target.checkin,checkout:target.checkout,adults:people,rooms:1,roomType:offer.roomType,policy:offer.policy,taxesIncluded:true};
}
export async function browserHotelPrices(q,targets,env,deadline=Date.now()+45000,diagnostics={},launchBrowser){
 if(env.HOTEL_BROWSER_ENABLED!=='true'||!env.HOTEL_BROWSER){console.info('HOTEL_BROWSER_NOT_READY');return [];}
 const hotels=targets.filter(t=>t.category==='Penginapan'&&datedHotelUrl(t,q.people)).slice(0,3);
 if(!hotels.length||deadline-Date.now()<5000){console.info('HOTEL_BROWSER_NO_TARGETS');return [];}
 let browser;console.info('HOTEL_BROWSER_START');
 try{
  browser=await openSupplierBrowser(env.HOTEL_BROWSER,launchBrowser);console.info('HOTEL_BROWSER_LAUNCHED');
  const quotes=[];
  for(const target of hotels){
   const remaining=Math.min(25000,deadline-Date.now());if(remaining<5000)break;
   const page=await browser.context.newPage();page.setDefaultTimeout(remaining);let stage='HOTEL_BROWSER_NAVIGATION_FAILED',accessBlocked=false,notifyAccess;
   const accessGate=new Promise(resolve=>{notifyAccess=resolve});
   try{
    // Restrict main-document navigation. No login, reserve, checkout or anti-bot bypass.
    await page.route('**/*',async route=>{const r=route.request();if(r.isNavigationRequest()&&r.frame()===page.mainFrame()&&!hotelNavigationAllowed(r.url(),datedHotelUrl(target,q.people))){try{const u=new URL(r.url());if(['us.trip.com','uk.trip.com','my.trip.com'].includes(u.hostname))console.info('HOTEL_BROWSER_MARKET_REDIRECT_BLOCKED');else console.info('HOTEL_BROWSER_OTHER_NAVIGATION_BLOCKED');console.info(u.hostname==='www.trip.com'?'HOTEL_BROWSER_REDIRECT_WWW':u.hostname==='m.trip.com'?'HOTEL_BROWSER_REDIRECT_MOBILE':/(^|\.)trip\.com$/.test(u.hostname)?'HOTEL_BROWSER_REDIRECT_TRIP_DOMAIN':'HOTEL_BROWSER_REDIRECT_EXTERNAL');const kind=navigationKind(u.href); console.info('HOTEL_BROWSER_REDIRECT_'+kind); if(/(^|\.)trip\.com$/.test(u.hostname)&&['ACCOUNT','ACCESS_CHECK'].includes(kind)){accessBlocked=true;diagnostics.hotelAccessRequired=true;notifyAccess();}}catch{}return route.abort();}return route.continue();});
    // Enter the ordinary public hotel page first to initialize this anonymous visit.
    if(quotes.length===0&&deadline-Date.now()>35000)await page.goto(new URL(target.sourceUrl).origin+'/hotels/?curr=IDR',{waitUntil:'domcontentloaded',timeout:10000}).catch(()=>{});
    if(accessBlocked)throw Error('HOTEL_ACCESS_REQUIRED');
    const main=await page.goto(datedHotelUrl(target,q.people),{waitUntil:'domcontentloaded',timeout:Math.min(25000,deadline-Date.now())});
    const status=main?.status();if(Number.isInteger(status))console.info('HOTEL_BROWSER_HTTP_'+status);
    stage='HOTEL_BROWSER_PRICE_NOT_RENDERED';
    // Room inventory may be lazy-loaded below the property summary.
    await page.getByRole('region',{name:/^(Room selection|Pemilihan kamar)$/}).scrollIntoViewIfNeeded?.({timeout:Math.max(1,Math.min(5000,deadline-Date.now()))}).catch(()=>{});
    await Promise.race([page.getByRole('region',{name:/^(Room selection|Pemilihan kamar)$/}).getByText(/Total (?:\(incl\. taxes & fees\)|price|harga):\s*(?:IDR|Rp)/).first().waitFor({timeout:Math.max(1,Math.min(25000,deadline-Date.now()))}),accessGate.then(()=>{throw Error('HOTEL_ACCESS_REQUIRED')})]);
    stage='HOTEL_BROWSER_OBSERVATION_FAILED';
    const observation=await page.evaluate(()=>{
     const region=document.querySelector('[role="region"][aria-label="Room selection"], [role="region"][aria-label="Pemilihan kamar"]');
     const guest=Array.from(document.querySelectorAll('[role="button"],button')).map(e=>e.innerText?.trim()).find(t=>/^1 (?:room|kamar), [12] (?:adults?|dewasa), 0 (?:children|anak)$/i.test(t||''));
     const night=Array.from(document.querySelectorAll('[role="region"][aria-label="Search properties"] *, [role="region"][aria-label="Cari akomodasi"] *')).map(e=>e.innerText?.trim()).find(t=>/^\d+ (?:nights?|malam)$/i.test(t||''));
     const offers=Array.from(region?.querySelectorAll('[class*="commonRoomCard__"]')||[]).flatMap(card=>{const roomType=card.querySelector('[class*="baseRoom-verticalTitle_text__"]')?.innerText?.trim();return Array.from(card.querySelectorAll('[class*="saleRoomItemBox__"]')).map(offer=>({roomType,text:offer.innerText?.slice(0,1800)}));});
     return {url:location.href,hotel:document.querySelector('#destinationInput')?.value,checkinLabel:document.querySelector('#checkInInput')?.value,checkoutLabel:document.querySelector('#checkOutInput')?.value,guests:guest,nights:parseInt(night||'',10),offers};
    });
    const quote=checkedHotelQuote(target,q.people,observation);if(quote){quotes.push(quote);diagnostics.onHotelObservation?.(target.id,{...observation,url:quote.sourceUrl});console.info('HOTEL_BROWSER_QUOTE_OK');}else console.info('HOTEL_BROWSER_CONTEXT_MISMATCH');
   }catch{
    diagnostics.hotelUnavailableStage=accessBlocked?'HOTEL_BROWSER_ACCESS_REQUIRED':stage;
    console.info(diagnostics.hotelUnavailableStage);
    try{const signal=await page.evaluate(()=>{const t=document.body?.innerText||'',r=document.querySelector('[role="region"][aria-label="Room selection"], [role="region"][aria-label="Pemilihan kamar"]')?.innerText||'';return {challenge:/captcha|verify you are human|access denied|unusual traffic|checking your browser|security check|just a moment/i.test(t),hotel:!!document.querySelector('#destinationInput'),price:/Total (?:price|\(incl\. taxes & fees\))/.test(r),codes:{HOTEL_BROWSER_EMPTY_BODY:t.trim().length===0,HOTEL_BROWSER_PUBLIC_TRIP_TEXT:/trip\.com/i.test(t),HOTEL_BROWSER_JS_REQUIRED:/enable javascript|javascript is required|javascript disabled/i.test(t),HOTEL_BROWSER_ACCESS_CHECK:/robot|automated|verification|blocked|forbidden|security|access denied/i.test(t),HOTEL_BROWSER_SERVICE_ERROR:/something went wrong|temporarily unavailable|not found|page unavailable|sorry|error/i.test(t),HOTEL_BROWSER_IFRAME_DOCUMENT:!!document.querySelector('iframe'),HOTEL_BROWSER_SCRIPTS_PRESENT:!!document.querySelector('script'),HOTEL_BROWSER_NO_TITLE:!document.title,HOTEL_BROWSER_ON_HOTEL_PATH:/hotel-detail-/.test(location.pathname),HOTEL_BROWSER_ON_HOTEL_LANDING:location.pathname==='/hotels/',HOTEL_BROWSER_GLOBAL_TOTAL:/Total (?:price|\(incl\. taxes & fees\))/.test(t),HOTEL_BROWSER_TEXT_ROOMS:/choose your room|select rooms|room details/i.test(t),HOTEL_BROWSER_TEXT_SEARCH:/search|destination/i.test(t),HOTEL_BROWSER_ROOM_CARDS:!!document.querySelector('[class*="commonRoomCard__"]')}};});console.info(signal.challenge?'HOTEL_BROWSER_CHALLENGE':signal.price?'HOTEL_BROWSER_TOTAL_PRESENT':signal.hotel?'HOTEL_BROWSER_HOTEL_WITHOUT_TOTAL':'HOTEL_BROWSER_NO_HOTEL_PAGE');for(const [code,found] of Object.entries(signal.codes||{}))if(found)console.info(code);}catch{}
   }finally{await page.close().catch(()=>{});}
   if(accessBlocked)break;
  }
  return quotes;
 }catch{console.info('HOTEL_BROWSER_LAUNCH_FAILED');return [];}finally{if(browser)await browser.close().catch(()=>{});}
}
