import {openSupplierBrowser} from './supplier-browser.js';

export function transportRouteUrl(value){
 try{const u=new URL(value);return u.protocol==='https:'&&u.hostname==='12go.asia'&&!u.username&&!u.password&&/^\/en\/travel\/[a-z0-9-]+\/[a-z0-9-]+\/?$/.test(u.pathname)?u.origin+u.pathname.replace(/\/$/,''):null;}catch{return null;}
}
const validDate=s=>/^\d{4}-\d{2}-\d{2}$/.test(s||'')&&Number.isFinite(Date.parse(s))&&new Date(s).toISOString().slice(0,10)===s;
const normalize=s=>String(s||'').toLowerCase().replace(/[^a-z0-9]+/g,' ').trim();
const endpoint=s=>{const n=normalize(s);return ({singapura:'singapore',malacca:'melaka'})[n]||n;};
const modeOf=s=>/\bbus\b|\bbis\b|coach/i.test(s)?'bus':/kereta|\btrain\b|rail/i.test(s)?'train':/ferry|feri/i.test(s)?'ferry':/van|shuttle|minibus/i.test(s)?'van':null;
export function datedTransportUrl(target,people){
 const base=transportRouteUrl(target.sourceUrl);
 if(!base||!validDate(target.travelDate)||people!==1||!target.from||!target.to||!modeOf(target.mode||target.title))return null;
 const u=new URL(base);u.search=new URLSearchParams({date:target.travelDate,people:String(people),adults:String(people),vehclasses_tab:'all'}).toString();return u.href;
}
export function checkedTransportQuote(target,people,observation){
 const expected=datedTransportUrl(target,people);if(!expected||!observation)return null;
 let u;try{u=new URL(observation.url);}catch{return null;}
 if(transportRouteUrl(u.href)!==transportRouteUrl(expected)||['date','people','adults'].some(k=>u.searchParams.get(k)!==new URL(expected).searchParams.get(k)))return null;
 const dateLabel=new Date(target.travelDate+'T12:00:00Z').toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric',timeZone:'UTC'});
 const compactDate=new Date(target.travelDate+'T12:00:00Z').toLocaleDateString('en-US',{weekday:'short',month:'short',day:'numeric',timeZone:'UTC'});
 // The current UI omits the year. The full ISO date must still match in the
 // final search URL, and its visible weekday/month/day must agree exactly.
 if(endpoint(observation.from)!==endpoint(target.from)||endpoint(observation.to)!==endpoint(target.to)||![dateLabel,compactDate].includes(observation.date)||observation.travelers!==`${people} Traveler`||observation.currency!=='IDR')return null;
 const wanted=modeOf(target.mode||target.title);
 const offers=(Array.isArray(observation.offers)?observation.offers:[]).flatMap(o=>{
  if(typeof o.text!=='string'||o.text.length>2500||typeof o.fare!=='string'||o.fare.length>500||modeOf(o.text)!==wanted||/taxi|vehicle|charter|sign in|log in|member|coupon/i.test(o.text))return [];
  // Read a displayed ticket offer, never a route-page "from" price or vehicle total.
  if(!/Taxes included/i.test(o.fare)||!/(?:passenger|per person|per ticket|per adult)/i.test(o.fare)||!/Book now/i.test(o.fare)||/\bfrom\s+IDR|starting\s+(?:at|from)|select time/i.test(o.fare))return [];
  const match=o.fare.match(/IDR\s*([0-9]{1,3}(?:,[0-9]{3})+|[0-9]+)(?![0-9.,])/);
  const amount=match&&Number(match[1].replace(/,/g,''));if(!amount||amount>1e9)return [];
  return [{amount,text:o.text.trim()}];
 }).sort((a,b)=>a.amount-b.amount);
 if(!offers.length)return null;
 return {id:target.id,amountIDR:offers[0].amount,basis:'person',sourceUrl:expected,quote:`${target.from} → ${target.to} · ${target.travelDate} · ${offers[0].text}`,checkedAt:new Date().toISOString(),scope:'dated',provider:'12Go',travelDate:target.travelDate,adults:people,taxesIncluded:true};
}

