export function planningKey(city,start){
 if(typeof city!=='string'||!city.trim()||city.length>100||city.includes('|')||!/^\d{4}-\d{2}-\d{2}$/.test(start||'')||!Number.isFinite(Date.parse(start)))throw Error('INVALID_TRIP');
 return city.toLowerCase().trim()+'|'+start;
}
export function passSummary(rows){
 const p=rows.find(p=>p.request_limit>p.requests)||rows[0];
 return p?{expiresAt:p.expires_at,remaining:Math.max(0,p.request_limit-p.requests),test:typeof p.payment_reference==='string'&&(p.payment_reference.startsWith('owner-test:')||p.payment_reference.startsWith('st-sandbox-'))}:null;
}
