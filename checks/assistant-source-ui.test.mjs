import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import ts from 'typescript';
import {resolveI18n,actualI18n} from './i18n-loader.mjs';
async function component(file,asUrl=false){
 let code=resolveI18n(ts.transpileModule(await readFile(new URL('../app/'+file,import.meta.url),'utf8'),{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ES2022,jsx:ts.JsxEmit.ReactJSX}}).outputText);
 code=code.replace(/import[^\n]+from ['"]\.\/supabase['"];?/g,'const supabase=null;').replace(/import ['"]\.\/video-itinerary.css['"];?/g,'').replaceAll('../lib/prepared-media.mjs',new URL('../lib/prepared-media.mjs',import.meta.url).href).replaceAll('../lib/video-itinerary.mjs',new URL('../lib/video-itinerary.mjs',import.meta.url).href).replaceAll('import.meta.env.DEV','false').replaceAll('import.meta.env.MODE',JSON.stringify('test'));
 for(const pkg of ['react','react/jsx-runtime','radix-ui'])code=code.replaceAll(JSON.stringify(pkg),JSON.stringify(import.meta.resolve(pkg))).replaceAll("'"+pkg+"'",JSON.stringify(import.meta.resolve(pkg)));
 if(code.includes('./prepare-video'))code=code.replace(/(['"])\.\/prepare-video\1/g,JSON.stringify(await component('prepare-video.ts',true)));
 if(code.includes('./info-note'))code=code.replace(/(['"])\.\/info-note\1/g,JSON.stringify(await component('info-note.tsx',true)));
 const url='data:text/javascript;base64,'+Buffer.from(code).toString('base64');
 return asUrl?url:(await import(url)).default;
}
const Picker=await component('assistant-source-picker.tsx'),Media=await component('video-itinerary.tsx');
test('optional attachment selector does not replace travel requests and honours disabled',async()=>{
 for(const [lang,label,text] of [['id','Lampiran opsional','Tanpa lampiran'],['en','Optional attachment','No attachment']]){
  await actualI18n.default.changeLanguage(lang);const html=renderToStaticMarkup(React.createElement(Picker,{value:'text',onChange:()=>{},disabled:true}));
  assert.equal((html.match(/<select/g)||[]).length,1);assert.equal((html.match(/<option/g)||[]).length,4);assert.ok(html.includes(label)&&html.includes(text));assert.match(html,/<select[^>]*disabled/);assert.match(html,/<option value="text" selected/);
  assert.match(html,/class="info-note-trigger"/);assert.match(html,/aria-haspopup="dialog"/);assert.match(html,/aria-expanded="false"/);assert.match(html,/<span aria-hidden="true">!<\/span>/);assert.doesNotMatch(html,/<details|info-note-content/);
 }await actualI18n.default.changeLanguage('id');
});
test('embedded media has no standalone heading or source tabs and inactive inputs cannot validate parent search form',()=>{
 const html=renderToStaticMarkup(React.createElement(Media,{onCreate:()=>{},onLogin:()=>{}}));assert.match(html,/class="assistant-media-input" hidden/);assert.match(html,/<fieldset disabled/);assert.doesNotMatch(html,/class="video-itinerary"|video-source-tabs|<form|<h[12]/);
});
test('transcript starts with the requested mode and retains consent requirement inside Assistant',()=>{
 const html=renderToStaticMarkup(React.createElement(Media,{sourceKind:'transcript',onCreate:()=>{},onLogin:()=>{}}));assert.match(html,/<textarea/);assert.match(html,/type="checkbox"/);assert.match(html,/type="button" class="primary" disabled/);assert.doesNotMatch(html,/type="url"|type="file"/);
});

test('URL reference has supplied-text and consent controls, with honest ID/EN access notice',async()=>{
 for(const lang of ['id','en']){
  await actualI18n.default.changeLanguage(lang);
  const html=renderToStaticMarkup(React.createElement(Media,{sourceKind:'url',onCreate:()=>{},onLogin:()=>{}}));
  assert.match(html,/type="url"/);assert.match(html,/<textarea/);assert.match(html,/type="checkbox"/);
  assert.ok(html.includes(lang==='en'?'does not fetch or watch linked videos':'tidak mengambil atau menonton video'));
 }
 await actualI18n.default.changeLanguage('id');
});

test('inspiration handoff is compact: no transcript or processing consent before an explicit advanced action',async()=>{
 for(const lang of ['id','en']){
  await actualI18n.default.changeLanguage(lang);
  const html=renderToStaticMarkup(React.createElement(Media,{sourceKind:'url',onUseReference:()=>{},onCreate:()=>{},onLogin:()=>{}}));
  assert.match(html,/type="url"/);assert.doesNotMatch(html,/<textarea|type="file"|type="checkbox"/);
  assert.ok(html.includes(lang==='en'?'Use as travel inspiration':'Gunakan sebagai inspirasi perjalanan'));
  assert.match(html,/aria-expanded="false"/);
 }
 await actualI18n.default.changeLanguage('id');
});
