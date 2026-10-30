// Rendering replay ONLY: original app + actual normalized supplier results.
// Auth/database fixtures, all API requests intercepted, no live supplier/QA calls.
import {readFile,readdir,mkdir,writeFile} from 'node:fs/promises';
import {join,resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import assert from 'node:assert/strict';
const {chromium}=await import(pathToFileURL(join(resolve(process.argv[2]),'index.mjs')).href);
const root='http://127.0.0.1:5176',state='.sorttrip-qa/gate-c2-2026-10-29',out='artifacts/gate-c2';await mkdir(out,{recursive:true});
let hotel,flight;for(const file of await readdir(state)){if(!file.endsWith('.result.json'))continue;const r=JSON.parse(await readFile(join(state,file),'utf8'));if(r.body?.hotels?.length)hotel=r.body;if(r.body?.flights?.length)flight=r.body;}
assert(hotel?.hotels[0]?.readOnlyQuote&&flight?.flights?.length,'Actual normalized results required; no fabricated fallback');
const v=JSON.parse(await readFile('app/i18n/locales/video.json','utf8'));
const fixture=`const user={id:'render-fixture-owner',email:'owner@example.invalid',user_metadata:{}},session={user,access_token:'render-fixture'};export const setupMessage='RENDER FIXTURE ONLY';export const supabase={auth:{getSession:async()=>({data:{session}}),getUser:async()=>({data:{user}}),onAuthStateChange:()=>({data:{subscription:{unsubscribe(){}}}}),signOut:async()=>({})},from(){const q={select:()=>q,eq:()=>q,order:async()=>({data:[]})};return q}};`;
const result={type:'actual-price-render-replay-with-fixture-auth',checks:[],externalRequests:[],errors:[],supplierRequests:0};
const browser=await chromium.launch({headless:true,executablePath:process.argv[3]});
try{for(const [lang,width] of [['en',1280],['en',390],['id',390]]){
 const labels={...JSON.parse(await readFile('app/i18n/locales/'+lang+'.json','utf8')),...v[lang]};
 const context=await browser.newContext({viewport:{width,height:900},locale:lang==='en'?'en-GB':'id-ID'});
 await context.addInitScript(lang=>localStorage.setItem('sorttrip-language',lang),lang);
 await context.route('**/*',route=>{
  const u=new URL(route.request().url());if(u.origin!==root){if(['data:','blob:'].includes(u.protocol))return route.continue();result.externalRequests.push(u.hostname);return route.abort();}
  if(u.pathname==='/app/supabase.ts')return route.fulfill({contentType:'application/javascript',body:fixture});
  if(u.pathname==='/api/staging/session')return route.fulfill({json:{ownerVerified:true}});
  if(u.pathname==='/api/hotels/search')return route.fulfill({json:hotel});
  if(u.pathname==='/api/flights')return route.fulfill({json:flight});
  if(u.pathname.startsWith('/api/'))return route.fulfill({status:503,json:{code:'RENDER_ONLY_UNAVAILABLE'}});
  return route.continue();
 });
 const page=await context.newPage();page.on('pageerror',e=>result.errors.push(e.message));await page.goto(root);await page.locator('.header').waitFor();
 const nav=async kind=>{const label=kind==='hotel'?labels.ui_0569:labels.ui_0568;const button=page.getByRole('button',{name:label,exact:true});if(await button.isVisible())await button.click();else{await page.getByRole('combobox',{name:labels.ui_0571,exact:true}).click();await page.getByRole('option',{name:label,exact:true}).click();await page.keyboard.press('Escape');}};
 await nav('hotel');await page.locator('.lite-hotel-form').waitFor();await page.locator('.lite-hotel-form select').nth(1).selectOption('1');await page.getByRole('button',{name:labels.hotel_search,exact:true}).click();await page.getByRole('heading',{name:hotel.hotels[0].hotelName,exact:true}).waitFor();
 assert.equal(await page.locator('a[href^="/hotel-checkout"]').count(),0);assert.equal(await page.getByRole('button',{name:labels.hotel_save,exact:true}).count(),0);
 await page.getByText(labels.hotel_qa_readonly_rate,{exact:true}).waitFor();const hotelText=await page.locator('.lite-hotel-card').innerText();assert(!hotelText.includes('{price}'),'Unexpanded total placeholder');assert(/1[.,]080[.,]029/.test(hotelText),'Combined sourced full-stay cost missing');assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'Hotel horizontal overflow at '+width);
 await page.locator('.lite-hotel-card').screenshot({path:out+'/hotel-render-'+lang+'-'+width+'.png'});
 await nav('flight');await page.getByRole('button',{name:labels.ui_0247,exact:true}).click();await page.locator('.country-grid .destination-card').first().waitFor();await page.locator('.country-grid .destination-card button').first().click();await page.locator('.date-option-card').first().waitFor();
 assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'Flight horizontal overflow at '+width);await page.locator('.date-option-card').first().screenshot({path:out+'/flight-render-'+lang+'-'+width+'.png'});
 result.checks.push({lang,width,hotelFullStay:hotel.hotels[0].amountIDR,propertyFeesShown:true,bookingSuppressed:true,flightPrice:flight.flights[0].price,overflow:false});await context.close();
 }
 assert.equal(result.externalRequests.length,0);assert.deepEqual(result.errors,[]);result.passed=true;
}finally{await browser.close();await writeFile(out+'/render-results.json',JSON.stringify(result,null,2));}
console.log(JSON.stringify(result));
