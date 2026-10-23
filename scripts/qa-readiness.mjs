// Read-only, bounded audit. Never loads env files, auth storage, or credentials.
import fs from 'node:fs/promises';
import path from 'node:path';
const root='qa-reports/2026-10-23/evidence';
await fs.mkdir(root,{recursive:true});
const mode=process.argv[2]||'http';
if(mode==='static'){
 const files=[];
 async function walk(dir){for(const e of await fs.readdir(dir,{withFileTypes:true})){if(e.name.startsWith('.')||['node_modules','artifacts','qa-reports','vendor'].includes(e.name))continue;const p=path.join(dir,e.name);if(e.isDirectory())await walk(p);else if(/\.(?:tsx?|jsx?|mjs|sql|html|jsonc|css)$/.test(p))files.push(p);}}
 for(const dir of ['app','worker','components','supabase','scripts','dist','public'])await walk(dir);
 for(const p of ['index.html','main.jsx','wrangler.jsonc','wrangler.hotel-browser.jsonc','vite.config.js'])files.push(p);
 const inventory=[],security=[];const envNames=new Set();
 for(const file of files){const s=await fs.readFile(file,'utf8');
  for(const m of s.matchAll(/\b(?:env\.|import\.meta\.env\.)([A-Z][A-Z_0-9]+)/g))envNames.add(m[1]);
  if(!file.startsWith('dist'))inventory.push({file,lines:s.split('\n').length,interactiveTags:(s.match(/<(?:button|a|input|select|textarea|summary|TabsTrigger|Switch)\b/g)||[]).length,apiPaths:[...new Set([...s.matchAll(/['"`]((?:\/api\/)[A-Za-z0-9_\/-]+)/g)].map(m=>m[1]))]});
  if(!file.startsWith('scripts')){
   const detections=[];
   if(/-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/.test(s))detections.push('private-key-marker');
   for(const m of s.matchAll(/eyJ[A-Za-z0-9_-]+\.([A-Za-z0-9_-]+)\.[A-Za-z0-9_-]+/g)){try{const payload=JSON.parse(Buffer.from(m[1],'base64url').toString());if(payload.role==='service_role')detections.push('service-role-jwt');}catch{}}
   if(/\bsk-(?:proj-|live_)[A-Za-z0-9_-]{24,}/.test(s))detections.push('private-api-key-pattern');
   if(detections.length)security.push({file,categories:[...new Set(detections)]});
  }
 }
 const assets=[];for(const file of files.filter(p=>p.startsWith('dist'))){const stat=await fs.stat(file);assets.push({file,bytes:stat.size});}
 const result={scope:'listed source/build extensions only; excludes env/secret/queue/git/unrelated files; not a full historical secret audit',inventory,environmentVariableNames:[...envNames].sort(),secretPatternFindings:security,assets};
 await fs.writeFile(root+'/static-inventory.json',JSON.stringify(result,null,2));console.log(JSON.stringify({files:inventory.length,variableNames:envNames.size,secretPatternFindings:security.length,assets:assets.length}));
}else{
 const cases=[];
 const add=(id,method,url,expected,body,headers={},category='api')=>cases.push({id,method,url,expected,body,headers,category});
 for(const [label,base] of [['LOCAL','http://127.0.0.1:8787'],['PROD','https://sorttrip.yusufridlo7.workers.dev']]){
  add(label+'-HEALTH','GET',base+'/api/health',[200]);
  add(label+'-UNKNOWN-API','GET',base+'/api/qa-unknown',[404]);
  add(label+'-METHOD','POST',base+'/api/health',[405],{});
  add(label+'-AUTOCOMPLETE','GET',base+'/api/locations?q=Tokyo',[200]);
  add(label+'-FLIGHT-INVALID','GET',base+'/api/flights?origin=ZZZ',[400]);
  add(label+'-HOTEL-ORIGIN','POST',base+'/api/hotels/search',[403],{},{Origin:'https://untrusted.invalid'});
  add(label+'-HOTEL-INVALID','POST',base+'/api/hotels/search',[400],{});
  add(label+'-HOTEL-PRIVATE','GET',base+'/api/hotels/checkout/history',[401]);
  add(label+'-PAYMENT-PRIVATE','POST',base+'/api/payments/status',[401],{});
  add(label+'-PAYMENT-ORIGIN','POST',base+'/api/payments/status',[403],{},{Origin:'https://untrusted.invalid'});
  add(label+'-PAYMENT-BAD-WEBHOOK','POST',base+'/api/payments/webhook',[403],{signature_key:'invalid'});
  add(label+'-SUPPORT-CONFIG','GET',base+'/api/support/config',[200]);
  add(label+'-SUPPORT-BAD-WEBHOOK','POST',base+'/api/support/telegram/webhook',[403],{});
  add(label+'-GOOGLE-PRIVATE','POST',base+'/api/routes/google',[401],{});
  add(label+'-ITINERARY-PRIVATE','POST',base+'/api/itinerary',[401],{});
  add(label+'-VIATOR-HEALTH','GET',base+'/api/activities/health',[200]);
  for(const p of ['/','/hotel-checkout','/terms','/privacy'])add(label+'-PAGE-'+p,'GET',base+p,[200],undefined,{},'page');
  add(label+'-MISSING-PAGE','GET',base+'/qa-route-that-does-not-exist',[404],undefined,{},'page');
  add(label+'-ROBOTS','GET',base+'/robots.txt',[200],undefined,{},'seo');
  add(label+'-SITEMAP','GET',base+'/sitemap.xml',[200],undefined,{},'seo');
 }
 add('WHITELABEL','GET','https://yusuf-ridlo-kkxjf.nuitee.link/',[200],undefined,{},'partner');
 const localOnly=mode==='local';
 const results=[];
 for(const c of cases.filter(c=>!localOnly||c.id.startsWith('LOCAL-'))){const started=performance.now();try{
  const r=await fetch(c.url,{method:c.method,headers:{...(c.body?{'Content-Type':'application/json'}:{}),...c.headers},...(c.body?{body:JSON.stringify(c.body)}:{}),redirect:'follow',signal:AbortSignal.timeout(18000)});const t=await r.text();
  let summary;try{const b=JSON.parse(t);summary=c.id.includes('HEALTH')||c.id.includes('CONFIG')?Object.fromEntries(Object.entries(b).filter(([k,v])=>typeof v==='boolean'||['version','environment','code','configuration','errorKey'].includes(k))):{errorKey:b.errorKey||b.code||null,arrayCount:Array.isArray(b.locations)?b.locations.length:undefined};}catch{}
  const semantic=c.category==='seo'?(c.id.endsWith('ROBOTS')?!/<html/i.test(t):t.includes('<urlset')||t.includes('<sitemapindex')):true;
  results.push({id:c.id,method:c.method,url:c.url,status:c.expected.includes(r.status)&&semantic?'PASS':r.status===503?'BLOCKED':'FAIL',httpStatus:r.status,expected:c.expected,ms:Math.round(performance.now()-started),contentType:r.headers.get('content-type'),headers:Object.fromEntries(['content-security-policy','referrer-policy','x-frame-options','x-content-type-options','strict-transport-security'].map(h=>[h,r.headers.get(h)])),bytes:Buffer.byteLength(t),summary});
 }catch{results.push({id:c.id,url:c.url,status:'BLOCKED',reason:'NETWORK_OR_SERVER_UNAVAILABLE',ms:Math.round(performance.now()-started)});}}
 await fs.writeFile(root+(localOnly?'/http-probes-final-local.json':'/http-probes.json'),JSON.stringify(results,null,2));console.log(JSON.stringify(results.map(({id,status,httpStatus,ms,summary})=>({id,status,httpStatus,ms,summary})),null,2));
}
