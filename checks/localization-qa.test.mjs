import {test} from 'node:test';
import assert from 'node:assert/strict';
import {actualI18n as ui} from './i18n-loader.mjs';
import {translateMessage,priceWatchEmail} from '../worker/localization.js';
test('English counts distinguish one city, traveller, room, adult, review and stop',async()=>{
 await ui.default.changeLanguage('en');
 for(const [key,one,many]of [['flight_city_count','1 city available','2 cities available'],['people','1 person','2 people'],['rooms_count','1 room','2 rooms'],['adults_count','1 adult','2 adults'],['hotel_reviews_count','1 review','2 reviews'],['flight_stops','1 stop','2 stops']]){assert.equal(ui.tr(key,{count:1}),one);assert.equal(ui.tr(key,{count:2}),many);}
 assert.equal(ui.tr('local_connection_count',{count:1}),'1 local connection · recommended ±');assert.equal(ui.tr('local_connection_count',{count:2}),'2 local connections · recommended ±');
 assert.equal(ui.tr('flight_plan_action'),'Plan this trip');assert.equal(ui.label('Pesawat'),'Flights');assert.equal(ui.label('Penginapan'),'Accommodation');assert.equal(ui.label('Singapura'),'Singapore');await ui.default.changeLanguage('id');
});
test('fixed regional and Price Watch diagnostics follow English while preserving machine codes',async()=>{
 assert.equal(translateMessage('Wilayah pencarian tidak valid.','en'),'Choose a valid search region.');
 assert.equal(translateMessage('Price Watch memerlukan Trip Pass aktif untuk akun ini','en'),'Price Watch requires an active Trip Pass for this account.');
 await ui.default.changeLanguage('en');assert.equal(ui.label('Pemantauan mendukung perjalanan 2–14 hari'),'Price Watch supports trips lasting 2–14 days.');assert.match(ui.formatMoney(300000),/300,000/);await ui.default.changeLanguage('id');assert.match(ui.formatMoney(300000),/300\.000/);
});
test('transactional email is natural English with unchanged currency, amount and destination',()=>{
 const data={old_price:1000000,price:900000,booking_url:'https://www.aviasales.com/search/example'};const email=priceWatchEmail(data,'en');assert.match(email.text,/IDR\s*1,000,000/);assert.match(email.text,/IDR\s*900,000/);assert.ok(email.text.includes(data.booking_url));assert.ok(!/harga|penerbangan|dewasa/.test(email.text));
});
