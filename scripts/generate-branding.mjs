// Rasterize canonical vector artwork; sharp is available in the local toolchain.
import sharp from 'sharp';
import {readFile,writeFile} from 'node:fs/promises';
const dir=new URL('../public/branding/',import.meta.url),source=await readFile(new URL('favicon.svg',dir));
const pngs=[];
for(const size of [16,32,48,64]){const data=await sharp(source).resize(size,size).png().toBuffer();await writeFile(new URL(`favicon-${size}x${size}.png`,dir),data);pngs.push({size,data});}
// ICO directory with PNG-backed 16/32/48/64 images, supported by current browsers.
const head=Buffer.alloc(6+16*pngs.length);head.writeUInt16LE(1,2);head.writeUInt16LE(pngs.length,4);let offset=head.length;
pngs.forEach(({size,data},i)=>{const at=6+i*16;head[at]=size;head[at+1]=size;head.writeUInt16LE(1,at+4);head.writeUInt16LE(32,at+6);head.writeUInt32LE(data.length,at+8);head.writeUInt32LE(offset,at+12);offset+=data.length;});
await writeFile(new URL('favicon.ico',dir),Buffer.concat([head,...pngs.map(p=>p.data)]));
for(const [file,size] of [['apple-touch-icon.png',180],['icon-192.png',192],['icon-512.png',512]])await writeFile(new URL(file,dir),await sharp(source).resize(Math.round(size*.82),Math.round(size*.82)).extend({top:Math.floor(size*.09),bottom:size-Math.round(size*.82)-Math.floor(size*.09),left:Math.floor(size*.09),right:size-Math.round(size*.82)-Math.floor(size*.09),background:'#F7F7F5'}).png().toBuffer());
const maskable=Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512"><rect width="512" height="512" fill="#0B2D3A"/><image href="data:image/svg+xml;base64,${source.toString('base64')}" x="112" y="112" width="288" height="288"/></svg>`);
await writeFile(new URL('icon-maskable-512.png',dir),await sharp(maskable).png().toBuffer());
for(const lang of ['id','en'])await writeFile(new URL('social-'+lang+'.png',dir),await sharp(await readFile(new URL('social-'+lang+'.svg',dir))).png().toBuffer());
// Conventional root fallback is intentional, not the obsolete icon.
await writeFile(new URL('../favicon.ico',dir),await readFile(new URL('favicon.ico',dir)));
await writeFile(new URL('../favicon.svg',dir),source);
console.log('Generated favicon, Apple, app and social PNG assets.');
