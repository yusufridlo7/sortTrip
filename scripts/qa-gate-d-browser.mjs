// Offline browser replay of the original UI. All auth/DB/Meta are fixtures.
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {pathToFileURL} from 'node:url';
import {resolve,join} from 'node:path';
import assert from 'node:assert/strict';
const {chromium}=await import(pathToFileURL(join(resolve(process.argv[2]),'index.mjs')).href);
const root='http://127.0.0.1:5176',out='artifacts/gate-d-isolation';await mkdir(out,{recursive:true});
const labels=JSON.parse(await readFile('app/i18n/locales/id.json','utf8'));
// Reuse the existing fixture implementation of the normal Supabase trip APIs.
const existing=await readFile('scripts/qa-unified-ui-browser.mjs','utf8');
const fixture=existing.match(/const fixtureModule=`([\s\S]*?)`;/)[1];
const evidence={kind:'OFFLINE original UI, fixture identity/entitlement/Meta/DB',api:[],external:[],errors:[],checks:[]};
const browser=await chromium.launch({headless:true,...(process.argv[3]?{executablePath:process.argv[3]}:{})});
try{
 const context=await browser.newContext({viewport:{width:1280,height:900}});
 await context.addInitScript(()=>localStorage.setItem('sorttrip-language','id'));
 await context.route('**/*',route=>{
  const u=new URL(route.request().url());if(u.origin!==root){evidence.external.push(u.hostname);return route.abort();}
  if(u.pathname==='/app/supabase.ts')return route.fulfill({contentType:'application/javascript',body:fixture});
  if(u.pathname.startsWith('/api/')){
   evidence.api.push(u.pathname);
   if(u.pathname==='/api/staging/session')return route.fulfill({json:{ownerVerified:true}});
   if(u.pathname==='/api/assistant/access')return route.fulfill({json:{pass:{remaining:2}}});
   if(u.pathname==='/api/assistant/discover')return route.fulfill({json:{provider:'Meta',mock:true,options:[{city:'Kuala Lumpur',airport:'KUL',country:'Malaysia',days:3,summary:'OFFLINE QA fixture',stops:[{day:1,time:'10:00',title:'Museum QA',category:'Wisata',place:'Kuala Lumpur',note:'Price unavailable'},{day:2,time:'11:00',title:'Park QA',category:'Wisata',place:'Kuala Lumpur',note:'Price unavailable'},{day:3,time:'09:00',title:'Airport QA',category:'Transportasi',place:'Kuala Lumpur',note:'Price unavailable'}]}]}});
   return route.abort();
  }
  return route.continue();
 });
 const page=await context.newPage();page.on('pageerror',e=>evidence.errors.push(e.message));page.on('dialog',d=>d.accept());
 await page.goto(root);await page.locator('.header').waitFor();
 await page.locator('.search-panel textarea').first().fill('Kuala Lumpur 3 hari museum');
 await page.locator('.assistant-search-submit').first().click();
 await page.locator('.assistant-trip-options article').first().waitFor();
 await page.locator('.assistant-trip-options article button').first().click();
 await page.locator('.world-item input[type=time]').first().fill('10:15');
 await page.getByRole('button',{name:labels.ui_0590,exact:true}).click();
 await page.getByRole('button',{name:labels.ui_0572,exact:true}).click();await page.locator('.saved-card').first().click();
 await page.reload();await page.getByRole('button',{name:labels.ui_0572,exact:true}).click();await page.locator('.saved-card').first().click();
 assert.equal(await page.locator('.world-item input[type=time]').first().inputValue(),'10:15');
 assert.equal(evidence.api.filter(p=>p==='/api/assistant/discover').length,1);
 assert(evidence.api.every(p=>['/api/staging/session','/api/assistant/access','/api/assistant/discover'].includes(p)));
 assert.deepEqual(evidence.external,[]);assert.deepEqual(evidence.errors,[]);
 evidence.checks=['normal authenticated route fixture','one discovery action','no pricing or second generator network','native editor edit','native Save/My Trips/full reload fixture'];
 await page.screenshot({path:out+'/editor.png'});
 await page.setViewportSize({width:390,height:844});assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
 await page.screenshot({path:out+'/editor-mobile.png'});evidence.checks.push('mobile390 layout, no horizontal overflow');evidence.passed=true;
}finally{await browser.close();await writeFile(out+'/browser-results.json',JSON.stringify(evidence,null,2));}
console.log(JSON.stringify(evidence));
