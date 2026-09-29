import {test} from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,readFile,writeFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {pathToFileURL} from 'node:url';
import ts from 'typescript';
const tmp=await mkdtemp(join(tmpdir(),'sorttrip-test-'));
let api,travel;
try{
 for(const name of ['travel-data','api-flights']){const src=await readFile(new URL('../app/'+name+'.ts',import.meta.url),'utf8');const js=ts.transpileModule(src,{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ES2022}}).outputText.replace("'./travel-data'","'./travel-data.mjs'");await writeFile(join(tmp,name+'.mjs'),js);}
 api=await import(pathToFileURL(join(tmp,'api-flights.mjs')));travel=await import(pathToFileURL(join(tmp,'travel-data.mjs')));
}finally{await rm(tmp,{recursive:true,force:true});}
const q={origin:'CGK',destination:'kl',journey:'return',minDays:3,maxDays:5,people:2,budget:5000000};
const f={id:'real',destinationId:'kl',origin:'CGK',destination:'KUL',start:'2027-01-10',end:'2027-01-13',days:4,price:1234567,airline:'AK',flightNumber:'381',departureAt:'2027-01-10T07:00:00+07:00',returnAt:'2027-01-13T18:00:00+08:00',durationTo:120,durationBack:130,transfers:0,bookingUrl:'https://www.aviasales.com/search/example'};
test('API itinerary preserves actual returned fare and link, budgets use correct group multiplier',()=>{const t=api.apiTrip(f,q);assert.equal(t.flight.source,'aviasales');assert.equal(t.flight.depart,'07:00');assert.equal(t.flight.arrive,'10:00');assert.equal(t.days,4);const item=t.items.find(x=>x.id==='flight');assert.equal(item.price,f.price);assert.equal(item.bookingUrl,f.bookingUrl);assert.ok(!item.note.includes('simulasi'));assert.ok(t.items.filter(x=>x.category==='Wisata').length>=2);assert.equal(travel.costs(t).total,t.items.reduce((a,x)=>a+x.price*(x.shared?1:2),0));assert.equal(JSON.parse(JSON.stringify(t)).flight.source,'aviasales');});
test('one-way stays one-way and unknown times not invented',()=>{const t=api.apiTrip({...f,end:'',returnAt:null,durationTo:null},{...q,journey:'oneway'});assert.equal(t.journey,'oneway');assert.equal(t.days,3);assert.equal(t.flight.arrive,'--:--');assert.equal(t.flight.duration,0);assert.ok(!t.items.some(x=>x.returnLeg));});
