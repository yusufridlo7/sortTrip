import {test} from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,readFile,writeFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {pathToFileURL} from 'node:url';
import ts from 'typescript';
const dir=await mkdtemp(join(tmpdir(),'sorttrip-day-settings-'));
let data,city;
try{
 for(const name of ['travel-data','transport-data','cities']){
  const source=await readFile(new URL('../app/'+name+'.ts',import.meta.url),'utf8');
  const js=ts.transpileModule(source,{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ES2022}}).outputText.replace(/(['"])\.\/(travel-data|transport-data|cities)\1/g,"'./$2.mjs'");
  await writeFile(join(dir,name+'.mjs'),js);
 }
 data=await import(pathToFileURL(join(dir,'travel-data.mjs')));city=await import(pathToFileURL(join(dir,'cities.mjs')));
}finally{await rm(dir,{recursive:true,force:true});}
const trip=()=>data.makeTrip(data.destinations[0],'CGK','2027-01-01',4,2,6000000);
test('changing a city recommends lodging near its visits without overwriting other nights',()=>{
 const t=trip(),changed=city.reviseCities(t,2,2,'melaka');
 assert.equal(city.cityAt(changed,2).id,'melaka');const h=city.hotelAt(changed,2);
 assert.equal(h.cityId,'melaka');assert.match(h.title,/Area penginapan/);assert.match(h.note,/Jarak garis lurus/);assert.match(h.note,/bukan tarif/);
 assert.notDeepEqual(h.geo,city.cityById('melaka').center);
 assert.equal(city.hotelAt(changed,1).title,city.hotelAt(t,1).title);
 assert.equal(city.hotelAt(changed,3).title,city.hotelAt(t,3).title);
 assert.equal(changed.items.filter(x=>x.category==='Penginapan').length,3);
 assert.equal(changed.items.find(x=>x.category==='Pesawat').price,t.items.find(x=>x.category==='Pesawat').price);
});
test('same-city save is a no-op and preserves manual activities',()=>{const t=trip();assert.equal(city.reviseCities(t,2,2,'kl'),t);});
test('paid hotel and return itinerary constraints are preserved',()=>{
 const t=trip();t.items.find(x=>x.category==='Penginapan').paid=true;
 assert.throws(()=>city.reviseCities(t,2,2,'melaka'),/dibayar/);
 assert.throws(()=>city.reviseCities(trip(),1,1,'melaka'),/kedatangan/);
 assert.throws(()=>city.reviseCities(trip(),4,4,'melaka'),/PP/);
});
test('lodging selection balances last visit and following visit in the same city',()=>{
 const c={id:'test',name:'Test',center:{lat:0,lng:0},places:[{name:'Far',category:'Penginapan',geo:{lat:0,lng:0},price:10},{name:'Near',category:'Penginapan',geo:{lat:0,lng:.02},price:20}]};
 const visit=(id,day,lng,cityId='test')=>({id,title:id,cityId,day,time:'12:00',category:'Wisata',geo:{lat:0,lng},paid:false,price:0,note:''});
 const r=city.recommendStay(c,[visit('Before',2,.01),visit('After',3,.03),visit('Different city',3,0,'other')],2);
 assert.equal(r.place.name,'Near');assert.match(r.note,/Before/);assert.match(r.note,/After/);assert.ok(!r.note.includes('Different city'));
});
