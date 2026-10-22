// Anonymous fixed public search. No cookies, credentials, profile or account actions.
import {chromium} from 'playwright';
import {datedHotelUrl,hotelNavigationAllowed,navigationKind} from '../../worker/trip-hotel-browser.js';
const target={title:'Sleeping Lion Suites',sourceUrl:'https://id.trip.com/hotels/kuala-lumpur-hotel-detail-104384927/sleeping-lion-suites/',checkin:'2026-10-19',checkout:'2026-10-20',rooms:1};
let browser;
try{
 browser=await chromium.launch({headless:true});
 const context=await browser.newContext({locale:'en-US'}),page=await context.newPage();
 let accountRedirect=false,accessCheck=false;
 await page.route('**/*',async route=>{
  const request=route.request();
  if(request.isNavigationRequest()&&request.frame()===page.mainFrame()&&!hotelNavigationAllowed(request.url(),datedHotelUrl(target,1))){
   const kind=navigationKind(request.url());accountRedirect ||= kind==='ACCOUNT';accessCheck ||= kind==='ACCESS_CHECK';return route.abort();
  }
  return route.continue();
 });
 await page.goto('https://id.trip.com/hotels/?curr=IDR',{waitUntil:'domcontentloaded',timeout:10000}).catch(()=>{});
 let status=null;
 if(!accountRedirect&&!accessCheck){
  const response=await page.goto(datedHotelUrl(target,1),{waitUntil:'domcontentloaded',timeout:25000}).catch(()=>null);status=response?.status()??null;
  await page.getByText(/Total (?:harga|price|\(incl\. taxes & fees\)):/).first().waitFor({timeout:15000}).catch(()=>{});
 }
 const signals=await page.evaluate(()=>{
  const visible=e=>!!e.getClientRects().length&&getComputedStyle(e).visibility!=='hidden';
  const body=document.body?.innerText||'';
  return {bodyCharacters:body.trim().length,hotelInputPresent:!!document.querySelector('#destinationInput'),roomCardsPresent:!!document.querySelector('[class*="commonRoomCard__"]'),inclusiveTotalPresent:/Total (?:harga|price|\(incl\. taxes & fees\)):/i.test(body),visiblePasswordField:Array.from(document.querySelectorAll('input[type="password"]')).some(visible),loginRequiredText:/sign in to (?:view|see|continue|access)|log in to (?:view|see|continue|access)|masuk untuk (?:melihat|melanjutkan|mengakses)|login required/i.test(body),signInOption:/sign in|log in|masuk akun/i.test(body),challengeText:/verify you are human|captcha|access denied|unusual traffic|security check/i.test(body)};
 }).catch(()=>({observationUnavailable:true}));
 const inventory=await page.evaluate(()=>{
  const body=document.body?.innerText||'';
  return {rupiahMentions:(body.match(/\bRp\s*[0-9]/g)||[]).length,roomSelectionText:/pemilihan kamar|pilih kamar|room selection|select rooms|choose your room/i.test(body),noAvailabilityText:/tidak tersedia|kamar habis|sold out|no rooms available|no availability/i.test(body),loadingText:/memuat|loading|mencari kamar|searching for rooms/i.test(body),totalsMentioned:/total|pajak|taxes/i.test(body),searchButtonPresent:Array.from(document.querySelectorAll('button')).some(e=>/^(search|cari)$/i.test(e.innerText?.trim()||''))};
 }).catch(()=>({observationUnavailable:true}));
 console.info(JSON.stringify({anonymous:true,httpStatus:status,accountRedirect,accessCheck,pathKind:navigationKind(page.url()),...signals,...inventory}));
}catch{console.info('PLAYWRIGHT_ACCESS_PROBE_UNAVAILABLE');process.exitCode=1;}
finally{await browser?.close().catch(()=>{});}
