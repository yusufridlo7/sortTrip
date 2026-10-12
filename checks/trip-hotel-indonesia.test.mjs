import {test} from 'node:test';
import assert from 'node:assert/strict';
import {hotelPropertyUrl,datedHotelUrl,checkedHotelQuote,hotelNavigationAllowed} from '../worker/trip-hotel-browser.js';
const target={id:'qa',title:'Sleeping Lion Suites',category:'Penginapan',sourceUrl:'https://id.trip.com/hotels/kuala-lumpur-hotel-detail-104384927/sleeping-lion-suites/',checkin:'2026-10-19',checkout:'2026-10-20',rooms:1};
const text='Harga terendah hari ini\nTidak dapat di-refund\nPrabayar online\n2 dewasa\nRp780.195\nRp1.033.551\nTotal harga: Rp886.447\nTermasuk pajak & biaya lainnya\nPesan';
const observed={url:datedHotelUrl(target,1),hotel:target.title,checkinLabel:'Sen, 19 Okt',checkoutLabel:'Sel, 20 Okt',guests:'1 kamar, 1 Dewasa, 0 Anak',nights:1,offers:[{roomType:'Kamar Junior Premier',text}]};
test('Indonesian public room total includes taxes and does not use headline or crossed-out price',()=>{
 assert.equal(hotelPropertyUrl(target.sourceUrl),target.sourceUrl);
 assert.equal(new URL(observed.url).searchParams.get('checkin'),target.checkin);
 assert.equal(checkedHotelQuote(target,1,observed).amountIDR,886447);
 assert.equal(checkedHotelQuote(target,1,observed).policy,'Tidak dapat di-refund');
 for(const bad of ['Rp886,44','Rp886.447,00','Rp886,447.00','Rp886.44.7','USD886.447'])assert.equal(checkedHotelQuote(target,1,{...observed,offers:[{roomType:'Kamar',text:text.replace('Rp886.447',bad)}]}),null);
});
test('Indonesian quote requires exact guest/date context and inclusive public price',()=>{
 for(const change of [{nights:2},{guests:'1 kamar, 2 Dewasa, 0 Anak'},{hotel:'Other Hotel'},{checkinLabel:'Sel, 20 Okt',checkoutLabel:'Rab, 21 Okt'},{checkinLabel:undefined},{url:observed.url+'&checkIn=2026-10-18'}])assert.equal(checkedHotelQuote(target,1,{...observed,...change}),null);
 for(const bad of [text.replace('Termasuk pajak & biaya lainnya','Belum termasuk pajak'),text+'\nPromo pemesanan pertama',text+'\nKhusus anggota',text+'\nKode promo',text.replace('Total harga: Rp886.447','Total harga:')])assert.equal(checkedHotelQuote(target,1,{...observed,offers:[{roomType:'Kamar',text:bad}]}),null);
});
test('navigation allows only intended public property and landing; account, checkout and spoofed domains blocked',()=>{
 assert.equal(hotelNavigationAllowed(observed.url,observed.url),true);
 assert.equal(hotelNavigationAllowed('https://id.trip.com/hotels/?curr=IDR',observed.url),true);
 for(const bad of ['https://id.trip.com/account/login','https://id.trip.com/hotels/book/','https://id.trip.com.evil.test/hotels/','https://id.trip.com:8443/hotels/','https://user:pass@id.trip.com/hotels/'])assert.equal(hotelNavigationAllowed(bad,observed.url),false);
});