export async function browserTransportPrices(q,targets,env,deadline=Date.now()+45000,diagnostics={},launchBrowser){
 if(env.HOTEL_BROWSER_ENABLED!=='true'||!env.HOTEL_BROWSER)return [];
 const routes=targets.filter(t=>t.category==='Transportasi'&&datedTransportUrl(t,q.people)).slice(0,3);
 if(!routes.length||deadline-Date.now()<5000)return [];
 let session;
 try{
  diagnostics.transportPhase='LAUNCH';
  session=await openSupplierBrowser(env.HOTEL_BROWSER,launchBrowser);
  const quotes=[];
  for(const target of routes){
   const remaining=Math.min(25000,deadline-Date.now());if(remaining<5000)break;
   const page=await session.context.newPage();page.setDefaultTimeout(remaining);let blocked=false;
   try{
    await page.route('**/*',async route=>{
     const r=route.request();if(r.isNavigationRequest()&&r.frame()===page.mainFrame()&&transportRouteUrl(r.url())!==transportRouteUrl(target.sourceUrl)){
      try{const u=new URL(r.url());if(u.hostname==='12go.asia'&&/login|account|captcha|challenge|verify|security/i.test(u.pathname)){blocked=true;diagnostics.transportAccessRequired=true;}}catch{}
      return route.abort();
     }return route.continue();
    });
    diagnostics.transportPhase='NAVIGATION';
    const navigation=await page.goto(datedTransportUrl(target,q.people),{waitUntil:'domcontentloaded',timeout:remaining});
    diagnostics.transportHttpStatus=navigation?.status()||null;
    if(await page.evaluate(()=>/captcha|verify you are human|access denied|unusual traffic|security check/i.test(document.body?.innerText||''))){blocked=true;diagnostics.transportAccessRequired=true;break;}
    if(blocked)break;
    diagnostics.transportPhase='SEARCH_FORM';
    await page.locator('.vue-search-form').waitFor({timeout:Math.max(1,Math.min(12000,deadline-Date.now()))});
    // Only the normal public currency control; no stored cookies or injected session.
    diagnostics.transportPhase='CURRENCY';
    await page.locator('.curr-selector').first().click();await page.getByText('IDR',{exact:true}).click();
    diagnostics.transportPhase='OFFERS';
    await page.locator('.trip-cta').filter({hasText:/IDR/}).first().waitFor({timeout:Math.max(1,Math.min(18000,deadline-Date.now()))});
    const observation=await page.evaluate(()=>{
     const form=document.querySelector('.vue-search-form'),places=Array.from(form?.querySelectorAll('.places .vue-search-form-group-field')||[]).map(e=>e.innerText.trim());
     const date=form?.querySelector('.dates')?.innerText.trim().split('\n')[0],travelers=form?.querySelector('.people')?.innerText.trim();
     const currency=document.querySelector('.curr-selector')?.innerText.includes('IDR')?'IDR':null;
     const offers=Array.from(document.querySelectorAll('.trip-card')).slice(0,40).map(e=>({text:e.innerText.slice(0,2400),fare:e.querySelector('.trip-cta')?.innerText.slice(0,480)||''}));
     return {url:location.href,from:places[0],to:places[1],date,travelers,currency,offers};
    });
    diagnostics.transportPhase='VALIDATION';
    const quote=checkedTransportQuote(target,q.people,observation);if(quote){quotes.push(quote);diagnostics.transportPhase='QUOTE_ACCEPTED';console.info('TRANSPORT_BROWSER_QUOTE_OK');}else console.info('TRANSPORT_BROWSER_NO_MATCHING_TICKET');
   }catch{console.info(blocked?'TRANSPORT_BROWSER_ACCESS_REQUIRED':'TRANSPORT_BROWSER_PRICE_UNAVAILABLE');}
   finally{await page.close().catch(()=>{});}
   if(blocked)break;
  }
  return quotes;
 }catch{console.info('TRANSPORT_BROWSER_LAUNCH_FAILED');return [];}finally{if(session)await session.close().catch(()=>{});}
}
