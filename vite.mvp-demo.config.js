import {defineConfig} from 'vite';
import react from '@vitejs/plugin-react';
import fs from 'node:fs';
import {fileURLToPath,URL} from 'node:url';
// No env file, Supabase client, proxy or Worker. This is a local fixture shell.
export default defineConfig({
 envDir:false,envPrefix:'MVP_PUBLIC_',publicDir:false,
 define:{'import.meta.env.VITE_SUPABASE_URL':JSON.stringify(''),'import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY':JSON.stringify('')},
 plugins:[react(),{name:'local-mvp-only',configureServer(server){server.middlewares.use((req,res,next)=>{
  res.setHeader('X-Robots-Tag','noindex, nofollow');
  res.setHeader('Content-Security-Policy',"default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; media-src 'self' blob:; connect-src 'self' ws://127.0.0.1:5175; frame-src 'none'; font-src 'self' data:");
  if(req.url?.startsWith('/api/')){res.statusCode=503;res.setHeader('Content-Type','application/json');res.end(JSON.stringify({code:'LOCAL_DEMO_NO_EGRESS',errorKey:'mvp_unavailable',error:'Supplier unavailable in local demo',demo:true}));return;}
  if(req.url?.split('?')[0]==='/bangkok.jpg'){res.setHeader('Content-Type','image/jpeg');res.end(fs.readFileSync(new URL('./public/bangkok.jpg',import.meta.url)));return;}
  if(req.url==='/')req.url='/mvp-demo.html';next();
 });},generateBundle(){this.emitFile({type:'asset',fileName:'bangkok.jpg',source:fs.readFileSync(new URL('./public/bangkok.jpg',import.meta.url))});}}],
 resolve:{alias:{'@':fileURLToPath(new URL('.',import.meta.url))}},
 server:{host:'127.0.0.1',port:5175,strictPort:true},
 build:{outDir:'dist-mvp-demo',rollupOptions:{input:fileURLToPath(new URL('./mvp-demo.html',import.meta.url))}}
});
