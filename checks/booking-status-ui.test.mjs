import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import ts from 'typescript';
import {resolveI18n,actualI18n} from './i18n-loader.mjs';
import {bookingItemKey} from '../worker/booking-identity.mjs';
const uri=code=>'data:text/javascript;base64,'+Buffer.from(code).toString('base64');
const transpile=source=>ts.transpileModule(source,{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ES2022,jsx:ts.JsxEmit.ReactJSX}}).outputText;
const receiptCode=transpile(await readFile(new URL('../app/booking-receipts.ts',import.meta.url),'utf8')).replace('../worker/booking-identity.mjs',new URL('../worker/booking-identity.mjs',import.meta.url).href);
const evidenceUri=uri('let receipts=[];export const setRows=value=>{receipts=value};export const useBookingEvidence=()=>({receipts});');
const evidence=await import(evidenceUri);
let code=resolveI18n(transpile(await readFile(new URL('../app/booking-status.tsx',import.meta.url),'utf8')));
code=code.replace(/(['"])\.\/booking-evidence\1/g,JSON.stringify(evidenceUri)).replace(/(['"])\.\/booking-receipts\1/g,JSON.stringify(uri(receiptCode))).replace(/(['"])\.\/i18n\/narratives\1/g,JSON.stringify(uri('export const useNarrative=()=>v=>v;')));
for(const pkg of ['react','react/jsx-runtime','lucide-react'])code=code.replaceAll(JSON.stringify(pkg),JSON.stringify(import.meta.resolve(pkg))).replaceAll("'"+pkg+"'",JSON.stringify(import.meta.resolve(pkg)));
const {default:BookingStatus}=await import(uri(code));
const item={id:'hotel',category:'Penginapan',provider:'LiteAPI',hotelId:'lp_test',checkin:'2027-01-30',checkout:'2027-02-01',title:'Test hotel',paid:false};
const trip={id:'trip-fixture',people:1,items:[item]};
test('manual, affiliate-reported and supplier-confirmed statuses remain distinct in ID and EN',async()=>{
 for(const lang of ['id','en']){
  await actualI18n.default.changeLanguage(lang);
  const render=current=>renderToStaticMarkup(React.createElement(BookingStatus,{item:current,trip,onChange:()=>{}}));
  evidence.setRows([]);const forged=render({...item,paid:true,purchaseSource:'provider'});assert.ok(!/Reservasi terkonfirmasi|Reservation confirmed/.test(forged));
  assert.match(render({...item,paid:true}),lang==='id'?/Ditandai pengguna/:/Marked by traveller/);
  evidence.setRows([{tripId:trip.id,itemId:item.id,matchKey:bookingItemKey(trip,item),provider:'LiteAPI',state:'confirmed'}]);
  const confirmed=render(item);assert.match(confirmed,lang==='id'?/Reservasi terkonfirmasi/:/Reservation confirmed/);assert.ok(!confirmed.includes('<button'));
  evidence.setRows([{tripId:trip.id,itemId:item.id,matchKey:bookingItemKey(trip,item),provider:'Travelpayouts',state:'reported'}]);
  const reported=render(item);assert.match(reported,lang==='id'?/Pembelian terlapor mitra/:/Purchase reported by partner/);assert.match(reported,/<button/);assert.match(reported,/PNR/);
  evidence.setRows([{tripId:trip.id,itemId:item.id,matchKey:bookingItemKey(trip,item),provider:'LiteAPI',state:'cancelled'}]);
  assert.match(render(item),/refund/);
 }
 evidence.setRows([]);await actualI18n.default.changeLanguage('id');
});
