import {placeCatalog,resolvePlace} from './video-itinerary.mjs';
// Offline reference snapshots, not live inventory, popularity ranking or offers.
const bangkok='https://invest.bangkok.go.th/shopping-mall/';
const location='https://www.thamaharaj.com/location';
const markets=[
 {id:'wang-lang-market',name:'Wang Lang Market',city:'Bangkok',country:'Thailand',categories:['food','popular'],address:'Bangkok Noi, Bangkok, Thailand',locationVerified:true,sources:[bangkok,'https://www.tourismthailand.org/Attraction/wang-lang-market-2'],description:{id:'Pasar di kawasan Bangkok Noi. Pilih gerai setelah memeriksa menu dan bahan; harga serta status halal belum diverifikasi.',en:'A market in Bangkok Noi. Check individual stalls, menus and ingredients; prices and halal status are not verified.'}},
 {id:'tha-maharaj',name:'Tha Maharaj',city:'Bangkok',country:'Thailand',categories:['food','popular','souvenirs'],address:'1/11 Trok Mahathat, Maharaj Road, Phra Nakorn, Bangkok 10200, Thailand',locationVerified:true,sources:[location,'https://www.thamaharaj.com/shops-restaurants'],description:{id:'Area pertokoan dan restoran di tepi sungai. Periksa direktori toko dan jenis barang sebelum berkunjung; stok oleh-oleh belum diketahui.',en:'Riverside shops and restaurants. Check the directory and individual shops before visiting; souvenir stock is unknown.'}},
 {id:'old-siam',name:'The Old Siam',city:'Bangkok',country:'Thailand',categories:['souvenirs'],address:'Bangkok, Thailand',locationVerified:false,sources:[bangkok],description:{id:'Referensi pemerintah Bangkok menyebut sutra Thailand, kerajinan dan makanan ringan tradisional. Pin lokasi dan stok belum diverifikasi.',en:'Bangkok’s government guide lists Thai silk, handicrafts and traditional snacks. The map pin and stock have not been verified.'}}
].map(row=>({...row,mode:'curated',checkedAt:'2026-10-28',halal:'unknown',geo:null,priceRange:null,openingHours:null}));
const norm=value=>String(value||'').normalize('NFKC').trim().toLowerCase().replace(/\s+/g,' ');
export const categories=['food','popular','souvenirs','attractions'];
export function validCoordinates(geo){return !!geo&&Number.isFinite(geo.lat)&&Number.isFinite(geo.lng)&&Math.abs(geo.lat)<=90&&Math.abs(geo.lng)<=180;}
export function distanceKm(a,b){if(!validCoordinates(a)||!validCoordinates(b))return null;const r=Math.PI/180,dlat=(b.lat-a.lat)*r,dlng=(b.lng-a.lng)*r;const s=Math.sin(dlat/2)**2+Math.cos(a.lat*r)*Math.cos(b.lat*r)*Math.sin(dlng/2)**2;return 6371*2*Math.asin(Math.sqrt(Math.min(1,Math.max(0,s))));}
export function recommendationCatalog(){return [...markets.map(p=>({...p,categories:[...p.categories],sources:[...p.sources],description:{...p.description}})),...placeCatalog.map(p=>({id:p.id,name:p.names[0],city:p.city,country:p.country,categories:['attractions'],address:[p.names[0],p.city,p.country].join(', '),geo:{...p.geo},locationVerified:true,mode:'curated',sources:[p.sourceUrl],checkedAt:'2026-10-28',halal:'unknown',priceRange:null,openingHours:null,description:{id:'Lokasi dari katalog referensi SortTrip. Tarif dan jam buka belum diverifikasi.',en:'A location from SortTrip’s reference catalogue. Admission prices and opening hours are not verified.'}}))];}
export function destinationAnchor(item,city,country){const place=resolvePlace(item.place||item.title,city,country);if(place)return place.geo;const known=markets.find(p=>norm(p.name)===norm(item.place||item.title)&&norm(p.city)===norm(city)&&norm(p.country)===norm(country));return known?.locationVerified&&validCoordinates(known.geo)?known.geo:null;}
export function demoRecommendations(city,country,category){return [{id:'demo-'+category,name:category==='souvenirs'?'Contoh toko oleh-oleh (DEMO)':'Contoh tempat lokal (DEMO)',city,country,categories:[category],address:'',geo:null,locationVerified:false,mode:'fixture',sources:[],checkedAt:null,halal:'unknown',priceRange:null,openingHours:null,description:{id:'Fixture untuk mencoba alur. Bukan bisnis atau lokasi nyata yang direkomendasikan.',en:'A workflow fixture, not a recommendation for a real business or location.'}}];}
export function nearbyRecommendations({city,country,category='food',anchor=null,gps=null,radiusKm=10,includeDemo=false,excludeName=''}){
 if(!categories.includes(category))throw Error('INVALID_CATEGORY');
 if(gps&&!validCoordinates(gps))throw Error('INVALID_GPS');
 const radius=Number.isFinite(radiusKm)&&radiusKm>0?Math.min(50,radiusKm):10;
 let rows=recommendationCatalog().filter(p=>norm(p.city)===norm(city)&&norm(p.country)===norm(country)&&p.categories.includes(category)&&norm(p.name)!==norm(excludeName));
 rows=rows.map(p=>({...p,distanceKm:p.locationVerified?distanceKm(gps||anchor,p.geo):null}));
 // GPS mode cannot claim that city/address-only records are close to a person.
 if(gps)rows=rows.filter(p=>p.distanceKm!==null&&p.distanceKm<=radius);
 rows.sort((a,b)=>(a.distanceKm??Infinity)-(b.distanceKm??Infinity)||a.name.localeCompare(b.name));
 if(!rows.length&&includeDemo&&!gps)rows=demoRecommendations(city,country,category).map(p=>({...p,distanceKm:null}));
 return rows;
}
export function recommendationDirections(place){if(place.mode==='fixture')return null;const destination=place.locationVerified&&validCoordinates(place.geo)?`${place.geo.lat},${place.geo.lng}`:[place.name,place.address||place.city,place.country].join(', ');return 'https://www.google.com/maps/dir/?api=1&destination='+encodeURIComponent(destination);}
export function requestOneShotLocation(geolocation){return new Promise((resolve,reject)=>{
 if(!geolocation?.getCurrentPosition){reject(Error('GPS_UNAVAILABLE'));return;}
 try{geolocation.getCurrentPosition(position=>{const {latitude:lat,longitude:lng,accuracy}=position.coords||{};if(!validCoordinates({lat,lng})||!Number.isFinite(accuracy)||accuracy<0){reject(Error('GPS_UNAVAILABLE'));return;}resolve({lat,lng,accuracy});},error=>reject(Error(error.code===1?'GPS_DENIED':error.code===3?'GPS_TIMEOUT':'GPS_UNAVAILABLE')),{enableHighAccuracy:false,timeout:8000,maximumAge:0});}catch{reject(Error('GPS_UNAVAILABLE'));}
});}
export function localQuestionAnswer(question,{city,country,language='id'}){
 const q=norm(question),en=language==='en';if(!/makan|kuliner|oleh.?oleh|souvenir|food|eat|restaurant|halal|local dishes/.test(q))return null;
 const category=/oleh.?oleh|souvenir/.test(q)?'souvenirs':/terkenal|populer|famous|popular|khas/.test(q)?'popular':'food';
 const onlyHalal=/halal/.test(q),cheap=/murah|cheap|budget|affordable/.test(q);
 const rows=nearbyRecommendations({city,country,category});
 const names=rows.map(p=>p.name).join(', ');
 let answer=rows.length?(en?`Saved references for ${city}: ${names}. These are not live AI recommendations.`:`Referensi tersimpan untuk ${city}: ${names}. Ini bukan rekomendasi AI langsung.`):(en?'No sourced recommendations are available for this destination yet.':'Belum ada rekomendasi tersumber untuk destinasi ini.');
 if(category==='souvenirs'&&rows.some(p=>p.id==='old-siam'))answer+=' '+(en?'The city guide lists Thai silk, handicrafts and traditional snacks at The Old Siam; current stock is unknown.':'Panduan kota menyebut sutra Thailand, kerajinan dan makanan ringan tradisional di The Old Siam; stok saat ini belum diketahui.');
 if(onlyHalal)answer=en?'No halal certification has been verified in this dataset. Unknown status does not mean halal or non-halal. Check certification with the venue.':'Belum ada bukti sertifikasi halal terverifikasi pada data ini. Status belum diketahui bukan berarti halal atau nonhalal. Periksa sertifikasi langsung pada tempatnya.';
 if(cheap)answer+=' '+(en?'Prices are unavailable, so I cannot identify the cheapest option.':'Harga belum tersedia, jadi saya belum bisa menentukan pilihan termurah.');
 return {answer,category,onlyHalal,topic:'local-'+category,destination:city,mode:'curated-reference',sources:[...new Set(rows.flatMap(p=>p.sources))]};
}
export function alreadyInTrip(trip,place){return trip.items.some(item=>item.id==='local-'+place.id||(norm(item.place||item.title)===norm(place.name)&&norm(item.locationCity||trip.destinationMeta?.city)===norm(place.city))||resolvePlace(item.place||item.title,item.locationCity||trip.destinationMeta?.city,trip.destinationMeta?.country)?.id===place.id);}
export function addRecommendation(trip,place,{day,time,language='id',city=trip.destinationMeta?.city,country=trip.destinationMeta?.country,category=place.categories?.[0]}={}){
 if(!trip||!Array.isArray(trip.items)||trip.items.length>=300||!Number.isInteger(day)||day<1||day>trip.days||!/^([01]\d|2[0-3]):[0-5]\d$/.test(time||''))throw Error('INVALID_VISIT');
 // Re-resolve the record; never persist caller-supplied coordinates/prices/GPS.
 const known=place.mode==='fixture'?demoRecommendations(city,country,place.categories?.[0]).find(p=>p.id===place.id):recommendationCatalog().find(p=>p.id===place.id);
 if(!known||!categories.includes(category)||!known.categories.includes(category)||norm(known.city)!==norm(city)||norm(known.country)!==norm(country))throw Error('LOCATION_CHANGED');
 if(alreadyInTrip(trip,known))throw Error('DUPLICATE_PLACE');
 const en=language==='en',purpose=(en?{food:'Food',popular:'Local food',souvenirs:'Souvenir shopping',attractions:'Sightseeing'}:{food:'Makanan',popular:'Kuliner',souvenirs:'Belanja oleh-oleh',attractions:'Wisata'})[category];
 const note=(known.mode==='fixture'?'DEMO FIXTURE · ':'')+purpose+' · '+(en?'Added from local discovery. Prices, hours and halal status are not verified.':'Ditambahkan dari Jelajahi Sekitar. Harga, jam buka dan status halal belum terverifikasi.');
 const label=known.mode==='fixture'&&en?(category==='souvenirs'?'Example souvenir shop (DEMO)':'Example local place (DEMO)'):known.name;
 const item={id:'local-'+known.id,title:label,place:label,locationCity:known.city,category:['food','popular'].includes(category)?'Makan':'Wisata',price:0,priceUnknown:true,paid:false,day,time,note,...(known.locationVerified&&validCoordinates(known.geo)?{geo:{...known.geo}}:{}),...(known.sources[0]?{sourceUrl:known.sources[0]}:{})};
 return {...trip,items:[...trip.items,item],estimateIncomplete:true};
}
