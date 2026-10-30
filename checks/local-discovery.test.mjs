import {test} from 'node:test';
import assert from 'node:assert/strict';
import {recommendationCatalog,nearbyRecommendations,destinationAnchor,distanceKm,requestOneShotLocation,recommendationDirections,addRecommendation,localQuestionAnswer} from '../lib/local-discovery.mjs';
import {demoDestinations,initialVideoTrip} from '../lib/video-itinerary.mjs';
import {guideAnswer,destinationGuide} from '../lib/tour-guide.mjs';
const city='Bangkok',country='Thailand',origin={title:'Wat Arun'};
const sample=()=>initialVideoTrip(demoDestinations('Bangkok').destinations,{start:'2026-11-10',days:3,people:3,demo:true});
test('destination default uses sourced catalogue coordinates; food and souvenirs have no invented distance, price or hours',()=>{
 const anchor=destinationAnchor(origin,city,country);assert(anchor);
 const attractions=nearbyRecommendations({city,country,category:'attractions',anchor,excludeName:'Wat Arun'});assert.equal(attractions.length,1);assert.equal(attractions[0].name,'Wat Pho');assert(attractions[0].distanceKm>0&&attractions[0].distanceKm<1);
 for(const category of ['food','popular','souvenirs']){const rows=nearbyRecommendations({city,country,category,anchor});assert(rows.length);assert(rows.every(row=>row.distanceKm===null&&row.priceRange===null&&row.openingHours===null&&row.sources.length>0&&row.halal==='unknown'));}
 assert.equal(destinationAnchor({title:'User pin',geo:{lat:0,lng:0}},city,country),null);
});
test('GPS filters to verified coordinates within radius; no reverse-geocode or claim of worldwide coverage',()=>{
 assert(nearbyRecommendations({city,country,category:'attractions',gps:{lat:13.74,lng:100.49}}).length>0);
 assert.equal(nearbyRecommendations({city,country,category:'food',gps:{lat:13.74,lng:100.49}}).length,0);
 assert.equal(nearbyRecommendations({city,country,category:'attractions',gps:{lat:0,lng:0},includeDemo:true}).length,0);
 assert.equal(distanceKm({lat:0,lng:0},{lat:0,lng:0}),0);assert.equal(distanceKm(null,{lat:0,lng:0}),null);
 assert.throws(()=>nearbyRecommendations({city,country,gps:{lat:91,lng:0}}),/INVALID_GPS/);
});
test('GPS granted/denied/timeout/unavailable uses one bounded request and never watchPosition',async()=>{
 let calls=0;const location=await requestOneShotLocation({getCurrentPosition(success,_error,options){calls++;assert.deepEqual(options,{enableHighAccuracy:false,timeout:8000,maximumAge:0});success({coords:{latitude:13.74,longitude:100.49,accuracy:25}});},watchPosition(){throw Error('Tracking forbidden');}});
 assert.equal(calls,1);assert.equal(location.accuracy,25);
 for(const [code,message] of [[1,'GPS_DENIED'],[3,'GPS_TIMEOUT'],[2,'GPS_UNAVAILABLE']])await assert.rejects(requestOneShotLocation({getCurrentPosition(_success,error){error({code});}}),new RegExp(message));
 await assert.rejects(requestOneShotLocation(undefined),/GPS_UNAVAILABLE/);
 await assert.rejects(requestOneShotLocation({getCurrentPosition(){throw Error('Blocked by browser policy');}}),/GPS_UNAVAILABLE/);
});
test('fixture fallback is opt-in, visibly artificial, has no location/map and never means real coverage',()=>{
 assert.equal(nearbyRecommendations({city:'Unknown city',country:'Unknown',category:'food'}).length,0);
 const [row]=nearbyRecommendations({city:'Unknown city',country:'Unknown',category:'food',includeDemo:true});assert.equal(row.mode,'fixture');assert.equal(row.geo,null);assert.equal(row.locationVerified,false);assert.equal(recommendationDirections(row),null);
});
test('maps only sends sourced destination, never the private GPS origin',()=>{
 const row=recommendationCatalog().find(p=>p.id==='tha-maharaj');const url=new URL(recommendationDirections(row));assert.equal(url.origin,'https://www.google.com');assert.match(url.searchParams.get('destination'),/Tha Maharaj/);assert.equal(url.searchParams.has('origin'),false);
});
test('food/souvenir/cheap/halal Q&A remains destination-specific and admits missing certification and prices',()=>{
 assert.match(localQuestionAnswer('Oleh-oleh khas Bangkok apa?',{city,country}).answer,/sutra Thailand/);
 assert.match(localQuestionAnswer('Tempat makan enak yang murah?',{city,country}).answer,/belum bisa menentukan pilihan termurah/);
 const halal=localQuestionAnswer('Ada makanan halal di sekitar sini?',{city,country});assert(halal.onlyHalal);assert.match(halal.answer,/bukan berarti halal atau nonhalal/);
 assert.match(guideAnswer('Makanan terkenal dekat sini apa?',{guide:destinationGuide(origin,city,country)}).answer,/Wang Lang/);
 assert.match(localQuestionAnswer('Where can I buy souvenirs?',{city,country,language:'en'}).answer,/not live AI/);
 assert.equal(localQuestionAnswer('Explain history',{city,country}),null);
});
test('add-to-itinerary preserves every existing item, avoids duplicates, ignores forged coordinates and retains unknown price',()=>{
 const trip=sample(),protectedHotel={id:'paid-hotel',title:'Hotel fixture',category:'Penginapan',paid:true,aiLocked:true,price:123,time:'18:00',day:1,note:'fixture',bookingUrl:'https://supplier.example/fixture?tracking=unchanged'};trip.items.push(protectedHotel);
 const place=recommendationCatalog().find(p=>p.id==='wang-lang-market');const next=addRecommendation(trip,{...place,geo:{lat:0,lng:0},priceRange:'fiction'},{day:2,time:'12:30'});
 assert.equal(next.items.length,trip.items.length+1);for(const [i,item]of trip.items.entries())assert.strictEqual(next.items[i],item);
 const added=next.items.at(-1);assert.equal(added.category,'Makan');assert.equal(added.geo,undefined);assert.equal(added.price,0);assert(added.priceUnknown);assert.equal(added.day,2);assert.equal(added.time,'12:30');assert(!JSON.stringify(added).includes('accuracy'));
 assert.throws(()=>addRecommendation(next,place,{day:2,time:'13:00'}),/DUPLICATE_PLACE/);
 const saved=JSON.parse(JSON.stringify(next));assert.equal(saved.items.at(-1).title,'Wang Lang Market');assert.equal(saved.items.find(i=>i.id==='paid-hotel').bookingUrl,protectedHotel.bookingUrl);
 for(const options of [{day:0,time:'12:00'},{day:4,time:'12:00'},{day:2,time:'25:00'}])assert.throws(()=>addRecommendation(trip,place,options),/INVALID_VISIT/);
 assert.throws(()=>addRecommendation(trip,place,{day:2,time:'12:00',city:'Hanoi',country:'Vietnam'}),/LOCATION_CHANGED/);
 const arun=recommendationCatalog().find(p=>p.name==='Wat Arun');assert.throws(()=>addRecommendation(trip,arun,{day:2,time:'12:00'}),/DUPLICATE_PLACE/);
});
test('returned recommendation records cannot mutate the source catalogue or create fake verified pins',()=>{
 const record=recommendationCatalog().find(p=>p.id==='wang-lang-market');record.geo={lat:0,lng:0};record.locationVerified=true;record.categories.push('fake');record.sources.push('https://bad.example');
 const fresh=recommendationCatalog().find(p=>p.id===record.id);assert.equal(fresh.geo,null);assert(!fresh.categories.includes('fake'));assert(!fresh.sources.includes('https://bad.example'));
 const added=addRecommendation(sample(),record,{day:2,time:'12:30'}).items.at(-1);assert.equal(added.geo,undefined);
});
test('selected food or souvenir intent survives persistence without inventing prices or modifying booking categories',()=>{
 const venue=recommendationCatalog().find(p=>p.id==='tha-maharaj');
 const food=addRecommendation(sample(),venue,{day:2,time:'12:00',category:'food'}).items.at(-1);
 const shop=JSON.parse(JSON.stringify(addRecommendation(sample(),venue,{day:2,time:'13:00',category:'souvenirs'}))).items.at(-1);
 assert.equal(food.category,'Makan');assert.equal(shop.category,'Wisata');assert.match(shop.note,/Belanja oleh-oleh/);assert(shop.priceUnknown);assert.equal(shop.price,0);
});
