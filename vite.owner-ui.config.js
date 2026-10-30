import {defineConfig} from 'vite';
import react from '@vitejs/plugin-react';
import {fileURLToPath,URL} from 'node:url';
import {searchLocations,destinationsFromText} from './worker/location-search.js';
// Original index.html/main.jsx/AuthApp/TravelApp, NOT a new app entry/editor.
// Local owner review only: no env files, credentials, Supabase or paid backend.
export default defineConfig({envDir:false,envPrefix:'OWNER_UI_PUBLIC_',
 define:{'import.meta.env.VITE_SUPABASE_URL':JSON.stringify(''),'import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY':JSON.stringify('')},
 plugins:[react(),{name:'owner-original-ui-guard',
  transformIndexHtml:{order:'pre',handler(html){return html.replace(/<script\b([^>]*)>[\s\S]*?<\/script>/gi,(block,attributes)=>/type=["']module["']/i.test(attributes)?block:'');}},
  configureServer(server){server.middlewares.use(async(req,res,next)=>{
   res.setHeader('X-Robots-Tag','noindex, nofollow');
   res.setHeader('Content-Security-Policy',"default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob: https://tile.openstreetmap.org https://*.tile.openstreetmap.org; media-src 'self' blob:; connect-src 'self' ws://127.0.0.1:5173; font-src 'self' data:; frame-src 'none'");
   const url=new URL(req.url||'/','http://127.0.0.1:5173');if(!url.pathname.startsWith('/api/')){next();return;}
   res.setHeader('Content-Type','application/json');
   if(req.method==='GET'&&url.pathname==='/api/locations'){res.end(JSON.stringify({locations:searchLocations(url.searchParams.get('q')||'')}));return;}
   if(req.method==='POST'&&url.pathname==='/api/locations/resolve'){
    try{let text='';for await(const part of req){text+=part;if(text.length>8192)throw Error();}const body=JSON.parse(text);res.end(JSON.stringify({locations:destinationsFromText(body.text||body.prompt||'',body.origin||'CGK')}));}catch{res.statusCode=400;res.end(JSON.stringify({code:'INVALID_INPUT'}));}return;
   }
   res.statusCode=503;res.end(JSON.stringify({code:'OWNER_UI_OFFLINE',error:'Local UI review: live service unavailable',errorKey:'unified_owner_notice',environment:'owner-ui'}));
  });}}],resolve:{alias:{'@':fileURLToPath(new URL('.',import.meta.url))}},
 server:{host:'127.0.0.1',port:5173,strictPort:true},build:{outDir:'dist-owner-ui'}
});
