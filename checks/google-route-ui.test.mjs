import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import ts from 'typescript';
import {resolveI18n,actualI18n} from './i18n-loader.mjs';
let code=resolveI18n(ts.transpileModule(await readFile(new URL('../app/google-route-check.tsx',import.meta.url),'utf8'),{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ES2022,jsx:ts.JsxEmit.ReactJSX}}).outputText);
for(const pkg of ['react','react/jsx-runtime'])code=code.replaceAll(JSON.stringify(pkg),JSON.stringify(import.meta.resolve(pkg))).replaceAll("'"+pkg+"'",JSON.stringify(import.meta.resolve(pkg)));
code=code.replace(/(['"])\.\/supabase\1/g,JSON.stringify('data:text/javascript,export const supabase=null;'));
const {default:GoogleRouteCheck}=await import('data:text/javascript;base64,'+Buffer.from(code).toString('base64'));
test('directions link exists before an API request, endpoints are visible, and ID/EN labels render',async()=>{
 for(const lang of ['id','en']){
  await actualI18n.default.changeLanguage(lang);
  const html=renderToStaticMarkup(React.createElement(GoogleRouteCheck,{from:'Budget Hotel, Kuala Lumpur',to:'Museum & Gallery, Kuala Lumpur',date:'2027-01-30'}));
  assert.match(html,/<summary>[^]*Budget Hotel, Kuala Lumpur[^]*Museum &amp; Gallery/);
  assert.match(html,/https:\/\/www.google.com\/maps\/dir\/\?/);
  assert.match(html,/origin=Budget\+Hotel/);assert.match(html,/destination=Museum\+%26\+Gallery/);
  assert.ok(!html.includes('open=""'));assert.match(html,lang==='id'?/Cek rute Google Maps/:/Check Google Maps route/);
 }
 await actualI18n.default.changeLanguage('id');
});
