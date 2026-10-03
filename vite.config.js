import {defineConfig} from 'vite';
import react from '@vitejs/plugin-react';
import {fileURLToPath,URL} from 'node:url';
export default defineConfig({plugins:[react()],server:{forwardConsole:false,proxy:{'/api':{
 target:'http://127.0.0.1:8787',changeOrigin:true,
 configure(proxy){proxy.on('proxyReq',(outgoing,incoming)=>{
  // Translate only the trusted frontend origin. Foreign origins stay rejected by Worker.
  if(incoming.headers.host==='127.0.0.1:5173'&&incoming.headers.origin==='http://127.0.0.1:5173')outgoing.setHeader('Origin','http://127.0.0.1:8787');
 });}
}}},resolve:{alias:{'@':fileURLToPath(new URL('.',import.meta.url))}}});
