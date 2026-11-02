// Deterministic Guide state, independent of editor, booking and AI generation.
const zones={KUL:'Asia/Kuala_Lumpur',SIN:'Asia/Singapore',DMK:'Asia/Bangkok',BKK:'Asia/Bangkok',HAN:'Asia/Ho_Chi_Minh',SGN:'Asia/Ho_Chi_Minh',DAD:'Asia/Ho_Chi_Minh',CGK:'Asia/Jakarta',SUB:'Asia/Jakarta',DPS:'Asia/Makassar',DJB:'Asia/Jakarta',JOG:'Asia/Jakarta',MNL:'Asia/Manila',PNH:'Asia/Phnom_Penh',REP:'Asia/Phnom_Penh',VTE:'Asia/Vientiane',RGN:'Asia/Yangon',BWN:'Asia/Brunei'};
const text=(v,n=180)=>typeof v==='string'?v.slice(0,n):'';
function publicSource(value){try{const url=new URL(value);if(url.protocol!=='https:'||url.username||url.password||[...url.searchParams.keys()].some(k=>/token|key|auth|session|signature|credential/i.test(k)))return '';return url.href.slice(0,1500);}catch{return '';}}
export const protectedItem=x=>x.paid===true||x.bookingHold===true||x.aiLocked===true;
export const validGeo=p=>!!p&&Number.isFinite(p.lat)&&Number.isFinite(p.lng)&&Math.abs(p.lat)<=90&&Math.abs(p.lng)<=180;
export function validZone(zone){try{return typeof zone==='string'&&!!new Intl.DateTimeFormat('en',{timeZone:zone}).format(0);}catch{return false;}}
export function defaultGuideZone(trip){return zones[trip.destinationMeta?.code||trip.flight?.destinationCode||({kl:'KUL',sin:'SIN',bkk:'BKK'}[trip.destination])]||'';}
export function guideSnapshot(trip){
 if(!trip||!trip.id||!Array.isArray(trip.items)||trip.items.length>300||!/^\d{4}-\d{2}-\d{2}$/.test(trip.start)||!Number.isInteger(trip.days)||trip.days<1||trip.days>365)throw Error('GUIDE_TRIP_INVALID');
 if(!Number.isFinite(Date.parse(trip.start+'T12:00:00Z'))||new Date(trip.start+'T12:00:00Z').toISOString().slice(0,10)!==trip.start||trip.items.some(x=>!x||typeof x.id!=='string'||!x.id||x.id.length>120||!Number.isInteger(x.day)||x.day<1||x.day>trip.days)||new Set(trip.items.map(x=>x.id)).size!==trip.items.length)throw Error('GUIDE_TRIP_INVALID');
 return {id:trip.id,start:trip.start,days:trip.days,people:trip.people,budget:trip.budget,city:text(trip.destinationMeta?.city||({kl:'Kuala Lumpur',bkk:'Bangkok',sin:'Singapore'}[trip.destination])||trip.destination,100),country:text(trip.destinationMeta?.country||'',80),origin:text(trip.origin,3),zone:defaultGuideZone(trip),arrival:text(trip.flight?.arrive,5),arrivalDay:trip.flight?.arrivalDay||0,returnAt:text(trip.flight?.returnAt,35),oneWay:trip.journey==='oneway',items:trip.items.map(x=>({id:text(x.id,120),title:text(x.title),category:text(x.category,30),day:x.day,time:text(x.time,5),city:text(x.locationCity||'',100),place:text(x.place||x.title),from:text(x.fromPlace),to:text(x.toPlace),mode:text(x.mode,80),protected:protectedItem(x),paid:x.paid===true,priceUnknown:x.priceUnknown===true,price:Number.isFinite(x.price)?x.price:null,shared:!!x.shared,checkin:text(x.checkin,10),checkout:text(x.checkout,10),geo:validGeo(x.geo)?{lat:x.geo.lat,lng:x.geo.lng}:null,sourceUrl:publicSource(x.sourceUrl)})).sort((a,b)=>a.id.localeCompare(b.id))};
}
export async function guideRevision(snapshot){const digest=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(JSON.stringify(snapshot)));return Array.from(new Uint8Array(digest),x=>x.toString(16).padStart(2,'0')).join('');}
function parts(ms,zone){return Object.fromEntries(new Intl.DateTimeFormat('en-CA',{timeZone:zone,year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',hourCycle:'h23'}).formatToParts(new Date(ms)).filter(p=>p.type!=='literal').map(p=>[p.type,p.value]));}
export function zonedInstant(date,time,zone){
 if(!/^\d{4}-\d{2}-\d{2}$/.test(date)||!/^([01]\d|2[0-3]):[0-5]\d$/.test(time)||!validZone(zone))return null;
 const target=Date.parse(date+'T'+time+':00Z');if(!Number.isFinite(target)||new Date(target).toISOString().slice(0,10)!==date)return null;let instant=target;
 for(let i=0;i<3;i++){const p=parts(instant,zone);instant+=target-Date.parse(`${p.year}-${p.month}-${p.day}T${p.hour}:${p.minute}:00Z`);}
 const p=parts(instant,zone);return `${p.year}-${p.month}-${p.day}`===date&&`${p.hour}:${p.minute}`===time?instant:null;
}
export function guideCheckpoints(snapshot,zone){
 if(!validZone(zone))throw Error('GUIDE_ZONE_REQUIRED');
 return snapshot.items.map(x=>{const date=new Date(Date.parse(snapshot.start+'T12:00:00Z')+(x.day-1)*86400000).toISOString().slice(0,10);const itemZone=x.category==='Pesawat'&&x.id==='flight'?(zones[snapshot.origin]||zone):zone;return {...x,date,zone:itemZone,at:zonedInstant(date,x.time,itemZone)};}).sort((a,b)=>(a.at??Infinity)-(b.at??Infinity)||a.id.localeCompare(b.id));
}
export function distanceMeters(a,b){if(!validGeo(a)||!validGeo(b))return null;const rad=n=>n*Math.PI/180,dlat=rad(b.lat-a.lat),dlng=rad(b.lng-a.lng);const h=Math.sin(dlat/2)**2+Math.cos(rad(a.lat))*Math.cos(rad(b.lat))*Math.sin(dlng/2)**2;return 6371000*2*Math.asin(Math.min(1,Math.sqrt(h)));}
export function guideProgress(checkpoints,now,reached=[],position=null){
 const done=new Set(reached),remaining=checkpoints.filter(x=>!done.has(x.id)&&x.at!==null),due=remaining.filter(x=>x.at<=now),current=due.at(-1)||null,next=remaining.find(x=>x.at>now)||null;
 const fresh=position&&validGeo(position)&&Number.isFinite(position.accuracy)&&position.accuracy>=0&&position.accuracy<=100&&Number.isFinite(position.timestamp)&&now-position.timestamp>=-10000&&now-position.timestamp<=120000;
 const distance=fresh&&current?distanceMeters(position,current.geo):null;
 const window=current&&now-current.at<=60*60000;
 return {current,next,distance,overdueProtected:due.filter(x=>x.protected),locationStatus:!fresh?'unknown':!current||distance===null?'unverifiable':distance<=200?'near':window&&distance>200+position.accuracy?'off_route':'unverifiable',late:!!current&&now-current.at>=15*60000,departureReminder:next&&next.at-now<=15*60000?next:null};
}
export function autoHelpDecision(progress,samples,now,history){
 if(progress.locationStatus!=='off_route'||!progress.current||history.count>=3||now-history.lastAt<30*60000||history.ids.includes(progress.current.id))return false;
 const recent=samples.filter(p=>now-p.timestamp<=120000&&p.timestamp<=now+10000&&p.accuracy<=100&&p.accuracy>=0&&validGeo(p));
 return recent.length>=2&&recent.at(-1).timestamp-recent.at(-2).timestamp>=20000&&recent.slice(-2).every(p=>(distanceMeters(p,progress.current.geo)??0)>200+p.accuracy);
}
export function validateGuideChanges(snapshot,changes){
 if(!Array.isArray(changes)||changes.length>12)throw Error('GUIDE_PROPOSAL_INVALID');const seen=new Set();
 return changes.map(c=>{const old=snapshot.items.find(i=>i.id===c?.itemId);if(!old||seen.has(c.itemId)||Object.keys(c).some(k=>!['itemId','day','time'].includes(k))||old.protected||!['Wisata','Transportasi'].includes(old.category)||!Number.isInteger(c.day)||c.day<1||c.day>snapshot.days||!/^([01]\d|2[0-3]):[0-5]\d$/.test(c.time||''))throw Error('GUIDE_PROTECTED_OR_INVALID');seen.add(c.itemId);
  const minute=t=>Number(t.slice(0,2))*60+Number(t.slice(3,5)),at=(c.day-1)*1440+minute(c.time);
  if(/^\d\d:\d\d$/.test(snapshot.arrival)&&at<snapshot.arrivalDay*1440+minute(snapshot.arrival)+120)throw Error('GUIDE_BEFORE_ARRIVAL');
  if(!snapshot.oneWay&&/^\d{4}-\d{2}-\d{2}T\d\d:\d\d/.test(snapshot.returnAt)&&at>(Date.parse(snapshot.returnAt.slice(0,10))-Date.parse(snapshot.start))/86400000*1440+minute(snapshot.returnAt.slice(11,16))-240)throw Error('GUIDE_RETURN_BUFFER');
  if(snapshot.items.some(i=>i.protected&&i.category!=='Penginapan'&&i.day===c.day&&/^\d\d:\d\d$/.test(i.time)&&Math.abs(minute(i.time)-minute(c.time))<90))throw Error('GUIDE_BOOKING_CONFLICT');return {itemId:c.itemId,day:c.day,time:c.time};});
}
export function applyGuideChanges(trip,changes){
 const safe=validateGuideChanges(guideSnapshot(trip),changes);
 const items=trip.items.map(item=>{const c=safe.find(c=>c.itemId===item.id);if(!c)return item;
  const stale=item.category==='Transportasi'||!!item.activityOffer||!!item.priceQuote;
  return {...item,day:c.day,time:c.time,userEdited:true,...(stale?{price:0,priceUnknown:true,priceQuote:undefined,routePriceQuotes:undefined,routeOptions:undefined,selectedRoute:undefined,routeKey:undefined,minutes:undefined,activityOffer:undefined,bookingUrl:undefined}: {})};
 });
 return {...trip,items,...(trip.aiPlan?{aiPlan:{...trip.aiPlan,activities:trip.aiPlan.activities.map(item=>{const c=safe.find(c=>c.itemId===item.id);return c?{...item,day:c.day,time:c.time,routeOptions:null}:item})}}:{})};
}
