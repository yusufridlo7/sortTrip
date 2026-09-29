// Scheduled worker only. Service key must NEVER be exposed through VITE variables.
async function db(env,path,body,method=body?'POST':'GET'){
 const r=await fetch(`${env.SUPABASE_URL}/rest/v1/${path}`,{method,headers:{apikey:env.SUPABASE_SERVICE_ROLE_KEY,Authorization:`Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,'Content-Type':'application/json'},...(body?{body:JSON.stringify(body)}:{}),signal:AbortSignal.timeout(12000)});
 if(!r.ok)throw Error('WATCH_DATABASE');const t=await r.text();return t?JSON.parse(t):null;
}
export function lowerFare(flights){return flights.filter(x=>Number.isFinite(x.price)&&x.price>0&&/^https:\/\/www\.aviasales\.com\/search\//.test(x.bookingUrl||'')).sort((a,b)=>a.price-b.price)[0]||null;}
export async function runPriceWatches(env,ctx,searchFlights){
 if(!env.SUPABASE_SERVICE_ROLE_KEY||!env.SUPABASE_URL||!env.TRAVELPAYOUTS_API_TOKEN){console.warn('PRICE_WATCH_NOT_CONFIGURED');return;}
 const watches=await db(env,'rpc/claim_price_watches',{});
 for(const w of watches){
  let fare=null,status='error';
  try{const response=await searchFlights(w.query,env,ctx);const result=await response.json();if(response.ok){fare=lowerFare(result.flights||[]);status=fare?'ok':'no_data';}}catch{}
  await db(env,'rpc/finish_price_watch',{p_id:w.id,p_lease:w.lease,p_price:fare?.price||null,p_url:fare?.bookingUrl||'',p_status:status});
 }
 if(!env.RESEND_API_KEY||!env.PRICE_WATCH_FROM)return;
 const pending=await db(env,'price_notifications?email_sent=eq.false&select=*,price_watches!inner(enabled,email_enabled,trip_passes!inner(expires_at))&price_watches.enabled=eq.true&price_watches.email_enabled=eq.true&price_watches.trip_passes.expires_at=gt.'+encodeURIComponent(new Date().toISOString())+'&order=created_at.asc&limit=5');
 for(const n of pending){
  const u=await fetch(`${env.SUPABASE_URL}/auth/v1/admin/users/${n.user_id}`,{headers:{apikey:env.SUPABASE_SERVICE_ROLE_KEY,Authorization:`Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`},signal:AbortSignal.timeout(10000)});if(!u.ok)continue;const user=await u.json();if(!user.email||!user.email_confirmed_at)continue;
  const r=await fetch('https://api.resend.com/emails',{method:'POST',headers:{Authorization:`Bearer ${env.RESEND_API_KEY}`,'Content-Type':'application/json','Idempotency-Key':`price-watch-${n.id}`},body:JSON.stringify({from:env.PRICE_WATCH_FROM,to:[user.email],subject:'sortTrip: harga penerbangan turun',text:`Harga indikatif untuk rute dan tanggal yang Anda pantau turun dari Rp${n.old_price} menjadi Rp${n.price} / 1 dewasa. Maskapai dan jam dapat berbeda. Bagasi dan ketentuan tarif belum dibandingkan. Periksa harga akhir di penyedia.\n${n.booking_url}\n\nBuka sortTrip untuk melihat notifikasi atau mematikan email di Price Watch:\nhttps://sorttrip.yusufridlo7.workers.dev/`}),signal:AbortSignal.timeout(12000)});
  if(r.ok)await db(env,`price_notifications?id=eq.${n.id}`,{email_sent:true},'PATCH');
 }
}
