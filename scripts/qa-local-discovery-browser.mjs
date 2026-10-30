// Attach only to the existing isolated localhost5175 demo. Never starts QA/AI.
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {resolve,join} from 'node:path';
import {pathToFileURL} from 'node:url';
import assert from 'node:assert/strict';
import {initialVideoTrip,demoDestinations} from '../lib/video-itinerary.mjs';
const {chromium}=await import(pathToFileURL(join(resolve(process.argv[2]),'index.mjs')).href);
const dictionaries=JSON.parse(await readFile('app/i18n/locales/video.json','utf8'));
const id={...JSON.parse(await readFile('app/i18n/locales/id.json','utf8')),...dictionaries.id},en={...JSON.parse(await readFile('app/i18n/locales/en.json','utf8')),...dictionaries.en};
const origin='http://127.0.0.1:5175',storageKey='sorttrip-local-mvp-demo-v1',evidence={mode:'LOCAL BROWSER + GPS FIXTURE',checks:[],externalRequests:[],forbiddenRequests:[],pageErrors:[]};
const trip=initialVideoTrip(demoDestinations('Bangkok').destinations,{start:'2026-11-10',days:3,people:3,demo:true});
const browser=await chromium.launch({headless:true,...(process.argv[3]?{executablePath:process.argv[3]}:{})});
try{
 const context=await browser.newContext({locale:'id-ID',viewport:{width:390,height:844}});
 await context.route('**/*',route=>{const u=new URL(route.request().url());if(!['data:','blob:'].includes(u.protocol)&&u.origin!==origin){evidence.externalRequests.push(u.origin);return route.abort();}if(u.pathname.startsWith('/api/')){evidence.forbiddenRequests.push(u.pathname);return route.abort();}return route.continue();});
 await context.addInitScript(()=>{window.__gpsMode='denied';window.__gpsCalls=0;Object.defineProperty(navigator,'geolocation',{configurable:true,value:{getCurrentPosition(ok,fail){window.__gpsCalls++;if(window.__gpsMode==='denied')fail({code:1});else ok({coords:{latitude:13.740123,longitude:100.480456,accuracy:25}});},watchPosition(){throw Error('Background tracking forbidden');}}});});
 const page=await context.newPage();page.on('pageerror',e=>evidence.pageErrors.push(e.message.slice(0,120)));
 await page.goto(origin);await page.evaluate(({trip,key})=>{localStorage.setItem(key,JSON.stringify(trip));}, {trip,key:storageKey});
 await page.getByRole('button',{name:id.mvp_reload,exact:true}).click();await page.locator('.mvp-guide-links').getByRole('button',{name:id.guide_open,exact:true}).first().click();
 let dialog=page.getByRole('dialog');await dialog.locator('.tour-guide-nearby > summary').click();let nearby=dialog.getByRole('region',{name:id.local_title,exact:true});await nearby.waitFor();
 assert.equal(await page.evaluate(()=>window.__gpsCalls),0);await nearby.getByText('Wang Lang Market',{exact:true}).waitFor();assert(await nearby.getByText(id.local_price_unknown,{exact:true}).count()>0);assert(await nearby.getByText(id.local_halal_unknown,{exact:true}).count()>0);
 evidence.checks.push('Destination-based sourced references; no automatic GPS; unknown price/hours/halal explicit');
 await nearby.getByRole('button',{name:id.local_use_gps,exact:true}).click();await nearby.getByText(id.local_status_GPS_DENIED,{exact:true}).waitFor();assert.equal(await page.evaluate(()=>window.__gpsCalls),1);
 await page.evaluate(()=>{window.__gpsMode='granted';});await nearby.getByRole('button',{name:id.local_use_gps,exact:true}).click();await nearby.getByText(id.local_no_gps_results,{exact:true}).waitFor();
 await nearby.getByRole('button',{name:id.local_category_attractions,exact:true}).click();await nearby.getByText('Wat Pho',{exact:true}).waitFor();assert(await nearby.locator('.local-place').getByText(/garis lurus/).count()>0);assert(await nearby.getByRole('button',{name:id.local_already_added,exact:true}).isDisabled());
 assert.equal(await page.evaluate(()=>window.__gpsCalls),2);evidence.checks.push('GPS denied fallback and granted one-shot radius/distance; existing attraction duplicate blocked');
 await nearby.getByRole('button',{name:id.local_use_destination,exact:true}).click();await nearby.getByRole('button',{name:id.local_category_souvenirs,exact:true}).click();await nearby.getByText('The Old Siam',{exact:true}).waitFor();
 await nearby.getByLabel(id.local_question,{exact:true}).fill('Oleh-oleh khas Bangkok apa?');await nearby.getByRole('button',{name:id.guide_send,exact:true}).click();assert((await nearby.locator('.local-answer').textContent()).includes('sutra Thailand'));
 await nearby.getByLabel(id.local_question,{exact:true}).fill('Ada makanan halal di sekitar sini?');await nearby.getByRole('button',{name:id.guide_send,exact:true}).click();await nearby.getByText(id.local_no_halal,{exact:true}).waitFor();
 await nearby.getByRole('button',{name:id.local_category_food,exact:true}).click();const market=nearby.locator('.local-place').filter({has:page.getByRole('heading',{name:'Wang Lang Market',exact:true})});
 const directions=new URL(await market.getByRole('link',{name:id.guide_directions,exact:true}).getAttribute('href'));assert.equal(directions.origin,'https://www.google.com');assert.equal(directions.searchParams.has('origin'),false);
 await market.getByRole('button',{name:id.local_select,exact:true}).click();await nearby.getByLabel(id.local_visit_day,{exact:true}).selectOption('2');await nearby.getByLabel(id.local_visit_time,{exact:true}).fill('12:30');await nearby.getByRole('button',{name:id.local_add,exact:true}).click();await nearby.getByText(id.local_status_added,{exact:true}).waitFor();assert(await market.getByRole('button',{name:id.local_already_added,exact:true}).isDisabled());
 const box=await dialog.boundingBox();assert(box.x>=0&&box.x+box.width<=390);assert(await nearby.evaluate(el=>el.scrollWidth<=el.clientWidth+1));await nearby.scrollIntoViewIfNeeded();await mkdir('artifacts/local-discovery',{recursive:true});await page.screenshot({path:'artifacts/local-discovery/nearby-mobile.png'});
 await dialog.locator('.language-switcher select').selectOption('en');await dialog.getByRole('region',{name:en.local_title,exact:true}).waitFor();await dialog.getByRole('button',{name:en.guide_back,exact:true}).click();await dialog.waitFor({state:'hidden'});
 await page.getByRole('button',{name:en.ui_0590,exact:true}).click();let saved=await page.evaluate(key=>JSON.parse(localStorage.getItem(key)),storageKey);
 assert.equal(saved.items.length,trip.items.length+1);const added=saved.items.find(item=>item.title==='Wang Lang Market');assert.equal(added.day,2);assert.equal(added.time,'12:30');assert(added.priceUnknown);assert.equal(added.geo,undefined);assert(!JSON.stringify(saved).includes('13.740123'));assert(!JSON.stringify(saved).includes('100.480456'));
 await page.reload();await page.getByRole('button',{name:en.mvp_reload,exact:true}).click();assert.equal(await page.locator('.world-item').count(),3);assert.equal(await page.locator('.world-item input[type=time]').nth(2).inputValue(),'12:30');
 evidence.checks.push('Souvenir/food/halal questions and map; add restaurant day/time; duplicate prevention; native browser Save/reload; no GPS persisted');
 await page.locator('.mvp-guide-links').getByRole('button',{name:en.guide_open,exact:true}).first().click();dialog=page.getByRole('dialog');await dialog.locator('.tour-guide-nearby > summary').click();nearby=dialog.getByRole('region',{name:en.local_title,exact:true});assert(await nearby.getByRole('button',{name:en.local_category_food,exact:true}).count()>0);assert.equal(await page.evaluate(()=>window.__gpsCalls),0);
 // Unsupported destination fixture: no false businesses or fabricated map pins.
 await dialog.getByRole('button',{name:en.guide_back,exact:true}).click();await dialog.waitFor({state:'hidden'});
 const unknown={...trip,destination:'demo-unknown',destinationMeta:{city:'Unknown city',country:'Unknown country',code:''},items:trip.items.map(i=>({...i,title:'Unverified destination',place:'Unverified destination',locationCity:'Unknown city',geo:undefined}))};
 await page.evaluate(({trip,key})=>localStorage.setItem(key,JSON.stringify(trip)),{trip:unknown,key:storageKey});await page.getByRole('button',{name:en.mvp_reload,exact:true}).click();await page.locator('.mvp-guide-links').getByRole('button',{name:en.guide_open,exact:true}).first().click();await page.getByRole('dialog').locator('.tour-guide-nearby > summary').click();nearby=page.getByRole('dialog').getByRole('region',{name:en.local_title,exact:true});await nearby.getByText(en.local_no_results,{exact:true}).waitFor();await nearby.getByRole('button',{name:en.local_show_demo,exact:true}).click();await nearby.getByText(en.local_fixture,{exact:true}).waitFor();assert.equal(await nearby.getByRole('link',{name:en.guide_directions,exact:true}).count(),0);
 evidence.checks.push('English/mobile layout and unsupported destination labelled opt-in fixture without Maps');
 assert.deepEqual(evidence.externalRequests,[]);assert.deepEqual(evidence.forbiddenRequests,[]);assert.deepEqual(evidence.pageErrors,[]);
 await writeFile('artifacts/local-discovery/browser-results.json',JSON.stringify(evidence,null,2));console.log(JSON.stringify(evidence,null,2));
}finally{await browser.close();}
