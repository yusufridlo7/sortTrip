// Airport scope is a planning constraint, not a claim of driving distance,
// shuttle service or room availability. Reuse SortTrip's KUL map anchor.
export const KLIA_SCOPE={city:'Sepang',area:'KLIA',latitude:2.7456,longitude:101.7072,radius:20000};
export function finalAirportNight(message='',days=0){
 const s=String(message).toLowerCase();
 const requested=/\b(?:hotel|penginapan|accommodation|stay)\b/.test(s)&&/\b(?:hari\s+terakhir|malam\s+terakhir|last\s+(?:day|night)|final\s+(?:day|night))\b/.test(s)&&/\b(?:dekat|deket|dekan|near|nearby|close\s+to)\s+(?:bandara\s+|airport\s+)?klia\b/.test(s);
 const negated=/\b(?:jangan|tidak perlu|do not|don't)\s+(?:(?:ganti|ubah|change|replace)\s+)?(?:hotel|penginapan|accommodation|stay)/.test(s);
 return requested&&!negated&&Number.isInteger(days)&&days>=2?days-1:null;
}
export function airportStayPolicy(q){
 const day=finalAirportNight(q.interests,q.days);
 const country=String(q.country||'').toLowerCase();
 return day&&(/^(malaysia|my)$/.test(country)||/kuala lumpur|sepang/i.test(q.city||''))?{day,...KLIA_SCOPE}:null;
}
export function withinAirportScope(geo){
 if(!geo||!Number.isFinite(geo.lat)||!Number.isFinite(geo.lng))return false;
 const rad=x=>x*Math.PI/180,a=KLIA_SCOPE;
 const h=Math.sin(rad(geo.lat-a.latitude)/2)**2+Math.cos(rad(a.latitude))*Math.cos(rad(geo.lat))*Math.sin(rad(geo.lng-a.longitude)/2)**2;
 return 6371000*2*Math.atan2(Math.sqrt(h),Math.sqrt(Math.max(0,1-h)))<=a.radius;
}
