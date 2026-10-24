import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile,access} from 'node:fs/promises';
import sharp from 'sharp';
const read=p=>readFile(new URL('../'+p,import.meta.url),'utf8');
const root=new URL('../public/branding/',import.meta.url);
test('approved brand SVGs are local, scalable, self-contained and have no active content',async()=>{
 for(const name of ['sorttrip-logo-light','sorttrip-logo-dark','sorttrip-logo-horizontal','sorttrip-logo-vertical','sorttrip-logo-monochrome','sorttrip-icon','sorttrip-icon-white','sorttrip-icon-monochrome','favicon']){
  const s=await readFile(new URL(name+'.svg',root),'utf8');assert.match(s,/viewBox=/);assert.match(s,/<path/);assert.doesNotMatch(s,/<script|<foreignObject|https?:\/\/[^" ]+\.(?:js|png|jpg)|onload=/i);
 }
 const icon=await readFile(new URL('sorttrip-icon.svg',root),'utf8');assert.match(icon,/#FF6B4A/);assert.match(icon,/stroke="#FFFFFF"/);assert.match(icon,/cx="115" cy="47" r="18"/);
 assert.equal(await read('public/favicon.svg'),await readFile(new URL('favicon.svg',root),'utf8'));
});
test('favicon, app and sharing raster assets have their declared dimensions and valid ICO entries',async()=>{
 for(const size of [16,32,48,64]){const m=await sharp(await readFile(new URL(`favicon-${size}x${size}.png`,root))).metadata();assert.equal(m.width,size);assert.equal(m.height,size);assert.equal(m.hasAlpha,true);}
 for(const [name,size] of [['apple-touch-icon.png',180],['icon-192.png',192],['icon-512.png',512],['icon-maskable-512.png',512]]){const m=await sharp(await readFile(new URL(name,root))).metadata();assert.equal(m.width,size);assert.equal(m.height,size);}
 for(const lang of ['id','en']){const m=await sharp(await readFile(new URL('social-'+lang+'.png',root))).metadata();assert.equal(m.width,1200);assert.equal(m.height,630);}
 const ico=await readFile(new URL('favicon.ico',root));assert.equal(ico.readUInt16LE(2),1);assert.equal(ico.readUInt16LE(4),4);
 for(let i=0;i<4;i++){const at=6+i*16,len=ico.readUInt32LE(at+8),offset=ico.readUInt32LE(at+12);assert.ok(offset+len<=ico.length);assert.equal(ico.subarray(offset+1,offset+4).toString(),'PNG');}
});
test('every HTML entry and the manifest resolve new versioned local brand assets',async()=>{
 for(const file of ['index.html','public/terms.html','public/privacy.html','public/404.html']){
  const html=await read(file);assert.match(html,/branding\/favicon.svg\?v=3/);assert.match(html,/apple-touch-icon/);assert.match(html,/theme-color" content="#0B2D3A/);
  for(const [,src] of html.matchAll(/(?:href|src)="(\/branding\/[^"?]+)(?:\?[^\"]*)?"/g))await access(new URL('../public'+src,import.meta.url));
 }
 const manifest=JSON.parse(await read('public/site.webmanifest'));assert.equal(manifest.name,'SortTrip');assert.equal(manifest.theme_color,'#0B2D3A');assert.ok(manifest.icons.some(i=>i.purpose==='maskable'));
 for(const i of manifest.icons)await access(new URL('../public'+i.src.split('?')[0],import.meta.url));
});
test('primary brand controls and text retain accessible contrast on light and dark surfaces',async()=>{
 const luminance=hex=>{const a=hex.match(/../g).map(v=>parseInt(v,16)/255).map(v=>v<=.04045?v/12.92:((v+.055)/1.055)**2.4);return a[0]*.2126+a[1]*.7152+a[2]*.0722;};
 const contrast=(a,b)=>{const x=luminance(a),y=luminance(b);return (Math.max(x,y)+.05)/(Math.min(x,y)+.05);};
 for(const [fg,bg] of [['FFFFFF','0F6E8C'],['0B2D3A','F7F7F5'],['526770','FFFFFF'],['ADC3CC','123B4B'],['6AD4EF','123B4B']])assert.ok(contrast(fg,bg)>=4.5,fg+' on '+bg);
 const tokens=await read('public/branding/brand-tokens.css');for(const c of ['#0B2D3A','#0F6E8C','#0B8DB0','#0EA5C9','#FF6B4A','#F7F7F5'])assert.ok(tokens.includes(c));
});
test('localised titles/taglines are paired and the shared logo replaces the obsolete arrows',async()=>{
 for(const [lang,tag] of [['id','Sortir tiket, susun itinerary'],['en','Travel smarter, plan better']]){const d=JSON.parse(await read('app/i18n/locales/'+lang+'.json'));assert.equal(d.brand_tagline,tag);assert.match(d.meta_title,/^SortTrip \| /);}
 const component=await read('app/brand-logo.tsx');assert.match(component,/sorttrip-logo-horizontal-dark.svg/);assert.match(component,/aria-label/);assert.doesNotMatch(component,/M8 25 40 4|51b8f2|258fe5/);
});
