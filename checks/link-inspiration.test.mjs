import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {linkInspiration} from '../lib/link-inspiration.mjs';
const url='https://vt.tiktok.com/ZSgq41yuY/';
test('reference handoff preserves requirements and clearly distinguishes inspiration from video evidence',()=>{
 const request='Hanoi dan Sapa, 5 hari, hotel di bawah Rp500.000; transportasi hemat.';
 for(const lang of ['id','en']){
  const result=linkInspiration(request,url+'?tracking=remove',lang);
  assert.ok(result.startsWith(request));assert.ok(result.includes(url));assert.doesNotMatch(result,/tracking=remove/);
  assert.ok(result.includes(lang==='en'?'has not been analysed':'belum dianalisis'));
  assert.equal(linkInspiration(result,url,lang),result);
 }
});
test('invalid URLs and long requests fail without silently deleting or truncating the original request',()=>{
 for(const source of ['javascript:alert(1)','https://vt.tiktok.com.evil.test/ZSgq41yuY/','https://user:secret@vt.tiktok.com/ZSgq41yuY/'])assert.throws(()=>linkInspiration('Keep my hotel',source));
 const text='x'.repeat(1000);assert.throws(()=>linkInspiration(text,url),/INSPIRATION_TOO_LONG/);assert.equal(text.length,1000);
});
test('reference goes through existing search/planner without catalog-only or paid media extraction',()=>{
 const read=p=>readFileSync(new URL('../app/'+p,import.meta.url),'utf8');
 const flight=read('flight-search.tsx'),planner=read('ai-planner.tsx'),root=read('travel-app.tsx');
 assert.match(flight,/onUseReference:useReference/);assert.match(flight,/focusRequest=\{destinationFocus\}/);
 assert.match(flight,/referenceNotice&&\(destination==='all'\|\|destination==='invalid'\)/);assert.match(flight,/resolveSearchDestination\(prompt,form.origin,controller.signal\)/);
 assert.match(planner,/linkInspiration\(interests,url,language\(\)\)/);assert.match(planner,/onChange\(\{\.\.\.trip,aiPrompt:combined\}\)/);
 assert.match(root,/onUseReference=\{options.onUseReference\}/);
 const media=read('video-itinerary.tsx');const handler=media.slice(media.indexOf('function useReference()'),media.indexOf('function edit('));
 assert.ok(handler.includes('onUseReference'));assert.doesNotMatch(handler,/fetch\(|run\(|getSession|onCreate|onPlan/);
});
