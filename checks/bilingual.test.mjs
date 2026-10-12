import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {actualI18n as ui} from './i18n-loader.mjs';
import {normalizeLanguage,requestLanguage,localizedResponse,languageInstruction,priceWatchEmail} from '../worker/localization.js';
import {validateInput} from '../worker/itinerary.js';
import {researchRequest,transportResearchRequest,draftRequest} from '../worker/ai-draft.js';
import {validateNarratives,validateTranslations,handleNarrativeTranslation} from '../worker/narrative-translation.js';
import worker from '../worker/index.js';

test('language detection: explicit preference wins, unsupported browser falls back safely',()=>{
 assert.equal(ui.detectLanguage('id','en-US'),'id');assert.equal(ui.detectLanguage('en','id-ID'),'en');
 assert.equal(ui.detectLanguage(null,'en-US'),'en');assert.equal(ui.detectLanguage(null,'fr-FR'),'id');
 assert.equal(normalizeLanguage('EN'),'id');assert.equal(normalizeLanguage('en'),'en');
 assert.equal(requestLanguage(new Request('https://example.test/?language=xx',{headers:{'X-SortTrip-Language':'en'}})),'id');
});
test('catalogue parity, interpolation, plurals, fallback and locale-only formatting',async()=>{
 const id=JSON.parse(await readFile(new URL('../app/i18n/locales/id.json',import.meta.url))),en=JSON.parse(await readFile(new URL('../app/i18n/locales/en.json',import.meta.url)));
 assert.deepEqual(Object.keys(id).sort(),Object.keys(en).sort());
 for(const [key,text] of Object.entries(id)){assert.equal(typeof en[key],'string');assert.ok(en[key].trim());const slots=s=>[...s.matchAll(/\{\{([^}]+)\}\}/g)].map(m=>m[1]).sort();assert.deepEqual(slots(text),slots(en[key]),key);}
 await ui.default.changeLanguage('en');assert.equal(ui.tr('days',{count:1}),'1 day');assert.equal(ui.tr('days',{count:3}),'3 days');
 assert.equal(ui.label('Pesawat'),'Flights');assert.equal(ui.label('CUBE Boutique Capsule Hotel'),'CUBE Boutique Capsule Hotel');
 assert.equal(ui.countryLabel('MY','Malaysia'),'Malaysia');assert.match(ui.formatDate('2027-01-30T12:00:00Z',{month:'long',timeZone:'UTC'}),/January/);
 assert.equal(ui.formatMoney(1234,'USD'),new Intl.NumberFormat('en-GB',{style:'currency',currency:'USD',maximumFractionDigits:2}).format(1234));
 assert.equal(ui.formatMoney(1234,'IDR'),new Intl.NumberFormat('en-GB',{style:'currency',currency:'IDR',maximumFractionDigits:0}).format(1234));
 ui.default.addResource('id','translation','test_fallback','Aman');assert.equal(ui.tr('test_fallback'),'Aman');ui.default.removeResourceBundle('unused','translation');
 await ui.default.changeLanguage('id');assert.equal(ui.label('Flights'),'Pesawat');
});
test('English AI requests preserve exact schema, categories, source URLs and numeric input',()=>{
 const raw={city:'Singapore',start:'2027-01-30',days:3,people:1,budget:4500000};
 const id=validateInput(raw),en=validateInput({...raw,language:'en'});assert.equal(id.language,'id');assert.equal(validateInput({...raw,language:'xx'}).language,'id');
 const sources=[{url:'https://example.test/hotel',title:'Hotel'}];const a=draftRequest(id,{},'Research',sources),b=draftRequest(en,{},'Research',sources);
 assert.deepEqual(a.text,b.text);assert.match(b.instructions,/in English/);assert.match(a.instructions,/in Indonesian/);
 assert.deepEqual(JSON.parse(b.input).trip,{...JSON.parse(a.input).trip,language:'en'});
 assert.match(researchRequest(en,{}).instructions,/in English/);assert.match(transportResearchRequest(en,{},'Research').instructions,/in English/);
 assert.match(languageInstruction(en),/independent of currency/);
});
test('localized responses retain payment URLs, status, amount, codes and caching headers',async()=>{
 const r=await localizedResponse(Response.json({error:'Masuk terlebih dahulu.',code:'AUTH_REQUIRED',amount:15000,checkoutUrl:'https://payment.example.test/checkout?reference=public-fixture'},{status:401,headers:{'Cache-Control':'no-store'}}),'en');
 const d=await r.json();assert.equal(r.status,401);assert.equal(r.headers.get('Content-Language'),'en');assert.equal(r.headers.get('Cache-Control'),'no-store');
 assert.equal(d.error,'Sign in first.');assert.equal(d.amount,15000);assert.equal(d.code,'AUTH_REQUIRED');assert.equal(d.checkoutUrl,'https://payment.example.test/checkout?reference=public-fixture');
 const keyed=await localizedResponse(Response.json({error:'translate_failed'}),'id');assert.notEqual((await keyed.json()).error,'translate_failed');
 const actual=await worker.fetch(new Request('https://sorttrip.test/api/itinerary/translate',{method:'GET',headers:{'X-SortTrip-Language':'en'}}),{},{});assert.equal(actual.status,405);assert.match((await actual.json()).error,/POST/);
});
test('narrative translation rejects changed prices, times, URLs, duplicate entries and excessive input',()=>{
 const entries=[{id:'n0',text:'Bus pukul 10:30, Rp 25.000. https://operator.example.test/route'}];
 const translated={entries:[{id:'n0',text:'Bus at 10:30, Rp 25.000. https://operator.example.test/route'}]};
 assert.deepEqual(validateTranslations(translated,entries),translated.entries);
 for(const text of ['Bus at 11:30, Rp 25.000. https://operator.example.test/route','Bus at 10:30, Rp 30.000. https://operator.example.test/route','Bus at 10:30, Rp 25.000. https://other.example.test/route'])assert.throws(()=>validateTranslations({entries:[{id:'n0',text}]},entries));
 assert.throws(()=>validateTranslations({entries:[...translated.entries,...translated.entries]},entries));
 assert.throws(()=>validateNarratives({entries:[{id:'n0',text:'x'.repeat(1501)}]}));assert.throws(()=>validateNarratives({entries:[...entries,...entries]}));
 assert.equal(validateNarratives({language:'unsafe',entries}).language,'id');
});
test('translation uses authenticated bounded call, no planning tools or result-quota reservation',async()=>{
 const previous=globalThis.fetch;const calls=[];
 try{globalThis.fetch=async(url,options)=>{calls.push(String(url));if(String(url).endsWith('/auth/v1/user'))return Response.json({id:'fixture'});const body=JSON.parse(options.body);assert.equal(body.store,false);assert.equal(body.tools,undefined);assert.match(body.instructions,/English/);return Response.json({status:'completed',output:[{content:[{type:'output_text',text:JSON.stringify({entries:[{id:'n0',text:'Walk for 10 minutes.'}]})}]}]});};
 const env={SUPABASE_URL:'https://db.example.test',SUPABASE_PUBLISHABLE_KEY:'fixture',OPENAI_API_KEY:'fixture',AI_LIMITER:{limit:async()=>({success:true})}};
 const body=JSON.stringify({language:'en',entries:[{id:'n0',text:'Berjalan 10 menit.'}]});
 const unauthenticated=await handleNarrativeTranslation(new Request('https://sorttrip.test/api/itinerary/translate',{method:'POST',body}),env);assert.equal(unauthenticated.status,401);assert.equal(calls.length,0);
 const r=await handleNarrativeTranslation(new Request('https://sorttrip.test/api/itinerary/translate',{method:'POST',headers:{Authorization:'Bearer fixture'},body}),env);assert.equal(r.status,200);assert.equal((await r.json()).entries[0].text,'Walk for 10 minutes.');assert.equal(calls.length,2);assert.ok(calls.every(c=>!c.includes('reserve_ai_request')&&!c.includes('finish_ai_request')));
 }finally{globalThis.fetch=previous;}
});
test('Price Watch email follows stored language while preserving fare values and booking URL',()=>{
 const n={old_price:2000000,price:1800000,booking_url:'https://partner.example.test/search?affiliate=public'};const en=priceWatchEmail(n,'en'),id=priceWatchEmail(n,'id');
 assert.match(en.subject,/dropped/);assert.match(id.subject,/turun/);assert.ok(en.text.includes(n.booking_url));assert.ok(id.text.includes(n.booking_url));assert.match(en.text,/IDR/);
});
