import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import ts from 'typescript';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {i18nUrl} from './i18n-loader.mjs';

const source=await readFile(new URL('../app/flight-search.tsx',import.meta.url),'utf8');
const ast=ts.createSourceFile('flight-search.tsx',source,ts.ScriptTarget.Latest,true,ts.ScriptKind.TSX);
const declaration=ast.statements.find(n=>ts.isFunctionDeclaration(n)&&n.name?.text==='FlightTimes');
assert.ok(declaration);
let code=ts.transpileModule(`import {tr,locale} from ${JSON.stringify(i18nUrl)};\n${declaration.getText(ast)}`,{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ES2022,jsx:ts.JsxEmit.ReactJSX}}).outputText;
code=code.replaceAll('"react/jsx-runtime"',JSON.stringify(import.meta.resolve('react/jsx-runtime')));
const {FlightTimes}=await import('data:text/javascript;base64,'+Buffer.from(code).toString('base64'));
const flight={source:'aviasales',originCode:'CGK',destinationCode:'KUL',depart:'07:25',returnDepart:'18:40',departureAt:'2026-11-07T07:25:00+07:00',returnAt:'2026-11-10T18:40:00+08:00',duration:125,returnDuration:130};
const render=(f,emphasizeTimes=false)=>renderToStaticMarkup(React.createElement(FlightTimes,{f,origin:'CGK',code:'KUL',emphasizeTimes}));

test('flight clock emphasis preserves the complete original schedule and timezone copy',()=>{
 const plain=render(flight),emphasized=render(flight,true);
 assert.equal((emphasized.match(/class="flight-clock"/g)||[]).length,2);
 assert.ok(emphasized.includes('07:25'));assert.ok(emphasized.includes('18:40'));
 assert.equal(emphasized.replace(/<b class="flight-clock" aria-hidden="true">.*?<\/b>/g,''),plain);
 assert.ok(emphasized.includes('2026-11-10'));
});
test('one-way emphasis never creates a return schedule',()=>{
 const html=render({...flight,returnAt:undefined},true);
 assert.equal((html.match(/class="flight-clock"/g)||[]).length,1);
 assert.ok(!html.includes('18:40'));
});
test('missing time remains unknown, without an invented clock',()=>{
 const html=render({...flight,depart:'--:--',departureAt:undefined,returnAt:undefined,duration:0},true);
 assert.ok(html.includes('--:--'));assert.ok(!html.includes('07:25'));
});
test('desktop primary buttons and links retain WCAG AA text contrast',async()=>{
 const css=await readFile(new URL('../app/ui-alignment/palette-type.css',import.meta.url),'utf8');
 const luminance=hex=>{const rgb=hex.match(/[0-9a-f]{2}/gi).map(n=>parseInt(n,16)/255).map(v=>v<=.04045?v/12.92:((v+.055)/1.055)**2.4);return rgb[0]*.2126+rgb[1]*.7152+rgb[2]*.0722;};
 for(const token of ['primary','link']){const color=css.match(new RegExp('--brand-'+token+':(#[0-9a-f]{6})','i'))?.[1];assert.ok(color);assert.ok(1.05/(luminance(color)+.05)>=4.5,token+' contrast');}
});
