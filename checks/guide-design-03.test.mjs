import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import ts from 'typescript';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';

const source=await readFile(new URL('../app/sorttrip-guide.tsx',import.meta.url),'utf8');
const baseline=await readFile(new URL('../qa-reports/guide-design-03-2026-11-02/source-baseline/sorttrip-guide.tsx',import.meta.url),'utf8');
const parse=s=>ts.createSourceFile('guide.tsx',s,ts.ScriptTarget.Latest,true,ts.ScriptKind.TSX);
const printer=ts.createPrinter({removeComments:true});
const print=(n,ast)=>printer.printNode(ts.EmitHint.Unspecified,n,ast);
function logic(s){const ast=parse(s),panel=ast.statements.find(n=>ts.isFunctionDeclaration(n)&&n.name?.text==='GuidePanel');return panel.body.statements.filter(n=>!ts.isReturnStatement(n)).map(n=>print(n,ast));}
function controls(s){const ast=parse(s),values=[];function walk(n){if(ts.isJsxAttribute(n)&&(/^(on[A-Z]|disabled$|checked$)/.test(n.name.text)))values.push(print(n,ast));ts.forEachChild(n,walk);}walk(ast);return values.sort();}
test('Guide state, effects, network calls, activation, approval and Save logic match the before snapshot',()=>assert.deepEqual(logic(source),logic(baseline)));
test('Guide event handlers and disabled/consent guards are unchanged by layout restructuring',()=>assert.deepEqual(controls(source),controls(baseline)));

const trailSource=await readFile(new URL('../app/guide-checkpoint-trail.tsx',import.meta.url),'utf8');
const brandSource=await readFile(new URL('../app/brand-logo.tsx',import.meta.url),'utf8');
const brandAst=parse(brandSource),brand=brandAst.statements.find(n=>ts.isFunctionDeclaration(n)&&n.name?.text==='BrandIcon').getText(brandAst);
let code=ts.transpileModule(trailSource.replace("import {BrandIcon} from './brand-logo';",brand),{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ES2022,jsx:ts.JsxEmit.ReactJSX}}).outputText;
for(const pkg of ['react/jsx-runtime','lucide-react'])code=code.replaceAll(`"${pkg}"`,JSON.stringify(import.meta.resolve(pkg))).replaceAll(`'${pkg}'`,JSON.stringify(import.meta.resolve(pkg)));
code=code.replace("'../shared/guide-view.mjs'",JSON.stringify(new URL('../shared/guide-view.mjs',import.meta.url).href));
const {default:Trail}=await import('data:text/javascript;base64,'+Buffer.from(code).toString('base64'));
const checkpoints=[{id:'a',title:'Museum',category:'Wisata',day:1,date:'2026-11-07',time:'09:00',city:'Kuala Lumpur',at:1},{id:'b',title:'Paid train',category:'Transportasi',day:1,date:'2026-11-07',time:'',zone:'Asia/Kuala_Lumpur',protected:true,at:null}];
const render=(patch={})=>renderToStaticMarkup(React.createElement(Trail,{checkpoints,progress:{current:checkpoints[0]},reached:[],active:false,en:false,onSelect:()=>{},...patch}));
test('trail preview retains every checkpoint and both detail controls; never implies arrival before activation',()=>{
 const html=render();assert.equal((html.match(/<button/g)||[]).length,4);assert.ok(html.includes('Museum'));assert.ok(html.includes('Paid train'));assert.ok(html.includes('Jam belum diisi'));assert.ok(html.includes('Diprioritaskan &amp; dilindungi'));assert.ok(!html.includes('aria-current'));assert.ok(!html.includes('<img'));assert.ok(!html.includes('https://'));
});
test('active trail differentiates schedule-based pin from confirmed arrival without inventing GPS evidence',()=>{
 const scheduled=render({active:true});assert.ok(scheduled.includes('Perkiraan menurut jadwal'));assert.ok(scheduled.includes('aria-current="step"'));assert.ok(scheduled.includes('/branding/sorttrip-icon.svg'));
 const confirmed=render({active:true,reached:['a']});assert.ok(confirmed.includes('Terakhir dikonfirmasi'));assert.ok(!confirmed.includes('Perkiraan menurut jadwal'));
});
test('English trail preserves unknown time and protected-item notices',()=>{
 const html=render({en:true});assert.ok(html.includes('Time not set'));assert.ok(html.includes('Prioritized &amp; protected'));assert.ok(html.includes('Plan preview'));assert.ok(!html.includes('Jam belum diisi'));
});
