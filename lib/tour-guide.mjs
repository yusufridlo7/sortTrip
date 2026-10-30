// Curated offline context. No inference, prices, opening-hour claims or network.
import {resolvePlace} from './video-itinerary.mjs';
import {localQuestionAnswer} from './local-discovery.mjs';
const arun='https://www.am2026thailand.go.th/explore-bangkok/wat-arun';
const pho='https://www.watpho.org/en/history';
export const guideContent={
 'wat arun':{city:'Bangkok',country:'Thailand',sources:[arun,'https://www.tourismthailand.org/Promotions/65/wat-arun-or-temple-of-dawn-is-located-along-with-chao-phraya-river'],
 id:{intro:'Wat Arun adalah kuil Buddha di tepi Sungai Chao Phraya, Bangkok, yang juga dikenal sebagai Temple of Dawn.',history:'Kuil ini berperan pada era Thonburi dan pernah menyimpan Emerald Buddha sebelum dipindahkan ke Wat Phra Kaew.',culture:'Wat Arun merupakan tempat ibadah aktif. Arsitekturnya mencerminkan seni dan keragaman budaya Thailand.',facts:'Perhatikan dekorasi keramik pada prang atau menara kuil.',etiquette:'Berpakaian sopan dan tutup bahu serta lutut. Ikuti petunjuk petugas di area ibadah.',tips:'Bawa air minum dan pelindung matahari. Periksa rute serta ketentuan kunjungan melalui sumber resmi.'},
 en:{intro:'Wat Arun is a Buddhist temple beside Bangkok’s Chao Phraya River, also known as the Temple of Dawn.',history:'The temple played a role in the Thonburi era and once housed the Emerald Buddha before its move to Wat Phra Kaew.',culture:'Wat Arun is an active place of worship. Its architecture reflects Thai artistry and cultural diversity.',facts:'Look for the ceramic decoration on the temple’s prang, or tower.',etiquette:'Dress respectfully and cover shoulders and knees. Follow staff instructions in worship areas.',tips:'Bring drinking water and sun protection. Check directions and visitor requirements with official sources.'}},
 'wat pho':{city:'Bangkok',country:'Thailand',sources:[pho,'https://www.am2026thailand.go.th/explore-bangkok/wat-pho'],
 id:{intro:'Wat Pho adalah kompleks kuil kerajaan di Bangkok yang dikenal dengan patung Buddha berbaring.',history:'Pemugaran besar dilakukan pada masa Raja Rama I dan Rama III.',culture:'Kompleks ini berkaitan dengan pelestarian pengetahuan, ajaran Buddha, dan pengobatan tradisional Thailand.',facts:'Patung Buddha berbaring menjadi salah satu bagian utama kunjungan.',etiquette:'Berpakaian sopan. Hormati orang yang sedang beribadah dan ikuti aturan di setiap bangunan.',tips:'Bawa air minum dan periksa informasi pengunjung resmi sebelum berangkat.'},
 en:{intro:'Wat Pho is a royal temple complex in Bangkok known for its reclining Buddha.',history:'Major restoration took place during the reigns of King Rama I and King Rama III.',culture:'The complex is associated with preserving knowledge, Buddhist teachings and traditional Thai medicine.',facts:'The reclining Buddha is a major highlight of a visit.',etiquette:'Dress respectfully. Give worshippers space and follow the rules in each building.',tips:'Bring drinking water and check official visitor information before setting out.'}}
};
const normalize=value=>String(value||'').normalize('NFKC').trim().toLowerCase();
export function destinationGuide(item,city='',country='',lang='id'){
 const name=item.place||item.title||'';
 const identity=resolvePlace(name,city,country)?.id;
 const content=guideContent[identity==='curated:wat-arun'?'wat arun':identity==='curated:wat-pho'?'wat pho':normalize(name)];
 const match=content&&normalize(city)===normalize(content.city)&&normalize(country)===normalize(content.country);
 const unknown=lang==='en'?'Verified destination information is not available yet. Check the location and official sources.':'Informasi destinasi terverifikasi belum tersedia. Periksa lokasi dan sumber resmi.';
 return {name,city,country,sources:match?content.sources:[],curated:!!match,image:match&&content===guideContent['wat arun']?'/bangkok.jpg':undefined,
  text:match?content[lang==='en'?'en':'id']:{intro:unknown,history:unknown,culture:unknown,facts:unknown,etiquette:lang==='en'?'Follow posted local rules.':'Ikuti aturan setempat yang terpasang.',tips:unknown}};
}
export function guideAnswer(question,{guide,lang='id',history=[]}){
 const local=localQuestionAnswer(question,{city:guide.city,country:guide.country,language:lang});
 if(local)return {question:String(question).slice(0,500),answer:local.answer,topic:local.topic,destination:guide.name,mode:local.mode,sources:local.sources};
 const q=normalize(question).slice(0,500),en=lang==='en';
 const unknown=en?'I do not have verified information for that question. Please check the official source.':'Saya belum memiliki informasi terverifikasi untuk pertanyaan itu. Silakan periksa sumber resmi.';
 let topic=/harga|tarif|tiket|buka|tutup|jam|price|cost|ticket|open|clos|hour/.test(q)?'commercial':/sejarah|history|dulu|past/.test(q)?'history':/aturan|pakaian|etika|rule|dress|etiquette/.test(q)?'etiquette':/budaya|cultur/.test(q)?'culture':/fakta|menarik|fact|highlight/.test(q)?'facts':/tips|saran|advice/.test(q)?'tips':/sekitar|nearby/.test(q)?'nearby':/dawn|arun|nama|name/.test(q)?'name':null;
 if(!topic&&/lagi|lanjut|jelaskan|more|continue|explain/.test(q))topic=history.at(-1)?.topic;
 let answer=unknown;
 if(topic==='commercial')answer=en?'Current prices, availability and opening hours have not been verified. Check the supplier or official visitor information.':'Harga, ketersediaan, dan jam buka terkini belum terverifikasi. Periksa supplier atau informasi pengunjung resmi.';
 else if(guide.curated&&['intro','history','culture','facts','etiquette','tips'].includes(topic))answer=guide.text[topic];
 else if(guide.curated&&topic==='name')answer=guide.text.intro+' '+(en?'The detailed origin of the name is not established in this guide.':'Asal-usul rinci nama belum dipastikan dalam panduan ini.');
 else if(guide.curated&&topic==='nearby')answer=en?'Wat Arun and Wat Pho are Bangkok landmarks. Check the map for the river crossing; routes, schedules and fares are not verified.':'Wat Arun dan Wat Pho adalah landmark Bangkok. Periksa peta untuk penyeberangan sungai; rute, jadwal dan tarif belum terverifikasi.';
 return {question:String(question).slice(0,500),answer,topic:topic||'unknown',destination:guide.name,mode:'curated-demo',sources:guide.sources};
}
export function guideMap(item,city,country,directions=false){
 const target=[item.place||item.title,city,country].filter(Boolean).join(', ');
 return 'https://www.google.com/maps/'+(directions?'dir/?api=1&destination=':'search/?api=1&query=')+encodeURIComponent(target);
}
export function createNarrator(speech,Utterance,onState=()=>{}){
 let current=null;
 const supported=!!speech&&typeof Utterance==='function';
 function stop(){if(current){current.onend=null;current.onerror=null;speech.cancel();current=null;}onState('idle');}
 return {supported,stop,
  play(text,lang){if(!supported){onState('unsupported');return;}stop();current=new Utterance(text);current.lang=lang==='en'?'en-GB':'id-ID';const voice=speech.getVoices?.().find(v=>v.lang.toLowerCase().startsWith(lang));if(voice)current.voice=voice;current.onend=()=>{current=null;onState('idle');};current.onerror=()=>{current=null;onState('error');};speech.speak(current);onState('playing');},
  pause(){if(current){speech.pause();onState('paused');}},resume(){if(current){speech.resume();onState('playing');}}
 };
}
