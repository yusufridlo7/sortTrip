import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import ts from 'typescript';
import {resolveI18n,actualI18n} from './i18n-loader.mjs';
let code=ts.transpileModule(await readFile(new URL('../app/expandable-details.tsx',import.meta.url),'utf8'),{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ES2022,jsx:ts.JsxEmit.ReactJSX}}).outputText;
code=resolveI18n(code);
for(const pkg of ['react','react/jsx-runtime','lucide-react'])code=code.replaceAll(JSON.stringify(pkg),JSON.stringify(import.meta.resolve(pkg))).replaceAll("'"+pkg+"'",JSON.stringify(import.meta.resolve(pkg)));
// Rendering contract uses the fallback catalogue translator; browser QA exercises
// the real NarrativeProvider with saved translated trip titles separately.
const narrative='data:text/javascript,'+encodeURIComponent('export const useNarrative=()=>value=>value;');
code=code.replace(/(['"])\.\/i18n\/narratives\1/g,JSON.stringify(narrative));
const {default:Disclosure}=await import('data:text/javascript;base64,'+Buffer.from(code).toString('base64'));

test('item disclosure is initially closed, labelled, and retains controls without nesting them in its summary',async()=>{
 await actualI18n.default.changeLanguage('en');
 const html=renderToStaticMarkup(React.createElement(Disclosure,{name:'Hotel & route'},React.createElement('input',{defaultValue:'Unsaved QA text'}),React.createElement('button',{type:'button'},'Fixture action')));
 assert.match(html,/<details class="expandable-details expandable-item">/);
 assert.match(html,/aria-expanded="false"/);assert.match(html,/Show details: Hotel &amp; route/);
 const summary=html.match(/<summary[^>]*>([\s\S]*?)<\/summary>/)[1];assert.ok(!/<(?:button|input|a)\b/.test(summary));
 assert.match(html,/value="Unsaved QA text"/);assert.match(html,/<button type="button">Fixture action/);
 assert.equal(html.match(/aria-controls="([^"]+)"/)[1],html.match(/<div id="([^"]+)"/)[1]);
 await actualI18n.default.changeLanguage('id');
});

test('conversation disclosure uses Indonesian copy and independent accessible targets',async()=>{
 await actualI18n.default.changeLanguage('id');
 const html=renderToStaticMarkup(React.createElement(React.Fragment,null,...['KL','Hanoi'].map(name=>React.createElement(Disclosure,{name,kind:'conversation',key:name},'QA message'))));
 assert.match(html,/Lihat percakapan: KL/);assert.match(html,/Lihat percakapan: Hanoi/);
 const ids=[...html.matchAll(/aria-controls="([^"]+)"/g)].map(x=>x[1]);assert.equal(new Set(ids).size,2);
});
