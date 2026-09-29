const json=(body,status=200)=>Response.json(body,{status,headers:{'Cache-Control':'no-store'}});
const uuid=v=>typeof v==='string'&&/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(v);
export function tripKey(t){const city=t.destinationMeta?.city||({kl:'Kuala Lumpur',bkk:'Bangkok',sin:'Singapura'}[t.destination]||t.destination);if(typeof city!=='string'||city.length>100||!/^\d{4}-\d{2}-\d{2}$/.test(t.start||''))throw Error('INVALID_TRIP');return city.toLowerCase().trim()+'|'+t.start;}
export function paymentResult(p,order){
 if(p.order_id!==order.id||!/^15000(?:\.0{1,2})?$/.test(String(p.gross_amount))||p.currency!=='IDR')throw Error('PAYMENT_MISMATCH');
 const s=p.transaction_status;
 if(['refund','partial_refund','chargeback','partial_chargeback'].includes(s))return s;
 if((s==='settlement'||s==='capture'&&p.payment_type==='credit_card')&&(!p.fraud_status||p.fraud_status==='accept'))return 'paid';
 return ['pending','deny','cancel','expire','failure'].includes(s)?s:'pending';
}
export async function validSignature(p,key){
 if(!/^[a-f0-9]{128}$/i.test(p.signature_key||''))return false;
 const input=String(p.order_id)+String(p.status_code)+String(p.gross_amount)+key;
 const digest=await crypto.subtle.digest('SHA-512',new TextEncoder().encode(input));const expected=Array.from(new Uint8Array(digest),b=>b.toString(16).padStart(2,'0')).join('');let diff=0;for(let i=0;i<128;i++)diff|=expected.charCodeAt(i)^p.signature_key.toLowerCase().charCodeAt(i);return diff===0;
}
async function db(env,path,body,method=body?'POST':'GET',prefer='return=representation'){
 const r=await fetch(`${env.SUPABASE_URL}/rest/v1/${path}`,{method,headers:{apikey:env.SUPABASE_SERVICE_ROLE_KEY,Authorization:`Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,'Content-Type':'application/json',Prefer:prefer},...(body?{body:JSON.stringify(body)}:{}),signal:AbortSignal.timeout(10000)});if(!r.ok)throw Error('DATABASE');const t=await r.text();return t?JSON.parse(t):null;
}
const mode=env=>env.MIDTRANS_ENV==='production'?'production':'sandbox';
const owner=(env,id)=>env.OWNER_TEST_ENABLED==='true'&&env.OWNER_USER_ID===id;
async function midtrans(env,path,body){const host=body?(mode(env)==='production'?'https://app.midtrans.com':'https://app.sandbox.midtrans.com'):(mode(env)==='production'?'https://api.midtrans.com':'https://api.sandbox.midtrans.com');const r=await fetch(host+path,{method:body?'POST':'GET',headers:{Authorization:'Basic '+btoa(env.MIDTRANS_SERVER_KEY+':'),'Content-Type':'application/json',Accept:'application/json'},...(body?{body:JSON.stringify(body)}:{}),signal:AbortSignal.timeout(15000)});if(!r.ok)throw Error('MIDTRANS');return r.json();}
async function reconcile(env,o){const p=await midtrans(env,`/v2/${encodeURIComponent(o.id)}/status`);const status=paymentResult(p,o);await db(env,'rpc/apply_trip_payment',{p_order:o.id,p_environment:o.environment,p_status:status});return status;}
export async function handlePayments(request,env){
 const path=new URL(request.url).pathname;
 if(!env.SUPABASE_URL||!env.SUPABASE_SERVICE_ROLE_KEY)return json({error:'Koneksi pembayaran server belum dikonfigurasi.'},503);
 try{
 if(path==='/api/payments/webhook'){
  if(request.method!=='POST')return json({error:'POST required'},405);
  if(!env.MIDTRANS_SERVER_KEY)return json({error:'Not configured'},503);
  const raw=await request.text();if(raw.length>16000)return json({error:'Payload too large'},413);let p;try{p=JSON.parse(raw)}catch{return json({error:'Invalid JSON'},400)};
  if(!await validSignature(p,env.MIDTRANS_SERVER_KEY))return json({error:'Invalid signature'},403);
  if(!/^st-[a-z0-9-]{10,60}$/.test(p.order_id||''))return json({error:'Invalid order'},400);
  const [o]=await db(env,`payment_orders?id=eq.${encodeURIComponent(p.order_id)}&environment=eq.${mode(env)}`);if(!o)return json({ok:true});
  await reconcile(env,o);return json({ok:true});
 }
 if(request.headers.get('Origin')&&request.headers.get('Origin')!==new URL(request.url).origin)return json({error:'Origin tidak valid.'},403);
 if(request.method!=='POST')return json({error:'Gunakan POST.'},405);
 const auth=request.headers.get('Authorization')||'';if(!/^Bearer [\w.-]+$/.test(auth))return json({error:'Masuk terlebih dahulu.'},401);
 const ur=await fetch(`${env.SUPABASE_URL}/auth/v1/user`,{headers:{Authorization:auth,apikey:env.SUPABASE_PUBLISHABLE_KEY},signal:AbortSignal.timeout(10000)});if(!ur.ok)return json({error:'Sesi berakhir.'},401);const user=await ur.json();if(!uuid(user.id))return json({error:'Sesi tidak valid.'},401);
 const raw=await request.text();if(raw.length>2000)return json({error:'Permintaan terlalu besar.'},413);let b;try{b=JSON.parse(raw)}catch{return json({error:'Permintaan tidak valid.'},400)};
 if(!uuid(b.tripId))return json({error:'Simpan itinerary terlebih dahulu.'},400);
 const [t]=await db(env,`trips?id=eq.${b.tripId}&user_id=eq.${user.id}&select=id,data`);if(!t)return json({error:'Perjalanan tidak ditemukan.'},404);const key=tripKey(t.data);
 if(path==='/api/payments/owner-test'){
  if(!owner(env,user.id))return json({error:'Akses uji hanya untuk pemilik yang terdaftar di server.'},403);
  const reference='owner-test:'+user.id+':'+key;
  await db(env,'trip_passes?on_conflict=payment_reference',{user_id:user.id,trip_key:key,expires_at:new Date(Date.now()+30*86400000).toISOString(),request_limit:20,payment_reference:reference},'POST','resolution=ignore-duplicates,return=representation');
  return json({ok:true,message:'Akses uji 30 hari diberikan untuk perjalanan ini. Bukan pembayaran sungguhan. Masa aktif tidak diperpanjang dengan klik ulang.'});
 }
 if(path==='/api/payments/status'){
  const orders=await db(env,`payment_orders?user_id=eq.${user.id}&trip_id=eq.${b.tripId}&environment=eq.${mode(env)}&order=created_at.desc&limit=1`);
  let status=orders[0]?.status||'none';if(b.refresh===true&&orders[0]&&env.MIDTRANS_SERVER_KEY){if(!env.AI_LIMITER||!(await env.AI_LIMITER.limit({key:'payment-status:'+user.id})).success)return json({error:'Tunggu sebentar sebelum memeriksa lagi.'},429);try{status=await reconcile(env,orders[0])}catch{status=orders[0].status}}
  const passes=await db(env,`trip_passes?user_id=eq.${user.id}&trip_key=eq.${encodeURIComponent(key)}&expires_at=gt.${encodeURIComponent(new Date().toISOString())}&order=expires_at.desc&limit=1`);
  const p=passes[0];return json({mode:mode(env),checkoutEnabled:!!env.MIDTRANS_SERVER_KEY&&(mode(env)==='sandbox'?owner(env,user.id):env.PAYMENTS_ENABLED==='true'),ownerTest:owner(env,user.id),status,pass:p?{expiresAt:p.expires_at,remaining:Math.max(0,p.request_limit-p.requests),test:p.payment_reference.startsWith('owner-test:')||p.payment_reference.startsWith('st-sandbox-')}:null});
 }
 if(path!=='/api/payments/checkout')return json({error:'Endpoint tidak ditemukan.'},404);
 if(!env.MIDTRANS_SERVER_KEY||(mode(env)==='sandbox'?!owner(env,user.id):env.PAYMENTS_ENABLED!=='true'))return json({error:'Pembelian belum dibuka. Sandbox hanya tersedia untuk pemilik.'},403);
 if(!env.AI_LIMITER||!(await env.AI_LIMITER.limit({key:'checkout:'+user.id})).success)return json({error:'Tunggu satu menit sebelum mencoba lagi.'},429);
 const active=await db(env,`trip_passes?user_id=eq.${user.id}&trip_key=eq.${encodeURIComponent(key)}&expires_at=gt.${encodeURIComponent(new Date().toISOString())}&limit=1`);if(active.length)return json({error:'Trip Pass masih aktif untuk perjalanan ini.'},409);
 const pending=await db(env,`payment_orders?user_id=eq.${user.id}&trip_id=eq.${t.id}&environment=eq.${mode(env)}&status=in.(created,pending)&order=created_at.desc&limit=1`);
 if(pending[0]){if(pending[0].checkout_url)return json({checkoutUrl:pending[0].checkout_url,orderId:pending[0].id,mode:mode(env)});return json({error:'Order sedang disiapkan. Cek status; jika tetap gagal hubungi pengelola sebelum membuat pembayaran baru.'},409);}
 const id=`st-${mode(env)}-${crypto.randomUUID()}`;
 await db(env,'payment_orders',{id,user_id:user.id,trip_id:t.id,trip_key:key,amount:15000,currency:'IDR',environment:mode(env)});
 const snap=await midtrans(env,'/snap/v1/transactions',{transaction_details:{order_id:id,gross_amount:15000},item_details:[{id:'trip-pass-30',price:15000,quantity:1,name:'sortTrip Trip Pass 30 hari'}],customer_details:{email:user.email}});
 const url=new URL(snap.redirect_url);const expected=mode(env)==='production'?'app.midtrans.com':'app.sandbox.midtrans.com';if(url.protocol!=='https:'||url.hostname!==expected)throw Error('CHECKOUT_URL');
 await db(env,`payment_orders?id=eq.${id}`,{checkout_url:url.href},'PATCH');return json({checkoutUrl:url.href,orderId:id,mode:mode(env)});
 }catch{return json({error:'Pembayaran belum dapat diproses. Periksa konfigurasi server atau coba cek status kembali. Jangan mengulang pembayaran jika sudah membayar.'},502);}
}
